import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBus } from '../../context/BusContext';
import { CHECKIN_STATUS, COMPLAINT_STATUS, CAMPUS_CONFIG } from '../../utils/constants';
import { formatDateTime, formatTime, isTelemetryStale } from '../../utils/dateFormatter';
import LiveBusMap from '../../components/map/LiveBusMap';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import StatusIndicator from '../../components/common/StatusIndicator';
import {
  Shield,
  Bus,
  Users,
  GraduationCap,
  Briefcase,
  AlertTriangle,
  Clock,
  Phone,
  FileCheck,
  CheckCircle2,
  XCircle,
  FileText,
  Search,
  Filter,
  ArrowRight,
  UserCheck,
  Send,
  MessageSquare,
  AlertCircle
} from 'lucide-react';

export default function AdminControlTower() {
  const { profile } = useAuth();
  const {
    buses,
    routes,
    students,
    teachers,
    complaints,
    auditLogs,
    chatMessages,
    resolveComplaint,
    manualCheckinOverride,
    reassignTeacher,
    sendChatMessage,
  } = useBus();

  // Active selected bus for detail drawer (defaults to Bus 1)
  const [selectedBusNumber, setSelectedBusNumber] = useState(1);
  const selectedBus = buses.find(b => b.busNumber === selectedBusNumber) || buses[0];
  const selectedRoute = routes.find(r => r.routeNumber === selectedBus.assignedRouteNumber) || routes[0];

  // Filtering for complaints
  const [complaintFilter, setComplaintFilter] = useState('ALL');
  const [resolvingId, setResolvingId] = useState(null);
  const [adminResolutionComment, setAdminResolutionComment] = useState('');

  // Emergency teacher reassignment modal state
  const [reassignmentModalOpen, setReassignmentModalOpen] = useState(false);
  const [selectedTeacherForCoverage, setSelectedTeacherForCoverage] = useState(teachers[1]); // Prof. Rajesh Kulkarni (LATE)
  const [selectedSubstituteTeacher, setSelectedSubstituteTeacher] = useState(teachers[3]); // Prof. Vikram Sen
  const [reassignmentReason, setReassignmentReason] = useState('Late due to waterlogging near Sony World. Coverage required for CS402 Machine Learning at 8:45 AM.');

  // Manual Check-in Override Modal state
  const [manualOverrideModalOpen, setManualOverrideModalOpen] = useState(false);
  const [targetStudentForOverride, setTargetStudentForOverride] = useState(null);
  const [overrideReason, setOverrideReason] = useState('Student phone battery depleted. Physical identity confirmed at bus boarding gate.');

  // Fleet Statistics
  const totalBuses = buses.length;
  const activeJourneys = buses.filter(b => b.currentLocation?.journeyStatus === 'IN_TRANSIT').length;
  const delayedBuses = buses.filter(b => (b.currentLocation?.delayMinutes || 0) > CAMPUS_CONFIG.DELAY_ALERT_THRESHOLD_MINUTES).length;
  const openComplaints = complaints.filter(c => c.status === COMPLAINT_STATUS.OPEN).length;
  const checkedInStudents = students.filter(s => s.checkinStatus === CHECKIN_STATUS.CHECKED_IN).length;
  const checkedInTeachers = teachers.filter(t => t.checkinStatus === CHECKIN_STATUS.CHECKED_IN).length;

  // Passengers for selected bus
  const busStudents = students.filter(s => s.assignedBusNumber === selectedBus.busNumber);
  const busTeachers = teachers.filter(t => t.assignedBusNumber === selectedBus.busNumber);

  // Complaints filter
  const filteredComplaints = complaints.filter(c => {
    if (complaintFilter === 'ALL') return true;
    return c.status === complaintFilter;
  });

  // Handle complaint resolution
  function handleResolveComplaint(complaintId) {
    resolveComplaint(complaintId, adminResolutionComment.trim());
    setResolvingId(null);
    setAdminResolutionComment('');
  }

  // Handle manual override
  function executeManualOverride() {
    if (!targetStudentForOverride) return;
    manualCheckinOverride(targetStudentForOverride.id, profile?.email || 'admin.transport@campus.edu', overrideReason);
    setManualOverrideModalOpen(false);
    setTargetStudentForOverride(null);
  }

  // Handle emergency reassignment
  function executeReassignment() {
    reassignTeacher({
      threadId: selectedTeacherForCoverage.threadId,
      originalTeacherId: selectedTeacherForCoverage.id,
      substituteTeacherId: selectedSubstituteTeacher.id,
      delayReason: reassignmentReason,
    });
    setReassignmentModalOpen(false);
  }

  return (
    <div className="space-y-8">
      {/* Control Tower Header */}
      <div className="bg-campus-black text-white border-4 border-campus-black shadow-brutal p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-campus-lime border-2 border-white flex items-center justify-center shrink-0">
              <Shield className="w-8 h-8 text-campus-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-white uppercase tracking-tight">
                  Control Tower &amp; Governance Center
                </h1>
                <Badge variant="lime">DISPATCH CENTRAL</Badge>
              </div>
              <p className="font-mono text-xs text-campus-muted mt-1">
                Centralized Transit Telemetry • 7 Buses • 7 Routes • Campus Geofence 200m
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="orange"
              size="sm"
              onClick={() => setReassignmentModalOpen(true)}
              icon={UserCheck}
            >
              Emergency Teacher Coverage Tool
            </Button>
          </div>
        </div>

        {/* 7 Fleet Operational KPI Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-6 pt-6 border-t border-campus-muted/30">
          <div className="bg-white/10 p-3 border border-white/20">
            <div className="font-mono text-[10px] uppercase text-campus-muted">Total Fleet</div>
            <div className="font-mono font-extrabold text-2xl text-white">{totalBuses} Buses</div>
          </div>
          <div className="bg-white/10 p-3 border border-white/20">
            <div className="font-mono text-[10px] uppercase text-campus-muted">Active Journeys</div>
            <div className="font-mono font-extrabold text-2xl text-emerald-400">{activeJourneys} In Transit</div>
          </div>
          <div className="bg-white/10 p-3 border border-white/20">
            <div className="font-mono text-[10px] uppercase text-campus-muted">Delayed Buses (&gt;3m)</div>
            <div className="font-mono font-extrabold text-2xl text-amber-400">{delayedBuses} Alerts</div>
          </div>
          <div className="bg-white/10 p-3 border border-white/20">
            <div className="font-mono text-[10px] uppercase text-campus-muted">Boarding Students</div>
            <div className="font-mono font-extrabold text-2xl text-campus-lime">{checkedInStudents} Checked In</div>
          </div>
          <div className="bg-white/10 p-3 border border-white/20">
            <div className="font-mono text-[10px] uppercase text-campus-muted">Boarding Teachers</div>
            <div className="font-mono font-extrabold text-2xl text-blue-400">{checkedInTeachers} Checked In</div>
          </div>
          <div className="bg-white/10 p-3 border border-white/20">
            <div className="font-mono text-[10px] uppercase text-campus-muted">Open Complaints</div>
            <div className="font-mono font-extrabold text-2xl text-rose-400">{openComplaints} Action Req.</div>
          </div>
        </div>
      </div>

      {/* SECTION 1: BUS MANAGEMENT (BUSES 1 TO 7) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-extrabold text-2xl text-campus-black uppercase">
            Fleet Management — Buses 1 through 7
          </h2>
          <span className="font-mono text-xs text-campus-muted">Click any bus card to inspect roster and telemetry</span>
        </div>

        {/* 7 Bus Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {buses.map(bus => {
            const isSelected = bus.busNumber === selectedBusNumber;
            const isDelayed = (bus.currentLocation?.delayMinutes || 0) > CAMPUS_CONFIG.DELAY_ALERT_THRESHOLD_MINUTES;
            const isStale = isTelemetryStale(bus.currentLocation?.updatedAt, CAMPUS_CONFIG.STALE_LOCATION_THRESHOLD_SECONDS);

            return (
              <button
                key={bus.id}
                onClick={() => setSelectedBusNumber(bus.busNumber)}
                className={`p-3 border-2 border-campus-black text-left transition-all relative ${
                  isSelected
                    ? 'bg-campus-blue text-white shadow-brutal-sm -translate-y-1'
                    : isDelayed
                    ? 'bg-amber-100 border-amber-900 text-campus-black hover:bg-amber-200'
                    : 'bg-white text-campus-black hover:bg-campus-bg'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-heading font-extrabold text-sm uppercase">Bus {bus.busNumber}</span>
                  {isDelayed && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                  )}
                </div>
                <div className={`font-mono text-[10px] truncate ${isSelected ? 'text-white/80' : 'text-campus-muted'}`}>
                  {bus.registrationNumber}
                </div>
                <div className={`font-mono text-[11px] font-bold mt-1 ${isSelected ? 'text-campus-lime' : 'text-campus-blue'}`}>
                  {bus.currentLocation?.speed?.toFixed(0)} km/h • R-{bus.assignedRouteNumber}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* SECTION 2: DETAILED BUS DASHBOARD & LIVE TELEMETRY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Live Map & Stop Sequence (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card
            title={`Active Fleet Telemetry: Bus #${selectedBus.busNumber} (${selectedBus.registrationNumber})`}
            subtitle={`Route ${selectedBus.assignedRouteNumber}: ${selectedRoute.name}`}
            badge={<Badge variant="blue">LIVE GPS</Badge>}
          >
            <LiveBusMap bus={selectedBus} route={selectedRoute} height="440px" />
          </Card>

          {/* Driver Information Card & Action Capability */}
          <Card title="Assigned Driver Credentials & RC State">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={selectedBus.driver.photoUrl}
                  alt={selectedBus.driver.name}
                  className="w-12 h-12 border-2 border-campus-black object-cover shrink-0"
                />
                <div>
                  <h4 className="font-heading font-bold text-base text-campus-black">{selectedBus.driver.name}</h4>
                  <p className="font-mono text-xs text-campus-muted">
                    License: {selectedBus.driver.licenseNumber}
                  </p>
                  <p className="font-mono text-xs text-campus-muted">
                    RC State: <strong className="text-emerald-700">{selectedBus.driver.rcStatus}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a href={`tel:${selectedBus.driver.phone}`}>
                  <Button variant="outline" size="sm" icon={Phone}>
                    Call Driver
                  </Button>
                </a>
                <a href={selectedBus.driver.rcDocumentUrl} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm" icon={FileText}>
                    View RC Doc
                  </Button>
                </a>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Passenger Manifest & Manual Overrides (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Boarding Students Table */}
          <Card
            title={`Boarding Students (Bus ${selectedBus.busNumber})`}
            subtitle="Adhering to strict 10-minute checkin cutoff"
            badge={<Badge variant="lime">{busStudents.length} Students</Badge>}
          >
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {busStudents.map(student => (
                <div
                  key={student.id}
                  className="p-3 border-2 border-campus-black bg-campus-bg flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-bold text-xs text-campus-black">{student.name}</span>
                      <span className="font-mono text-[10px] text-campus-muted">{student.usn}</span>
                    </div>
                    <div className="font-mono text-[11px] text-campus-muted mt-0.5">
                      Stop: <strong>{student.assignedStopName}</strong> ({student.stopScheduledTime})
                    </div>
                    <div className="mt-1">
                      <StatusIndicator status={student.checkinStatus} />
                    </div>
                  </div>

                  {student.checkinStatus !== CHECKIN_STATUS.CHECKED_IN && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTargetStudentForOverride(student);
                        setManualOverrideModalOpen(true);
                      }}
                      className="text-[10px] py-1 px-2"
                    >
                      Override
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Boarding Teachers Table */}
          <Card
            title={`Boarding Faculty (Bus ${selectedBus.busNumber})`}
            subtitle="Emergency Dynamic Reassignment Linked"
            badge={<Badge variant="orange">{busTeachers.length} Faculty</Badge>}
          >
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {busTeachers.map(tch => (
                <div
                  key={tch.id}
                  className="p-3 border-2 border-campus-black bg-campus-bg flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-bold text-xs text-campus-black">{tch.name}</span>
                      <Badge variant="orange" className="text-[9px]">{tch.employeeId}</Badge>
                    </div>
                    <div className="font-mono text-[11px] text-campus-muted mt-0.5">
                      {tch.department} • Stop: {tch.assignedStopName}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusIndicator status={tch.checkinStatus} />
                      <Badge variant={tch.status === 'ON_TIME' ? 'success' : tch.status === 'LATE' ? 'warning' : 'danger'}>
                        {tch.status}
                      </Badge>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTeacherForCoverage(tch);
                      setReassignmentModalOpen(true);
                    }}
                    className="text-[10px] py-1 px-2"
                  >
                    Reassign
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* SECTION 3: COMPLAINT RESOLUTION WORKFLOW ENGINE */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-heading font-extrabold text-2xl text-campus-black uppercase">
              Complaint Resolution Workflow Engine
            </h2>
            <p className="font-mono text-xs text-campus-muted">
              Inward tickets from student portals. Resolution automatically issues mandatory text &amp; push notification.
            </p>
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-2">
            {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map(st => (
              <button
                key={st}
                onClick={() => setComplaintFilter(st)}
                className={`px-3 py-1 font-mono text-xs font-bold uppercase border-2 border-campus-black transition-all ${
                  complaintFilter === st ? 'bg-campus-black text-white shadow-brutal-sm' : 'bg-white hover:bg-neutral-100'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Complaints Table Card */}
        <div className="bg-white border-2 border-campus-black shadow-brutal p-4 space-y-4">
          <div className="space-y-3">
            {filteredComplaints.length === 0 ? (
              <div className="p-8 text-center font-mono text-xs text-campus-muted">
                No tickets found for selected status filter.
              </div>
            ) : (
              filteredComplaints.map(c => (
                <div
                  key={c.id}
                  className="p-4 border-2 border-campus-black bg-campus-bg flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs text-campus-black">
                        #{c.id.slice(-6).toUpperCase()}
                      </span>
                      <Badge variant="blue">BUS {c.busNumber}</Badge>
                      <Badge
                        variant={c.status === 'RESOLVED' ? 'success' : c.status === 'IN_PROGRESS' ? 'warning' : 'danger'}
                      >
                        {c.status}
                      </Badge>
                      <span className="font-mono text-[11px] text-campus-muted">
                        Submitted by <strong>{c.studentName}</strong> ({c.studentUsn}) • {formatDateTime(c.submittedAt)}
                      </span>
                    </div>

                    <p className="font-sans text-xs text-campus-black leading-relaxed">
                      "{c.description}"
                    </p>

                    {c.adminComment && (
                      <div className="mt-2 p-2 bg-white border border-campus-black font-mono text-[11px] text-campus-blue">
                        <strong>Resolution Notice:</strong> {c.adminComment}
                      </div>
                    )}
                  </div>

                  {c.status !== COMPLAINT_STATUS.RESOLVED && (
                    <div className="shrink-0">
                      {resolvingId === c.id ? (
                        <div className="flex flex-col gap-2 w-72">
                          <input
                            type="text"
                            value={adminResolutionComment}
                            onChange={(e) => setAdminResolutionComment(e.target.value)}
                            placeholder="Additional admin commentary..."
                            className="p-1.5 font-sans text-xs bg-white border border-campus-black"
                          />
                          <div className="font-mono text-[9px] text-campus-muted">
                            Mandatory "Your query has been resolved." will be automatically prefixed.
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleResolveComplaint(c.id)}
                              className="flex-1"
                            >
                              Confirm
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setResolvingId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="lime"
                          size="sm"
                          onClick={() => setResolvingId(c.id)}
                          icon={CheckCircle2}
                        >
                          Resolve Ticket
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* SECTION 4: AUDIT LOG VIEWER */}
      <section className="space-y-4">
        <h2 className="font-heading font-extrabold text-2xl text-campus-black uppercase">
          Regulatory Dispatch Audit Trail
        </h2>
        <Card title="System Audit Logs" subtitle="Immutable record of manual overrides, resolutions, and reassignments">
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {auditLogs.map(log => (
              <div key={log.id} className="p-2.5 border border-campus-black bg-white flex items-center justify-between text-xs font-mono">
                <div>
                  <div className="font-bold text-campus-black flex items-center gap-2">
                    <Badge variant="blue">{log.action}</Badge>
                    <span>Target: {log.targetUser}</span>
                  </div>
                  <div className="text-campus-muted text-[11px] mt-0.5">
                    {log.details}
                  </div>
                </div>
                <div className="text-right text-[10px] text-campus-muted shrink-0 pl-4">
                  <div>By: {log.performedBy}</div>
                  <div>{formatTime(log.timestamp)}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* MODAL 1: EMERGENCY TEACHER WORK REASSIGNMENT */}
      {reassignmentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-4 border-campus-black shadow-brutal-lg max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-campus-black pb-3">
              <h3 className="font-heading font-extrabold text-lg uppercase text-campus-black">
                Teacher Emergency Work Coverage
              </h3>
              <button
                onClick={() => setReassignmentModalOpen(false)}
                className="font-mono text-sm font-bold p-1 hover:bg-neutral-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block font-bold mb-1 text-campus-black">Delayed / Absent Teacher:</label>
                <div className="p-2 border-2 border-campus-black bg-campus-bg">
                  {selectedTeacherForCoverage?.name} ({selectedTeacherForCoverage?.employeeId}) — {selectedTeacherForCoverage?.department}
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1 text-campus-black">Substitute Faculty Assignment:</label>
                <select
                  value={selectedSubstituteTeacher?.id}
                  onChange={(e) => setSelectedSubstituteTeacher(teachers.find(t => t.id === e.target.value))}
                  className="w-full p-2 border-2 border-campus-black bg-white"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.department} - {t.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1 text-campus-black">Emergency Delay Reason:</label>
                <textarea
                  rows={3}
                  value={reassignmentReason}
                  onChange={(e) => setReassignmentReason(e.target.value)}
                  className="w-full p-2 border-2 border-campus-black bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t-2 border-campus-black">
              <Button variant="outline" size="sm" onClick={() => setReassignmentModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="orange" size="sm" onClick={executeReassignment} icon={CheckCircle2}>
                Confirm Reassignment &amp; Dispatch Alert
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: MANUAL CHECK-IN OVERRIDE (WITH AUDIT LOGGING) */}
      {manualOverrideModalOpen && targetStudentForOverride && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-4 border-campus-black shadow-brutal-lg max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-campus-black pb-3">
              <h3 className="font-heading font-extrabold text-lg uppercase text-campus-black">
                Manual Check-In Override
              </h3>
              <button
                onClick={() => setManualOverrideModalOpen(false)}
                className="font-mono text-sm font-bold p-1 hover:bg-neutral-100"
              >
                ✕
              </button>
            </div>

            <div className="font-mono text-xs space-y-3">
              <div className="p-3 bg-amber-50 border border-amber-900 text-amber-900">
                <strong>REGULATORY NOTICE:</strong> Manual check-in overrides bypass the 10-minute pre-arrival cutoff and are permanently recorded in the system audit logs with your administrative identity.
              </div>

              <div>
                <span className="text-campus-muted block">TARGET STUDENT:</span>
                <span className="font-bold text-campus-black">{targetStudentForOverride.name} ({targetStudentForOverride.usn})</span>
              </div>

              <div>
                <label className="block font-bold mb-1">Administrative Justification / Reason:</label>
                <textarea
                  rows={3}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full p-2 border-2 border-campus-black bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t-2 border-campus-black">
              <Button variant="outline" size="sm" onClick={() => setManualOverrideModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={executeManualOverride}>
                Execute Override
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

