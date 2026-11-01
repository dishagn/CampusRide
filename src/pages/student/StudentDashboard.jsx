import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBus } from '../../context/BusContext';
import { CHECKIN_STATUS, PASSENGER_ROSTER_STATUS, CAMPUS_CONFIG } from '../../utils/constants';
import { evaluateCheckinCutoff, formatDateTime, formatTime } from '../../utils/dateFormatter';
import { calculateHaversineDistanceMeters } from '../../utils/haversine';
import LiveBusMap from '../../components/map/LiveBusMap';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import StatusIndicator from '../../components/common/StatusIndicator';
import {
  GraduationCap,
  Bus,
  MapPin,
  Clock,
  Phone,
  Mail,
  User,
  ShieldCheck,
  AlertTriangle,
  MessageSquare,
  Send,
  CheckCircle2,
  XCircle,
  FileText,
  Bell,
  HelpCircle
} from 'lucide-react';

export default function StudentDashboard() {
  const { profile } = useAuth();
  const {
    buses,
    routes,
    students,
    complaints,
    notifications,
    markStudentAttendance,
    submitComplaint,
  } = useBus();

  // Current student from global state
  const currentStudent = students.find(s => s.id === (profile?.id || 'stu-1')) || students[0];
  const assignedBus = buses.find(b => b.id === currentStudent.assignedBusId) || buses[0];
  const assignedRoute = routes.find(r => r.id === currentStudent.assignedRouteId) || routes[0];
  const studentComplaints = complaints.filter(c => c.studentId === currentStudent.id);

  // Check-in cutoff evaluation (10 minutes prior to scheduled stop arrival)
  const cutoffInfo = evaluateCheckinCutoff(currentStudent.stopScheduledTime, CAMPUS_CONFIG.CHECKIN_CUTOFF_MINUTES);
  const isCheckedIn = currentStudent.checkinStatus === CHECKIN_STATUS.CHECKED_IN;
  const isAbsent = currentStudent.rosterStatus === PASSENGER_ROSTER_STATUS.ABSENT;
  const isAutoCheckedOut = currentStudent.checkinStatus === CHECKIN_STATUS.AUTO_CHECKED_OUT;

  // Complaint form state
  const [complaintText, setComplaintText] = useState('');
  const [complaintSubmitting, setComplaintSubmitting] = useState(false);
  const [complaintError, setComplaintError] = useState('');
  const [complaintSuccess, setComplaintSuccess] = useState('');

  // Attendance feedback state
  const [attendanceMsg, setAttendanceMsg] = useState({ type: '', text: '' });

  // Handle Attendance Selection ("I'M COMING" vs "I'M ABSENT")
  async function handleAttendance(type) {
    setAttendanceMsg({ type: '', text: '' });
    const res = await markStudentAttendance(currentStudent.id, type);
    if (res.success) {
      setAttendanceMsg({ type: 'success', text: res.message });
    } else {
      setAttendanceMsg({ type: 'error', text: res.error });
    }
  }

  // Handle Complaint Submission
  async function handleComplaintSubmit(e) {
    e.preventDefault();
    setComplaintError('');
    setComplaintSuccess('');

    if (complaintText.trim().length < 10) {
      setComplaintError('Complaint description must be at least 10 characters long.');
      return;
    }

    setComplaintSubmitting(true);
    const res = await submitComplaint({
      studentId: currentStudent.id,
      studentName: currentStudent.name,
      studentUsn: currentStudent.usn,
      busNumber: assignedBus.busNumber,
      description: complaintText,
    });
    setComplaintSubmitting(false);

    if (res.success) {
      setComplaintSuccess('Complaint registered with Dispatch Admin. Status: OPEN.');
      setComplaintText('');
    } else {
      setComplaintError(res.error);
    }
  }

  // Distance from assigned bus coordinate to campus
  const busTelemetry = assignedBus?.currentLocation;
  const distToCampusMeters = busTelemetry?.lat && busTelemetry?.lon
    ? calculateHaversineDistanceMeters(
        busTelemetry.lat,
        busTelemetry.lon,
        CAMPUS_CONFIG.LATITUDE,
        CAMPUS_CONFIG.LONGITUDE
      )
    : 0;

  return (
    <div className="space-y-8">
      {/* 1. TOP AREA: HEADING & NOTIFICATION BAR (Per PRD Section 3 & 7) */}
      <div className="bg-campus-black text-white border-4 border-campus-black shadow-brutal p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-white uppercase tracking-tight">
                Student Transportation Portal
              </h1>
              <Badge variant="lime">MODULE 1</Badge>
            </div>
            <p className="font-mono text-xs text-campus-muted mt-1">
              Live Roster Telemetry • 10-Minute Pre-Arrival Cutoff • 200m Campus Geofence Auto-Checkout
            </p>
          </div>

          {/* Quick Notification Pill */}
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-white/10 border border-white/20 font-mono text-xs flex items-center gap-2">
              <Bell className="w-4 h-4 text-campus-lime" />
              <span>{notifications.length} Active System Notices</span>
            </div>
          </div>
        </div>

        {/* Latest Transit Notification Alert (if any) */}
        {notifications.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between gap-4 font-mono text-xs text-campus-lime">
            <div className="flex items-center gap-2 truncate">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span className="truncate">
                <strong>{notifications[0].title}:</strong> {notifications[0].message}
              </span>
            </div>
            <span className="text-[10px] text-campus-muted shrink-0">
              {formatTime(notifications[0].timestamp)}
            </span>
          </div>
        )}
      </div>

      {/* 2. 3-COLUMN UPPER SECTION (Per PRD Sketch: Left: Details | Centre: Check-in & Checkout | Right: Photo & Complaints) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT SECTION: STUDENT DETAILS (4 cols) */}
        <div className="lg:col-span-4">
          <Card
            title="Registered Student Details"
            subtitle="Retrieved securely from database"
            badge={<Badge variant="blue">PROFILE</Badge>}
            className="h-full flex flex-col justify-between"
          >
            <div className="space-y-3 font-mono text-xs">
              <div className="p-2.5 bg-campus-bg border border-campus-black">
                <span className="text-[10px] text-campus-muted block uppercase font-bold">Student Name</span>
                <span className="font-extrabold text-sm text-campus-black">{currentStudent.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-campus-bg border border-campus-black">
                  <span className="text-[10px] text-campus-muted block uppercase font-bold">USN</span>
                  <span className="font-bold text-campus-blue">{currentStudent.usn}</span>
                </div>
                <div className="p-2.5 bg-campus-bg border border-campus-black">
                  <span className="text-[10px] text-campus-muted block uppercase font-bold">Class / Sem</span>
                  <span className="font-bold text-campus-black">{currentStudent.classYear}</span>
                </div>
              </div>
              <div className="p-2.5 bg-campus-bg border border-campus-black">
                <span className="text-[10px] text-campus-muted block uppercase font-bold">Department</span>
                <span className="font-semibold text-campus-black">{currentStudent.department}</span>
              </div>
              <div className="p-2.5 bg-campus-bg border border-campus-black">
                <span className="text-[10px] text-campus-muted block uppercase font-bold">Home Address</span>
                <span className="text-campus-black leading-snug">{currentStudent.address}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-campus-bg border border-campus-black">
                  <span className="text-[10px] text-campus-muted block uppercase font-bold">Phone</span>
                  <span className="font-semibold text-campus-black text-[11px]">{currentStudent.phone}</span>
                </div>
                <div className="p-2 bg-campus-bg border border-campus-black">
                  <span className="text-[10px] text-campus-muted block uppercase font-bold">Email ID</span>
                  <span className="font-semibold text-campus-black text-[11px] truncate block">{currentStudent.email}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-campus-black/20 text-[10px] font-mono text-campus-muted">
              Data Privacy: Students can only view their own profile and assigned bus telemetry.
            </div>
          </Card>
        </div>

        {/* CENTRE SECTION: STUDENT CHECK-IN & AUTO CHECKOUT (4 cols) */}
        <div className="lg:col-span-4">
          <Card
            title="Journey Check-In &amp; Checkout"
            subtitle="Strict 10-Minute Cutoff Enforcement"
            badge={
              <Badge variant={isCheckedIn ? 'success' : isAbsent ? 'danger' : 'warning'}>
                {isCheckedIn ? 'CONFIRMED' : isAbsent ? 'ABSENT' : 'NOT UPDATED'}
              </Badge>
            }
            className="h-full flex flex-col justify-between"
          >
            <div className="space-y-4">
              {/* Assigned Bus & Stop Schedule Card */}
              <div className="p-3 bg-white border-2 border-campus-black shadow-brutal-sm space-y-1.5 font-mono text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-campus-muted uppercase text-[10px]">Today's Bus</span>
                  <span className="font-extrabold text-campus-blue">BUS {assignedBus.busNumber} ({assignedBus.registrationNumber})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-campus-muted uppercase text-[10px]">Assigned Stop</span>
                  <span className="font-extrabold text-campus-black">{currentStudent.assignedStopName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-campus-muted uppercase text-[10px]">Scheduled Arrival</span>
                  <span className="font-extrabold text-campus-black">{currentStudent.stopScheduledTime}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-campus-black/10">
                  <span className="text-rose-600 font-bold uppercase text-[10px]">Check-In Deadline</span>
                  <span className="font-bold text-rose-600">{cutoffInfo.formattedCutoffTime} (10m cutoff)</span>
                </div>
              </div>

              {/* Status Visual Indicator */}
              <div className="p-3 bg-campus-bg border-2 border-campus-black text-center">
                <span className="text-[10px] font-mono uppercase text-campus-muted block mb-1">Your Attendance Status</span>
                <StatusIndicator status={currentStudent.checkinStatus} />
                <div className="font-mono text-[11px] text-campus-muted mt-2">
                  {cutoffInfo.isPastCutoff ? (
                    <span className="text-rose-600 font-bold">Cutoff elapsed. Check-in is now locked for this journey.</span>
                  ) : (
                    <span>Window open: {cutoffInfo.minutesRemaining} mins remaining until cutoff</span>
                  )}
                </div>
              </div>

              {/* DUAL ACTION BUTTONS: [ I'M COMING ] & [ I'M ABSENT ] (Per drivers dashboard.pdf Page 26-28) */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="lime"
                  size="md"
                  onClick={() => handleAttendance('COMING')}
                  disabled={cutoffInfo.isPastCutoff || isAutoCheckedOut}
                  icon={CheckCircle2}
                >
                  I'M COMING
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => handleAttendance('ABSENT')}
                  disabled={cutoffInfo.isPastCutoff || isAutoCheckedOut}
                  className="hover:bg-rose-50 text-rose-700"
                  icon={XCircle}
                >
                  I'M ABSENT
                </Button>
              </div>

              {/* Feedback Alert */}
              {attendanceMsg.text && (
                <div
                  className={`p-2.5 border-2 font-mono text-xs ${
                    attendanceMsg.type === 'success'
                      ? 'bg-emerald-100 border-emerald-800 text-emerald-900'
                      : 'bg-rose-100 border-rose-800 text-rose-900'
                  }`}
                >
                  {attendanceMsg.text}
                </div>
              )}

              {/* AUTOMATIC CHECKOUT RADAR (Circular 200m GPS Geofence at 12.9716, 77.5946) */}
              <div className="p-3 bg-white border-2 border-campus-black font-mono text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-campus-muted">Campus Geofence:</span>
                  <span className="font-bold">200m Radius</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-campus-muted">Distance to College:</span>
                  <span className="font-bold text-campus-blue">
                    {distToCampusMeters > 1000 ? `${(distToCampusMeters / 1000).toFixed(2)} km` : `${distToCampusMeters} m`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-campus-muted">Auto Checkout:</span>
                  <span className={`font-bold ${distToCampusMeters <= 200 ? 'text-emerald-700' : 'text-campus-muted'}`}>
                    {distToCampusMeters <= 200 ? 'ARRIVED (AUTO-CHECKED OUT)' : 'PENDING ARRIVAL'}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT SECTION: STUDENT PHOTO, NAME, USN + COMPLAINT FORM (4 cols) */}
        <div className="lg:col-span-4">
          <Card
            title="Student Identity &amp; Helpdesk"
            subtitle="Direct Dispatch Grievance Pipeline"
            className="h-full flex flex-col justify-between"
          >
            {/* Student Photo, Name & USN Banner */}
            <div className="flex items-center gap-4 p-3 bg-campus-bg border-2 border-campus-black mb-4">
              <img
                src={currentStudent.profilePicUrl}
                alt={currentStudent.name}
                className="w-14 h-14 border-2 border-campus-black shadow-brutal-sm object-cover shrink-0"
              />
              <div className="overflow-hidden">
                <h3 className="font-heading font-extrabold text-base text-campus-black truncate">
                  {currentStudent.name}
                </h3>
                <Badge variant="blue" className="mt-0.5">{currentStudent.usn}</Badge>
                <div className="font-mono text-[10px] text-campus-muted mt-1 truncate">
                  Stop: {currentStudent.assignedStopName}
                </div>
              </div>
            </div>

            {/* Complaint Form (Per PRD Section 9: Auto date, Description min 10 chars, Submit button) */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="font-bold uppercase text-campus-black">Lodge Transport Complaint</span>
                <span className="text-[10px] text-campus-muted">{new Date().toLocaleDateString()}</span>
              </div>

              <form onSubmit={handleComplaintSubmit} className="space-y-2">
                <textarea
                  rows={3}
                  required
                  value={complaintText}
                  onChange={(e) => setComplaintText(e.target.value)}
                  placeholder="Describe timing delays, skipped bay, driver behavior, or AC issue..."
                  className="w-full p-2.5 font-sans text-xs bg-white border-2 border-campus-black shadow-brutal-sm focus:outline-none focus:bg-amber-50"
                />

                {complaintSuccess && (
                  <div className="p-2 bg-emerald-100 border border-emerald-800 text-emerald-800 font-mono text-[11px]">
                    {complaintSuccess}
                  </div>
                )}
                {complaintError && (
                  <div className="p-2 bg-rose-100 border border-rose-800 text-rose-800 font-mono text-[11px]">
                    {complaintError}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="orange"
                  size="sm"
                  className="w-full"
                  disabled={complaintSubmitting}
                  icon={Send}
                >
                  {complaintSubmitting ? 'Registering...' : 'Submit Complaint to Admin'}
                </Button>
              </form>

              {/* Recent Complaints History with Status Tracking */}
              {studentComplaints.length > 0 && (
                <div className="mt-3 pt-3 border-t border-campus-black/20">
                  <div className="font-mono text-[10px] uppercase font-bold text-campus-muted mb-2">
                    My Complaints ({studentComplaints.length})
                  </div>
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {studentComplaints.map(c => (
                      <div key={c.id} className="p-2 border border-campus-black bg-white text-xs">
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="font-bold">#{c.id.slice(-5).toUpperCase()}</span>
                          <Badge variant={c.status === 'RESOLVED' ? 'success' : 'warning'}>
                            {c.status}
                          </Badge>
                        </div>
                        <p className="font-sans text-[11px] text-campus-black mt-1 line-clamp-2">
                          "{c.description}"
                        </p>
                        {c.adminComment && (
                          <div className="mt-1 text-[10px] font-mono text-campus-blue">
                            <strong>Admin Reply:</strong> {c.adminComment}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* 3. LOWER SECTION: LIVE BUS TRACKING MAP, BUS DETAILS & ROUTE (Per PRD Section 3 & 10) */}
      <div className="space-y-6">
        <Card
          title={`Live Bus Tracking: Bus #${assignedBus.busNumber} (${assignedBus.registrationNumber})`}
          subtitle={`Route ${assignedBus.assignedRouteNumber}: ${assignedRoute.name} • Refreshes ~10s`}
          badge={<Badge variant="lime">LIVE GPS STREAM</Badge>}
        >
          <LiveBusMap bus={assignedBus} route={assignedRoute} height="520px" />
        </Card>

        {/* Assigned Vehicle, Driver & Route Information Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border-2 border-campus-black shadow-brutal p-4">
            <h4 className="font-heading font-bold text-xs uppercase text-campus-muted mb-2">Assigned Driver</h4>
            <div className="flex items-center gap-3">
              <img
                src={assignedBus.driver.photoUrl}
                alt={assignedBus.driver.name}
                className="w-12 h-12 border-2 border-campus-black object-cover shrink-0"
              />
              <div className="font-mono text-xs">
                <div className="font-extrabold text-sm text-campus-black">{assignedBus.driver.name}</div>
                <div className="text-campus-muted">Lic: {assignedBus.driver.licenseNumber}</div>
                <a href={`tel:${assignedBus.driver.phone}`} className="font-bold text-campus-blue underline">
                  {assignedBus.driver.phone}
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-campus-black shadow-brutal p-4 font-mono text-xs">
            <h4 className="font-heading font-bold text-xs uppercase text-campus-muted mb-2">Vehicle Specification</h4>
            <div className="space-y-1">
              <div>Registration: <span className="font-bold text-campus-black">{assignedBus.registrationNumber}</span></div>
              <div>Capacity: <span className="font-bold text-campus-black">{assignedBus.capacity} Passengers</span></div>
              <div>RC Document State: <span className="text-emerald-700 font-bold">{assignedBus.driver.rcStatus}</span></div>
            </div>
          </div>

          <div className="bg-white border-2 border-campus-black shadow-brutal p-4 font-mono text-xs">
            <h4 className="font-heading font-bold text-xs uppercase text-campus-muted mb-2">Route Summary</h4>
            <div className="space-y-1">
              <div>Route Name: <span className="font-bold text-campus-black truncate block">{assignedRoute.name}</span></div>
              <div>Total Distance: <span className="font-bold text-campus-black">{assignedRoute.totalDistanceKm} km</span></div>
              <div>Total Stops: <span className="font-bold text-campus-blue">10 Fixed verified bays</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
