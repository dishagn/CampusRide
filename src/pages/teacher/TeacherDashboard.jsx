import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBus } from '../../context/BusContext';
import { TEACHER_STATUS, CHECKIN_STATUS, CAMPUS_CONFIG } from '../../utils/constants';
import { evaluateCheckinCutoff, formatTime, formatDateTime } from '../../utils/dateFormatter';
import LiveBusMap from '../../components/map/LiveBusMap';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import StatusIndicator from '../../components/common/StatusIndicator';
import {
  Briefcase,
  Bus,
  Clock,
  Send,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  UserCheck,
  Phone,
  Mail
} from 'lucide-react';

export default function TeacherDashboard() {
  const { profile } = useAuth();
  const {
    buses,
    routes,
    teachers,
    chatMessages,
    checkinTeacher,
    updateTeacherStatus,
    sendChatMessage,
  } = useBus();

  // Current teacher
  const currentTeacher = teachers.find(t => t.id === (profile?.id || 'tch-1')) || teachers[0];
  const assignedBus = buses.find(b => b.id === currentTeacher.assignedBusId) || buses[0];
  const assignedRoute = routes.find(r => r.id === currentTeacher.assignedRouteId) || routes[0];

  const cutoffInfo = evaluateCheckinCutoff(currentTeacher.stopScheduledTime, CAMPUS_CONFIG.CHECKIN_CUTOFF_MINUTES);
  const isCheckedIn = currentTeacher.checkinStatus === CHECKIN_STATUS.CHECKED_IN;

  // Filter messages for current teacher's thread
  const threadId = currentTeacher.threadId || `CHAT-TCH${currentTeacher.employeeId}-ADMIN`;
  const myMessages = chatMessages.filter(m => m.threadId === threadId);

  // Chat message state
  const [chatInput, setChatInput] = useState('');
  const [messageType, setMessageType] = useState('STANDARD');

  // Checkin message state
  const [checkinMsg, setCheckinMsg] = useState({ type: '', text: '' });

  async function handleCheckin() {
    setCheckinMsg({ type: '', text: '' });
    const res = await checkinTeacher(currentTeacher.id);
    if (res.success) {
      setCheckinMsg({ type: 'success', text: 'Faculty transport check-in verified. Driver notified.' });
    } else {
      setCheckinMsg({ type: 'error', text: res.error });
    }
  }

  function handleStatusToggle(newStatus) {
    updateTeacherStatus(currentTeacher.id, newStatus);
    if (newStatus === TEACHER_STATUS.LATE || newStatus === TEACHER_STATUS.ABSENT) {
      // Auto draft chat notice for Admin
      const text = newStatus === TEACHER_STATUS.LATE
        ? `Status Alert: Running late for morning transport at stop ${currentTeacher.assignedStopName}. Requesting monitoring.`
        : `Status Alert: Marked ABSENT for today. Requesting emergency lecture substitution coverage.`;
      
      sendChatMessage({
        threadId,
        senderId: currentTeacher.id,
        senderRole: 'teacher',
        senderName: currentTeacher.name,
        recipientId: 'admin-1',
        message: text,
        type: 'EMERGENCY_ALERT',
      });
    }
  }

  function handleSendChat(e) {
    e.preventDefault();
    if (!chatInput.trim()) return;

    sendChatMessage({
      threadId,
      senderId: currentTeacher.id,
      senderRole: 'teacher',
      senderName: currentTeacher.name,
      recipientId: 'admin-1',
      message: chatInput.trim(),
      type: messageType,
    });

    setChatInput('');
  }

  return (
    <div className="space-y-8">
      {/* Top Banner: Faculty Information & Transport Status */}
      <div className="bg-white border-4 border-campus-black shadow-brutal p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <img
              src={currentTeacher.profilePicUrl}
              alt={currentTeacher.name}
              className="w-16 h-16 border-2 border-campus-black shadow-brutal-sm object-cover shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-campus-black">
                  {currentTeacher.name}
                </h1>
                <Badge variant="orange">{currentTeacher.employeeId}</Badge>
                <StatusIndicator status={currentTeacher.checkinStatus} />
              </div>
              <p className="font-mono text-xs text-campus-muted mt-1">
                {currentTeacher.designation} • {currentTeacher.department}
              </p>
            </div>
          </div>

          {/* Quick-Action Status Toggle (ON_TIME, LATE, ABSENT) */}
          <div className="bg-campus-bg border-2 border-campus-black p-4 flex flex-col gap-2">
            <span className="font-mono text-xs font-bold uppercase text-campus-black">
              Faculty Transit Status:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleStatusToggle(TEACHER_STATUS.ON_TIME)}
                className={`px-3 py-1.5 font-mono text-xs font-bold uppercase border-2 border-campus-black transition-all ${
                  currentTeacher.status === TEACHER_STATUS.ON_TIME
                    ? 'bg-emerald-500 text-white shadow-brutal-sm'
                    : 'bg-white hover:bg-neutral-100'
                }`}
              >
                ON TIME
              </button>
              <button
                type="button"
                onClick={() => handleStatusToggle(TEACHER_STATUS.LATE)}
                className={`px-3 py-1.5 font-mono text-xs font-bold uppercase border-2 border-campus-black transition-all ${
                  currentTeacher.status === TEACHER_STATUS.LATE
                    ? 'bg-amber-400 text-campus-black shadow-brutal-sm'
                    : 'bg-white hover:bg-neutral-100'
                }`}
              >
                LATE
              </button>
              <button
                type="button"
                onClick={() => handleStatusToggle(TEACHER_STATUS.ABSENT)}
                className={`px-3 py-1.5 font-mono text-xs font-bold uppercase border-2 border-campus-black transition-all ${
                  currentTeacher.status === TEACHER_STATUS.ABSENT
                    ? 'bg-rose-500 text-white shadow-brutal-sm'
                    : 'bg-white hover:bg-neutral-100'
                }`}
              >
                ABSENT
              </button>
            </div>
          </div>
        </div>

        {/* Boarding Status Strip */}
        <div className="mt-4 pt-4 border-t-2 border-campus-black flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
          <div>
            Assigned Stop: <strong className="text-campus-blue">{currentTeacher.assignedStopName}</strong> ({currentTeacher.stopScheduledTime})
            <span className="text-rose-600 ml-2 font-bold">(Cutoff: {cutoffInfo.formattedCutoffTime})</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={isCheckedIn ? 'outline' : 'lime'}
              size="sm"
              onClick={handleCheckin}
              disabled={isCheckedIn || cutoffInfo.isPastCutoff}
              icon={CheckCircle2}
            >
              {isCheckedIn ? 'Coming Recorded' : cutoffInfo.isPastCutoff ? 'Cutoff Elapsed' : 'I\'m Coming'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusToggle(TEACHER_STATUS.ABSENT)}
              disabled={cutoffInfo.isPastCutoff}
              className="text-rose-700 hover:bg-rose-50"
              icon={XCircle}
            >
              I'm Absent
            </Button>
          </div>
        </div>

        {checkinMsg.text && (
          <div
            className={`mt-3 p-2 border-2 font-mono text-xs ${
              checkinMsg.type === 'success'
                ? 'bg-emerald-100 border-emerald-800 text-emerald-900'
                : 'bg-rose-100 border-rose-800 text-rose-900'
            }`}
          >
            {checkinMsg.text}
          </div>
        )}
      </div>

      {/* Grid: Live Bus Map (8 cols) & Private Admin Chat Engine (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Map */}
        <div className="lg:col-span-7 space-y-6">
          <Card
            title={`Assigned Bus Telemetry: Bus #${assignedBus.busNumber}`}
            subtitle={`100-Meter Movement Rule Active • Driver: ${assignedBus.driver.name}`}
            badge={<Badge variant="blue">LIVE GPS</Badge>}
          >
            <LiveBusMap bus={assignedBus} route={assignedRoute} height="480px" />
          </Card>

          {/* Assigned Bus Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border-2 border-campus-black p-3 font-mono text-xs">
              <span className="text-campus-muted block text-[10px]">VEHICLE REGISTRATION</span>
              <span className="font-bold text-campus-black text-sm">{assignedBus.registrationNumber}</span>
            </div>
            <div className="bg-white border-2 border-campus-black p-3 font-mono text-xs">
              <span className="text-campus-muted block text-[10px]">DRIVER PHONE</span>
              <a href={`tel:${assignedBus.driver.phone}`} className="font-bold text-campus-blue text-sm underline">
                {assignedBus.driver.phone}
              </a>
            </div>
            <div className="bg-white border-2 border-campus-black p-3 font-mono text-xs">
              <span className="text-campus-muted block text-[10px]">CURRENT SPEED</span>
              <span className="font-bold text-campus-black text-sm">
                {assignedBus.currentLocation?.speed?.toFixed(1) || '0.0'} km/h
              </span>
            </div>
          </div>
        </div>

        {/* Right: Exclusive Teacher-Admin Direct Messaging Pipeline */}
        <div className="lg:col-span-5 space-y-6">
          <Card
            title="Private Dispatch Messaging Pipeline"
            subtitle={`Direct WebSocket Channel: ${threadId}`}
            badge={<Badge variant="lime">DISPATCH CHAT</Badge>}
          >
            {/* Messages Stream */}
            <div className="h-96 overflow-y-auto border-2 border-campus-black bg-campus-bg p-3 space-y-3 mb-4">
              {myMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center font-mono text-xs text-campus-muted">
                  No previous alerts in this channel. Send a message to the Dispatch Control Tower.
                </div>
              ) : (
                myMessages.map(m => {
                  const isAdmin = m.senderRole === 'admin';
                  const isEmergency = m.type === 'EMERGENCY_ALERT';

                  return (
                    <div
                      key={m.id}
                      className={`p-3 border-2 border-campus-black text-xs ${
                        isAdmin
                          ? 'bg-campus-black text-white shadow-brutal-sm ml-6'
                          : isEmergency
                          ? 'bg-amber-100 border-amber-900 text-amber-950 mr-6'
                          : 'bg-white text-campus-black mr-6 shadow-brutal-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-1 mb-1 border-b border-black/20 text-[10px] font-mono">
                        <span className="font-bold">{m.senderName} ({m.senderRole.toUpperCase()})</span>
                        <span className="opacity-70">{formatTime(m.timestamp)}</span>
                      </div>
                      <p className="font-sans leading-relaxed">{m.message}</p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Message Input Form */}
            <form onSubmit={handleSendChat} className="space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMessageType('STANDARD')}
                  className={`px-2 py-1 text-[10px] font-mono font-bold uppercase border border-campus-black ${
                    messageType === 'STANDARD' ? 'bg-campus-blue text-white' : 'bg-white'
                  }`}
                >
                  Standard Msg
                </button>
                <button
                  type="button"
                  onClick={() => setMessageType('EMERGENCY_ALERT')}
                  className={`px-2 py-1 text-[10px] font-mono font-bold uppercase border border-campus-black ${
                    messageType === 'EMERGENCY_ALERT' ? 'bg-campus-orange text-white' : 'bg-white'
                  }`}
                >
                  Emergency / Delay
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Report transit issue, traffic delay, or request coverage..."
                  className="flex-1 p-2 font-sans text-xs bg-white border-2 border-campus-black shadow-brutal-sm focus:outline-none focus:bg-amber-50"
                />
                <Button type="submit" variant="primary" size="sm" icon={Send}>
                  Send
                </Button>
              </div>
            </form>
          </Card>

          {/* Emergency Work Coverage Protocol Info & Status Tracker */}
          <Card
            title="Work Reassignment Data Model"
            subtitle="Autonomous Coverage Dispatch Engine"
            badge={
              <Badge variant={currentTeacher.status === 'ABSENT' || currentTeacher.status === 'LATE' ? 'warning' : 'muted'}>
                {currentTeacher.status === 'ABSENT' || currentTeacher.status === 'LATE' ? 'REASSIGNMENT ACTIVE' : 'STANDBY'}
              </Badge>
            }
          >
            <div className="space-y-3 font-mono text-xs">
              <div className="p-2.5 bg-campus-bg border border-campus-black space-y-1">
                <div className="flex justify-between">
                  <span className="text-campus-muted">Thread ID:</span>
                  <span className="font-bold text-campus-blue">{threadId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-campus-muted">Coverage Status:</span>
                  <Badge variant={currentTeacher.status === 'ABSENT' ? 'success' : currentTeacher.status === 'LATE' ? 'warning' : 'muted'}>
                    {currentTeacher.status === 'ABSENT' ? 'REASSIGNED' : currentTeacher.status === 'LATE' ? 'PENDING COVERAGE' : 'NO ACTION NEEDED'}
                  </Badge>
                </div>
                {currentTeacher.status !== 'ON_TIME' && (
                  <>
                    <div className="flex justify-between pt-1 border-t border-campus-black/10">
                      <span className="text-campus-muted">Substitute Faculty:</span>
                      <span className="font-bold text-campus-black">Prof. Vikram Sen (CSE)</span>
                    </div>
                    <div className="pt-1">
                      <span className="text-campus-muted block text-[10px]">PAYLOAD REASON:</span>
                      <span className="text-campus-black text-[11px] leading-snug">
                        {currentTeacher.status === 'LATE'
                          ? 'Transit delay reported on Route 2 corridor. Coverage requested for 8:45 AM lecture.'
                          : 'Marked absent for morning transit. Full lecture substitution dispatched to Prof. Vikram Sen.'}
                      </span>
                    </div>
                  </>
                )}
              </div>
              <p className="font-sans text-[11px] text-campus-black/70 leading-relaxed">
                Adhering to PRD Module 3 specifications: Emergency alerts automatically initiate the work coverage data pipeline.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

