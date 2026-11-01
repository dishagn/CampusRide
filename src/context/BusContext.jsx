import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  MOCK_BUSES,
  MOCK_ROUTES,
  MOCK_STUDENTS,
  MOCK_TEACHERS,
  MOCK_COMPLAINTS,
  MOCK_NOTIFICATIONS,
  MOCK_CHAT_MESSAGES,
  MOCK_AUDIT_LOGS,
} from '../services/mockData';
import {
  CAMPUS_CONFIG,
  CHECKIN_STATUS,
  COMPLAINT_STATUS,
  PASSENGER_ROSTER_STATUS,
  REASSIGNMENT_STATUS,
} from '../utils/constants';
import { calculateHaversineDistanceMeters, isInsideGeofence } from '../utils/haversine';
import { evaluateCheckinCutoff } from '../utils/dateFormatter';
import { supabase, isSupabaseConfigured } from '../services/supabase';

const BusContext = createContext(null);

export function BusProvider({ children }) {
  const [buses, setBuses] = useState(MOCK_BUSES);
  const [routes, setRoutes] = useState(MOCK_ROUTES);
  const [students, setStudents] = useState(MOCK_STUDENTS);
  const [teachers, setTeachers] = useState(MOCK_TEACHERS);
  const [complaints, setComplaints] = useState(MOCK_COMPLAINTS);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [chatMessages, setChatMessages] = useState(MOCK_CHAT_MESSAGES);
  const [auditLogs, setAuditLogs] = useState(MOCK_AUDIT_LOGS);
  
  // Simulation Controls
  const [isSimulatorRunning, setIsSimulatorRunning] = useState(false);
  const [simulationSpeedMultiplier, setSimulationSpeedMultiplier] = useState(1);
  const simIntervalRef = useRef(null);

  // Setup Supabase Realtime listeners and load cloud data if tables exist
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    async function loadCloudData() {
      try {
        const { data: cloudBuses, error: busErr } = await supabase.from('buses').select('*');
        if (!busErr && cloudBuses && cloudBuses.length > 0) {
          // Merge with mock routes and drivers
          setBuses(prev => prev.map(b => {
            const found = cloudBuses.find(cb => cb.bus_number === b.busNumber);
            return found ? { ...b, id: found.id, registrationNumber: found.registration_number } : b;
          }));
        }

        const { data: cloudLocations } = await supabase.from('live_bus_locations').select('*');
        if (cloudLocations && cloudLocations.length > 0) {
          setBuses(prev => prev.map(b => {
            const loc = cloudLocations.find(l => l.bus_id === b.id);
            if (loc) {
              return {
                ...b,
                currentLocation: {
                  ...b.currentLocation,
                  lat: loc.latitude,
                  lon: loc.longitude,
                  speed: loc.speed,
                  heading: loc.heading,
                  journeyStatus: loc.journey_status,
                  delayMinutes: loc.delay_minutes,
                  delayReason: loc.delay_reason,
                  updatedAt: loc.updated_at,
                }
              };
            }
            return b;
          }));
        }
      } catch (err) {
        console.info('[BusContext] Using local data cache while database migration initializes.');
      }
    }

    loadCloudData();

    const channel = supabase
      .channel('campus-ride-global')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_bus_locations' }, (payload) => {
        handleRealtimeBusLocation(payload);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'passenger_checkins' }, (payload) => {
        handleRealtimeCheckin(payload);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
        setChatMessages(prev => [payload.new, ...prev]);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        setNotifications(prev => [payload.new, ...prev]);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'complaints' }, (payload) => {
        handleRealtimeComplaint(payload);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function handleRealtimeBusLocation(payload) {
    if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
      const updated = payload.new;
      setBuses(prev => prev.map(bus => {
        if (bus.id === updated.bus_id || bus.busNumber === updated.bus_number) {
          return {
            ...bus,
            currentLocation: {
              ...bus.currentLocation,
              lat: updated.latitude,
              lon: updated.longitude,
              speed: updated.speed,
              heading: updated.heading,
              journeyStatus: updated.journey_status,
              updatedAt: updated.updated_at,
              delayMinutes: updated.delay_minutes,
              delayReason: updated.delay_reason,
            }
          };
        }
        return bus;
      }));
    }
  }

  function handleRealtimeCheckin(payload) {
    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
      const rec = payload.new;
      if (rec.student_id) {
        setStudents(prev => prev.map(s => s.id === rec.student_id ? { ...s, checkinStatus: rec.status, checkinTimestamp: rec.checked_in_at } : s));
      }
      if (rec.teacher_id) {
        setTeachers(prev => prev.map(t => t.id === rec.teacher_id ? { ...t, checkinStatus: rec.status, checkinTimestamp: rec.checked_in_at } : t));
      }
    }
  }

  function handleRealtimeComplaint(payload) {
    if (payload.eventType === 'INSERT') {
      setComplaints(prev => [payload.new, ...prev]);
    } else if (payload.eventType === 'UPDATE') {
      setComplaints(prev => prev.map(c => c.id === payload.new.id ? payload.new : c));
    }
  }

  /**
   * Student Attendance Confirmation (I'M COMING vs I'M ABSENT)
   * Adheres to strict 10-Minute Pre-Arrival Cutoff Enforcement
   */
  async function markStudentAttendance(studentId, attendanceType = 'COMING') {
    const student = students.find(s => s.id === studentId);
    if (!student) return { success: false, error: 'Student record not found.' };

    // Cutoff validation (must check in at least 10 minutes prior to scheduled stop arrival)
    const cutoffEval = evaluateCheckinCutoff(student.stopScheduledTime, CAMPUS_CONFIG.CHECKIN_CUTOFF_MINUTES);
    if (cutoffEval.isPastCutoff) {
      return {
        success: false,
        error: `Attendance window closed at ${cutoffEval.formattedCutoffTime} (strictly 10 mins before ${student.stopScheduledTime} arrival). Status remains unchanged.`,
      };
    }

    const timestamp = new Date().toISOString();
    const isComing = attendanceType === 'COMING';
    const newCheckinStatus = isComing ? CHECKIN_STATUS.CHECKED_IN : CHECKIN_STATUS.NOT_CHECKED_IN;
    const newRosterStatus = isComing ? PASSENGER_ROSTER_STATUS.COMING : PASSENGER_ROSTER_STATUS.ABSENT;

    // Update in-memory state
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        return {
          ...s,
          checkinStatus: newCheckinStatus,
          rosterStatus: newRosterStatus,
          checkinTimestamp: timestamp,
        };
      }
      return s;
    }));

    // Sync with Supabase if live
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('passenger_checkins').upsert({
          student_id: studentId,
          bus_id: student.assignedBusId,
          stop_id: student.assignedStopId,
          status: newCheckinStatus,
          roster_status: newRosterStatus,
          checked_in_at: timestamp,
        });
      } catch (e) {
        console.error('Supabase checkin error:', e);
      }
    }

    return {
      success: true,
      timestamp,
      rosterStatus: newRosterStatus,
      message: isComing
        ? 'Confirmed boarding! Driver passenger roster updated to COMING (Green).'
        : 'Marked ABSENT (Red). Driver informed to skip waiting countdown at your stop.',
    };
  }

  /**
   * Student Check-In with strict 10-Minute Pre-Arrival Cutoff Enforcement (Backward compatible)
   */
  async function checkinStudent(studentId) {
    return markStudentAttendance(studentId, 'COMING');
  }

  /**
   * Teacher Check-In with strict 10-Minute Pre-Arrival Cutoff Enforcement
   */
  async function checkinTeacher(teacherId) {
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return { success: false, error: 'Teacher record not found.' };

    const cutoffEval = evaluateCheckinCutoff(teacher.stopScheduledTime, CAMPUS_CONFIG.CHECKIN_CUTOFF_MINUTES);
    if (cutoffEval.isPastCutoff) {
      return {
        success: false,
        error: `Check-in closed at ${cutoffEval.formattedCutoffTime} (10 mins before ${teacher.stopScheduledTime}).`,
      };
    }

    const timestamp = new Date().toISOString();

    setTeachers(prev => prev.map(t => {
      if (t.id === teacherId) {
        return {
          ...t,
          checkinStatus: CHECKIN_STATUS.CHECKED_IN,
          checkinTimestamp: timestamp,
        };
      }
      return t;
    }));

    return { success: true, timestamp };
  }

  /**
   * Teacher status update (ON_TIME, LATE, ABSENT)
   */
  function updateTeacherStatus(teacherId, status) {
    setTeachers(prev => prev.map(t => t.id === teacherId ? { ...t, status } : t));
  }

  /**
   * Check geofence and trigger automatic checkout if arrived at campus
   */
  function checkCampusGeofenceForBus(busId, currentLat, currentLon) {
    const isInside = isInsideGeofence(
      currentLat,
      currentLon,
      CAMPUS_CONFIG.LATITUDE,
      CAMPUS_CONFIG.LONGITUDE,
      CAMPUS_CONFIG.GEOFENCE_RADIUS_METERS
    );

    if (isInside) {
      // Auto checkout all students & teachers on this bus who are checked in
      const now = new Date().toISOString();
      setStudents(prev => prev.map(s => {
        if (s.assignedBusId === busId && s.checkinStatus === CHECKIN_STATUS.CHECKED_IN) {
          return {
            ...s,
            checkinStatus: CHECKIN_STATUS.AUTO_CHECKED_OUT,
            checkoutTimestamp: now,
          };
        }
        return s;
      }));

      setTeachers(prev => prev.map(t => {
        if (t.assignedBusId === busId && t.checkinStatus === CHECKIN_STATUS.CHECKED_IN) {
          return {
            ...t,
            checkinStatus: CHECKIN_STATUS.AUTO_CHECKED_OUT,
            checkoutTimestamp: now,
          };
        }
        return t;
      }));

      // Update bus journey status
      setBuses(prev => prev.map(b => b.id === busId ? {
        ...b,
        currentLocation: {
          ...b.currentLocation,
          journeyStatus: 'ARRIVED_CAMPUS',
        }
      } : b));

      return true;
    }
    return false;
  }

  /**
   * Submit complaint (Student)
   */
  async function submitComplaint({ studentId, studentName, studentUsn, busNumber, description }) {
    if (!description || description.trim().length < 10) {
      return { success: false, error: 'Complaint description must be at least 10 characters long.' };
    }

    const newComplaint = {
      id: `cmp-${Date.now()}`,
      studentId,
      studentName,
      studentUsn,
      busNumber: busNumber || 1,
      description: description.trim(),
      submittedAt: new Date().toISOString(),
      status: COMPLAINT_STATUS.OPEN,
      adminComment: '',
      resolvedAt: null,
    };

    setComplaints(prev => [newComplaint, ...prev]);

    // Add notification to admin
    const newNotif = {
      id: `notif-${Date.now()}`,
      title: `New Student Complaint (Bus ${busNumber || 1})`,
      message: `${studentName} (${studentUsn}): "${description.substring(0, 60)}..."`,
      severity: 'warning',
      timestamp: new Date().toISOString(),
      busNumber,
    };
    setNotifications(prev => [newNotif, ...prev]);

    return { success: true, complaint: newComplaint };
  }

  /**
   * Admin resolves a complaint:
   * Mandatory Resolution Message: "Your query has been resolved."
   * Allows additional commentary and sends real-time notification to user.
   */
  function resolveComplaint(complaintId, additionalComment = '') {
    const mandatoryMessage = "Your query has been resolved.";
    const fullComment = additionalComment ? `${mandatoryMessage} ${additionalComment}` : mandatoryMessage;
    const resolvedAt = new Date().toISOString();

    let targetComplaint = null;

    setComplaints(prev => prev.map(c => {
      if (c.id === complaintId) {
        targetComplaint = {
          ...c,
          status: COMPLAINT_STATUS.RESOLVED,
          adminComment: fullComment,
          resolvedAt,
        };
        return targetComplaint;
      }
      return c;
    }));

    // Audit log
    const newLog = {
      id: `log-${Date.now()}`,
      action: 'COMPLAINT_RESOLVED',
      performedBy: 'admin.transport@campus.edu',
      targetUser: `Ticket #${complaintId}`,
      details: `Resolution dispatched with mandatory text: "${fullComment}"`,
      timestamp: resolvedAt,
    };
    setAuditLogs(prev => [newLog, ...prev]);

    // Realtime notification
    if (targetComplaint) {
      const notif = {
        id: `notif-${Date.now()}`,
        title: `Complaint #${complaintId.slice(-4).toUpperCase()} Resolved`,
        message: `${mandatoryMessage} ${additionalComment}`,
        severity: 'info',
        timestamp: resolvedAt,
        busNumber: targetComplaint.busNumber,
      };
      setNotifications(prev => [notif, ...prev]);
    }

    return { success: true };
  }

  /**
   * Admin Manual Check-in Override (Audit Logged)
   */
  function manualCheckinOverride(studentId, adminEmail = 'admin.transport@campus.edu', reason = 'Manual verification by Control Tower') {
    const student = students.find(s => s.id === studentId);
    if (!student) return { success: false, error: 'Student not found' };

    const timestamp = new Date().toISOString();

    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        return {
          ...s,
          checkinStatus: CHECKIN_STATUS.CHECKED_IN,
          checkinTimestamp: timestamp,
          isManualOverride: true,
        };
      }
      return s;
    }));

    // Record strictly in audit log
    const auditRecord = {
      id: `audit-${Date.now()}`,
      action: 'MANUAL_CHECKIN_OVERRIDE',
      performedBy: adminEmail,
      targetUser: `${student.usn} (${student.name})`,
      details: reason,
      timestamp,
    };
    setAuditLogs(prev => [auditRecord, ...prev]);

    return { success: true, timestamp };
  }

  /**
   * Emergency Teacher Reassignment
   */
  function reassignTeacher({ threadId, originalTeacherId, substituteTeacherId, delayReason }) {
    const original = teachers.find(t => t.id === originalTeacherId);
    const substitute = teachers.find(t => t.id === substituteTeacherId);

    const now = new Date().toISOString();

    // Log in audit trail
    const audit = {
      id: `audit-${Date.now()}`,
      action: 'TEACHER_REASSIGNMENT',
      performedBy: 'admin.transport@campus.edu',
      targetUser: `${substitute?.name || 'Substitute'} replacing ${original?.name || 'Original'}`,
      details: `Reason: ${delayReason}`,
      timestamp: now,
    };
    setAuditLogs(prev => [audit, ...prev]);

    // Send chat reply to thread
    const message = {
      id: `msg-${Date.now()}`,
      threadId: threadId || 'CHAT-TCH-ADMIN',
      senderId: 'admin-1',
      senderRole: 'admin',
      senderName: 'Control Tower Dispatch',
      recipientId: originalTeacherId,
      message: `Emergency coverage confirmed: ${substitute?.name || 'Substitute faculty'} has been reassigned to cover your scheduled duties.`,
      timestamp: now,
      type: 'ADMIN_REPLY',
    };
    setChatMessages(prev => [...prev, message]);

    return { success: true };
  }

  /**
   * Send teacher - admin chat message
   */
  function sendChatMessage({ threadId, senderId, senderRole, senderName, recipientId, message, type = 'STANDARD' }) {
    const newMsg = {
      id: `msg-${Date.now()}`,
      threadId,
      senderId,
      senderRole,
      senderName,
      recipientId,
      message,
      timestamp: new Date().toISOString(),
      type,
    };
    setChatMessages(prev => [...prev, newMsg]);
    return newMsg;
  }

  /**
   * GPS Simulator (for development and test purposes)
   * Moves Bus 1 smoothly along Route 1 stops towards the campus.
   */
  function toggleGpsSimulator() {
    if (isSimulatorRunning) {
      clearInterval(simIntervalRef.current);
      setIsSimulatorRunning(false);
    } else {
      setIsSimulatorRunning(true);
      startSimulationLoop();
    }
  }

  function startSimulationLoop() {
    const route1 = routes.find(r => r.routeNumber === 1);
    if (!route1) return;

    let stopIndex = 2; // Start from Kundalahalli Gate
    let step = 0;
    const totalSteps = 15;

    simIntervalRef.current = setInterval(() => {
      setBuses(prev => prev.map(bus => {
        if (bus.busNumber === 1) {
          const currentStop = route1.stops[stopIndex];
          const nextStop = route1.stops[Math.min(stopIndex + 1, route1.stops.length - 1)];

          // Interpolate coordinate between currentStop and nextStop
          step = (step + 1) % totalSteps;
          if (step === 0) {
            stopIndex = (stopIndex + 1) % (route1.stops.length);
          }

          const ratio = step / totalSteps;
          const lat = currentStop.lat + (nextStop.lat - currentStop.lat) * ratio;
          const lon = currentStop.lon + (nextStop.lon - currentStop.lon) * ratio;
          const speed = 34 + Math.round(Math.random() * 8);

          // Check campus geofence
          const distToCampus = calculateHaversineDistanceMeters(lat, lon, CAMPUS_CONFIG.LATITUDE, CAMPUS_CONFIG.LONGITUDE);
          const reachedCampus = distToCampus <= CAMPUS_CONFIG.GEOFENCE_RADIUS_METERS;

          return {
            ...bus,
            currentLocation: {
              ...bus.currentLocation,
              lat,
              lon,
              speed,
              updatedAt: new Date().toISOString(),
              currentStopSequence: currentStop.sequence,
              currentStopName: currentStop.name,
              nextStopSequence: nextStop.sequence,
              nextStopName: nextStop.name,
              journeyStatus: reachedCampus ? 'ARRIVED_CAMPUS' : 'IN_TRANSIT',
              isSimulated: true, // Clearly marked DEMO DATA
            }
          };
        }
        return bus;
      }));
    }, 3000);
  }

  // Cleanup simulation on unmount
  useEffect(() => {
    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, []);

  const value = {
    buses,
    routes,
    students,
    teachers,
    complaints,
    notifications,
    chatMessages,
    auditLogs,
    checkinStudent,
    markStudentAttendance,
    checkinTeacher,
    updateTeacherStatus,
    submitComplaint,
    resolveComplaint,
    manualCheckinOverride,
    reassignTeacher,
    sendChatMessage,
    checkCampusGeofenceForBus,
    isSimulatorRunning,
    toggleGpsSimulator,
  };

  return <BusContext.Provider value={value}>{children}</BusContext.Provider>;
}

export function useBus() {
  const context = useContext(BusContext);
  if (!context) {
    throw new Error('useBus must be used within a BusProvider');
  }
  return context;
}

