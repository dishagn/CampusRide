import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBus } from '../../context/BusContext';
import { PASSENGER_ROSTER_STATUS, CAMPUS_CONFIG, DELAY_REASONS } from '../../utils/constants';
import LiveBusMap from '../../components/map/LiveBusMap';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import StatusIndicator from '../../components/common/StatusIndicator';
import {
  Bus,
  Shield,
  Phone,
  Mail,
  User,
  FileText,
  Clock,
  Play,
  Square,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  X,
  ExternalLink
} from 'lucide-react';

export default function DriverDashboard() {
  const { profile } = useAuth();
  const { buses, routes, students, teachers } = useBus();

  // Fixed Assignment Lock: Driver cannot change assigned bus or route
  const assignedBus = buses[0]; // Bus 1 (KA-01-MJ-5421) or Route 5
  const assignedRoute = routes[0]; // Route 1 (Whitefield) or Route 5

  // Journey Lifecycle State
  const [journeyStarted, setJourneyStarted] = useState(false);
  const [currentStopIndex, setCurrentStopIndex] = useState(2); // Stop 3: Kundalahalli Gate
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Overlays
  const [showDriverProfileModal, setShowDriverProfileModal] = useState(false);
  const [showRcModal, setShowRcModal] = useState(false);
  const [showDelayModal, setShowDelayModal] = useState(false);

  // Delay reporting
  const [delayMinutes, setDelayMinutes] = useState(0);
  const [selectedDelayReason, setSelectedDelayReason] = useState('Traffic congestion');

  // Mandatory 2-Minute Waiting Countdown Timer
  const [timerActive, setTimerActive] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(CAMPUS_CONFIG.STOP_WAITING_TIMER_SECONDS);
  const timerRef = useRef(null);

  // Search & Filter state for Passenger List
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStopFilter, setSelectedStopFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Build unified passenger list (students + teachers)
  const passengers = [
    ...students.map(s => ({
      id: s.id,
      name: s.name,
      identifier: s.usn,
      role: 'Student',
      stopName: s.assignedStopName,
      stopSequence: 3,
      phone: s.phone,
      status: s.rosterStatus || (s.checkinStatus === 'CHECKED_IN' ? PASSENGER_ROSTER_STATUS.COMING : PASSENGER_ROSTER_STATUS.NOT_UPDATED),
    })),
    ...teachers.map(t => ({
      id: t.id,
      name: t.name,
      identifier: t.employeeId,
      role: 'Teacher',
      stopName: t.assignedStopName,
      stopSequence: 5,
      phone: t.phone,
      status: t.status === 'ABSENT' ? PASSENGER_ROSTER_STATUS.ABSENT : (t.checkinStatus === 'CHECKED_IN' ? PASSENGER_ROSTER_STATUS.COMING : PASSENGER_ROSTER_STATUS.NOT_UPDATED),
    }))
  ];

  // Passenger counts
  const confirmedCount = passengers.filter(p => p.status === PASSENGER_ROSTER_STATUS.COMING).length;
  const absentCount = passengers.filter(p => p.status === PASSENGER_ROSTER_STATUS.ABSENT).length;
  const pendingCount = passengers.filter(p => p.status === PASSENGER_ROSTER_STATUS.NOT_UPDATED).length;

  // Filter passengers
  const filteredPassengers = passengers.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.identifier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.stopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery);

    const matchesStop = selectedStopFilter === 'ALL' || p.stopName === selectedStopFilter;
    const matchesStatus = selectedStatusFilter === 'ALL' || p.status === selectedStatusFilter;

    return matchesSearch && matchesStop && matchesStatus;
  });

  // Handle Stop Arrival: checks if "Not Updated" passengers exist at current stop
  function handleArriveAtStop() {
    const currentStop = assignedRoute.stops[currentStopIndex];
    const notUpdatedAtStop = passengers.some(
      p => p.stopName === currentStop.name && p.status === PASSENGER_ROSTER_STATUS.NOT_UPDATED
    );

    if (notUpdatedAtStop) {
      setTimerActive(true);
      setSecondsRemaining(CAMPUS_CONFIG.STOP_WAITING_TIMER_SECONDS);
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      alert('All passengers for this stop are confirmed or marked absent. No waiting delay required.');
    }
  }

  function handleDepartStop() {
    clearInterval(timerRef.current);
    setTimerActive(false);
    if (currentStopIndex < assignedRoute.stops.length - 1) {
      setCurrentStopIndex(prev => prev + 1);
    }
  }

  function handleStartJourneyConfirmed() {
    setJourneyStarted(true);
    setShowConfirmModal(false);
  }

  function handleEndJourney() {
    setJourneyStarted(false);
    setTimerActive(false);
    clearInterval(timerRef.current);
  }

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const currentStop = assignedRoute.stops[currentStopIndex];
  const nextStop = currentStopIndex < assignedRoute.stops.length - 1 ? assignedRoute.stops[currentStopIndex + 1] : null;

  return (
    <div className="space-y-8">
      {/* 1. SECTION ONE: BUS & DRIVER DETAILS (Per drivers dashboard.pdf Page 2-9) */}
      <div className="bg-white border-4 border-campus-black shadow-brutal p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Route Information */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-heading font-extrabold text-2xl text-campus-black uppercase">
                ROUTE 0{assignedBus.assignedRouteNumber} • {assignedBus.registrationNumber}
              </span>
              <Badge variant="orange">ASSIGNMENT LOCKED</Badge>
            </div>
            <p className="font-mono text-xs text-campus-muted">
              Morning Route • 10 Assigned Stops • Assigned Bus: Bus 0{assignedBus.busNumber}
            </p>
            <p className="font-sans text-xs text-campus-black/80 font-semibold">
              {assignedRoute.name}
            </p>
          </div>

          {/* Right: Driver & Vehicle Details with Modals */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Driver Card Pill */}
            <div className="p-3 bg-campus-bg border-2 border-campus-black font-mono text-xs flex items-center gap-3">
              <div className="w-10 h-10 bg-campus-lime border border-campus-black flex items-center justify-center font-bold text-sm">
                RK
              </div>
              <div>
                <div className="font-bold text-campus-black">{assignedBus.driver.name}</div>
                <div className="text-[11px] text-campus-muted">{assignedBus.driver.phone}</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDriverProfileModal(true)}
                className="text-[10px] py-1 px-2"
              >
                View Details
              </Button>
            </div>

            {/* Vehicle RC Pill */}
            <div className="p-3 bg-campus-bg border-2 border-campus-black font-mono text-xs flex items-center gap-2">
              <div>
                <div className="text-[10px] text-campus-muted uppercase font-bold">Vehicle RC</div>
                <div className="font-bold text-emerald-700">{assignedBus.driver.rcStatus}</div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRcModal(true)}
                className="text-[10px] py-1 px-2"
              >
                View RC
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SECTION TWO: JOURNEY NOTIFICATIONS BAR (Per drivers dashboard.pdf Page 10) */}
      <div className="bg-campus-black text-white border-2 border-campus-black shadow-brutal p-4 font-mono text-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6 flex-wrap">
          <span className="font-bold uppercase text-campus-lime flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-campus-lime rounded-full animate-ping inline-block"></span>
            JOURNEY NOTIFICATIONS:
          </span>
          <span className="text-emerald-400 font-bold">● {confirmedCount} passengers confirmed</span>
          <span className="text-rose-400 font-bold">● {absentCount} passengers marked absent</span>
          <span className="text-amber-400 font-bold">● {pendingCount} not updated status</span>
          <span className="text-blue-300 font-bold">● 2 waiting at next stop</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="orange"
            size="sm"
            onClick={() => setShowDelayModal(true)}
            icon={AlertTriangle}
            className="text-[11px] py-1 px-2.5"
          >
            Report Delay
          </Button>
        </div>
      </div>

      {/* 3. SECTION THREE: LIVE GPS TRACKING & STOP ARRIVAL (Per drivers dashboard.pdf Page 11-22) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Map & Journey Lifecycle (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <Card
            title="Live Route Map &amp; Real-Time Telemetry"
            subtitle="Adheres strictly to Haversine 100m Movement Delta Filter"
            badge={
              <Badge variant={journeyStarted ? 'success' : 'muted'}>
                {journeyStarted ? 'JOURNEY ACTIVE' : 'NOT STARTED'}
              </Badge>
            }
          >
            <LiveBusMap bus={assignedBus} route={assignedRoute} height="460px" />
          </Card>

          {/* Journey Lifecycle Buttons */}
          <div className="p-4 bg-white border-2 border-campus-black shadow-brutal flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="font-mono text-xs font-bold uppercase text-campus-black">
                Journey Lifecycle Controls
              </div>
              <div className="font-mono text-[11px] text-campus-muted">
                {journeyStarted
                  ? 'Active background GPS broadcasting to Student Dashboard and Admin Tower.'
                  : 'Click Start Journey before departing campus depot.'}
              </div>
            </div>

            <div>
              {journeyStarted ? (
                <Button variant="danger" size="md" onClick={handleEndJourney} icon={Square}>
                  END JOURNEY
                </Button>
              ) : (
                <Button
                  variant="lime"
                  size="md"
                  onClick={() => setShowConfirmModal(true)}
                  icon={Play}
                >
                  START MORNING JOURNEY
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Stop Arrival Controls & Mandatory 2-Minute Waiting Timer (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <Card
            title="Stop Arrival &amp; Departure Controls"
            subtitle="Regulates Passenger Boarding at 10 Bays"
            badge={<Badge variant="blue">STOP #{currentStop.sequence}</Badge>}
          >
            <div className="space-y-4 font-mono text-xs">
              {/* Current Stop */}
              <div className="p-3 bg-campus-bg border-2 border-campus-black">
                <span className="text-[10px] text-campus-muted uppercase font-bold block">Current Stop</span>
                <span className="font-extrabold text-base text-campus-black block">
                  #{currentStop.sequence} {currentStop.name}
                </span>
                <span className="text-campus-muted">Scheduled: {currentStop.scheduledTime}</span>
              </div>

              {/* Next Stop */}
              {nextStop && (
                <div className="p-3 bg-white border border-campus-black">
                  <span className="text-[10px] text-campus-muted uppercase font-bold block">Next Stop</span>
                  <span className="font-bold text-sm text-campus-black block">
                    #{nextStop.sequence} {nextStop.name}
                  </span>
                  <span className="text-campus-blue">ETA: {nextStop.scheduledTime}</span>
                </div>
              )}

              {/* Arrival / Departure Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleArriveAtStop}
                  disabled={!journeyStarted}
                >
                  ARRIVED AT STOP
                </Button>
                <Button
                  variant="lime"
                  size="sm"
                  onClick={handleDepartStop}
                  disabled={!journeyStarted}
                >
                  DEPART STOP
                </Button>
              </div>

              {/* MANDATORY 2-MINUTE WAITING TIMER (Per drivers dashboard.pdf Page 21-22) */}
              {timerActive && (
                <div className="p-4 bg-amber-100 border-2 border-amber-900 shadow-brutal-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase text-amber-950 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-800" />
                      2-MIN WAITING TIMER
                    </span>
                    <span className="font-mono font-extrabold text-2xl text-amber-900">
                      {Math.floor(secondsRemaining / 60)}:{(secondsRemaining % 60).toString().padLeft(2, '0')}
                    </span>
                  </div>
                  <p className="font-sans text-[11px] text-amber-950 leading-tight">
                    Mandatory waiting countdown in effect for <strong>NOT UPDATED</strong> passengers at {currentStop.name}.
                  </p>
                  <div className="pt-2 flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setTimerActive(false)}
                      className="text-[10px] py-1 flex-1"
                    >
                      Passenger Arrived
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDepartStop}
                      className="text-[10px] py-1 flex-1"
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* 4. SECTION FOUR: STUDENT & TEACHER ROSTER TABLE (Per drivers dashboard.pdf Page 22-25) */}
      <Card
        title="Students &amp; Teachers Check-in Roster"
        subtitle="Shared in real-time with Student Dashboard &amp; Admin Tower"
        badge={<Badge variant="lime">{filteredPassengers.length} Listed</Badge>}
      >
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-campus-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, stop, or phone..."
                className="w-full pl-9 pr-3 py-2 font-mono text-xs bg-white border-2 border-campus-black shadow-brutal-sm focus:outline-none"
              />
            </div>

            <div>
              <select
                value={selectedStopFilter}
                onChange={(e) => setSelectedStopFilter(e.target.value)}
                className="w-full py-2 px-3 font-mono text-xs bg-white border-2 border-campus-black shadow-brutal-sm focus:outline-none"
              >
                <option value="ALL">All 10 Stops</option>
                {assignedRoute.stops.map(s => (
                  <option key={s.id} value={s.name}>Stop #{s.sequence}: {s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="w-full py-2 px-3 font-mono text-xs bg-white border-2 border-campus-black shadow-brutal-sm focus:outline-none"
              >
                <option value="ALL">All Statuses (Coming / Absent / Not Updated)</option>
                <option value={PASSENGER_ROSTER_STATUS.COMING}>COMING (Green)</option>
                <option value={PASSENGER_ROSTER_STATUS.ABSENT}>ABSENT (Red)</option>
                <option value={PASSENGER_ROSTER_STATUS.NOT_UPDATED}>NOT UPDATED (Normal / Amber)</option>
              </select>
            </div>
          </div>

          {/* Passenger Table */}
          <div className="overflow-x-auto border-2 border-campus-black">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-campus-black text-white uppercase text-[11px] border-b-2 border-campus-black">
                <tr>
                  <th className="p-3">Passenger</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Assigned Stop</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-campus-black/20 bg-white">
                {filteredPassengers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-campus-muted">
                      No matching passengers found.
                    </td>
                  </tr>
                ) : (
                  filteredPassengers.map(p => (
                    <tr key={p.id} className="hover:bg-campus-bg transition-colors">
                      <td className="p-3 font-bold text-campus-black">
                        {p.name}
                        <span className="block text-[10px] text-campus-muted">{p.identifier}</span>
                      </td>
                      <td className="p-3">
                        <Badge variant={p.role === 'Student' ? 'blue' : 'orange'}>
                          {p.role}
                        </Badge>
                      </td>
                      <td className="p-3 font-semibold">{p.stopName}</td>
                      <td className="p-3">
                        <a href={`tel:${p.phone}`} className="text-campus-blue underline">
                          {p.phone}
                        </a>
                      </td>
                      <td className="p-3">
                        {p.status === PASSENGER_ROSTER_STATUS.COMING ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold border border-emerald-800 text-[10px]">
                            ● COMING
                          </span>
                        ) : p.status === PASSENGER_ROSTER_STATUS.ABSENT ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-100 text-rose-800 font-bold border border-rose-800 text-[10px]">
                            ● ABSENT
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-900 font-bold border border-amber-900 text-[10px]">
                            ● NOT UPDATED
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* MODAL 1: START JOURNEY CONFIRMATION (Per drivers dashboard.pdf Page 17) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-4 border-campus-black shadow-brutal-lg max-w-md w-full p-6 space-y-4">
            <h3 className="font-heading font-extrabold text-lg uppercase text-campus-black">
              START MORNING JOURNEY?
            </h3>
            <div className="space-y-2 font-mono text-xs">
              <div className="p-3 bg-campus-bg border border-campus-black">
                <div>Route: <strong>Route 0{assignedBus.assignedRouteNumber}</strong></div>
                <div>Bus: <strong>{assignedBus.registrationNumber}</strong></div>
              </div>
              <p className="font-sans text-xs text-campus-black/80">
                This triggers live GPS tracking adhering to the 100m movement delta rule and publishes your location to the Student Dashboard and Central Control Tower.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-campus-black/20">
              <Button variant="outline" size="sm" onClick={() => setShowConfirmModal(false)}>
                Cancel
              </Button>
              <Button variant="lime" size="sm" onClick={handleStartJourneyConfirmed}>
                Start Journey
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DRIVER PROFILE OVERLAY (Per drivers dashboard.pdf Page 8) */}
      {showDriverProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-4 border-campus-black shadow-brutal-lg max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b-2 border-campus-black pb-2">
              <h3 className="font-heading font-extrabold text-base uppercase">DRIVER PROFILE</h3>
              <button onClick={() => setShowDriverProfileModal(false)} className="font-bold text-sm">✕</button>
            </div>
            <div className="flex items-center gap-4">
              <img
                src={assignedBus.driver.photoUrl}
                alt={assignedBus.driver.name}
                className="w-16 h-16 border-2 border-campus-black object-cover"
              />
              <div className="font-mono text-xs space-y-0.5">
                <div className="font-extrabold text-sm text-campus-black">{assignedBus.driver.name}</div>
                <div>Phone: {assignedBus.driver.phone}</div>
                <div>Address: Bengaluru, Karnataka</div>
                <div>College Email: ramesh@college.edu</div>
              </div>
            </div>

            <div className="border-2 border-campus-black p-3 bg-campus-bg font-mono text-xs space-y-2">
              <div className="font-bold uppercase text-[10px] text-campus-muted">Driver License Document</div>
              <div className="h-28 bg-white border border-campus-black flex items-center justify-center text-campus-muted text-xs">
                [ DRIVER LICENSE IMAGE VERIFIED: {assignedBus.driver.licenseNumber} ]
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowDriverProfileModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: VEHICLE RC OVERLAY (Per drivers dashboard.pdf Page 10) */}
      {showRcModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-4 border-campus-black shadow-brutal-lg max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b-2 border-campus-black pb-2">
              <h3 className="font-heading font-extrabold text-base uppercase">VEHICLE REGISTRATION (RC)</h3>
              <button onClick={() => setShowRcModal(false)} className="font-bold text-sm">✕</button>
            </div>
            <div className="font-mono text-xs space-y-2">
              <div>Registration Number: <strong>{assignedBus.registrationNumber}</strong></div>
              <div>Vehicle: <strong>College Bus 0{assignedBus.busNumber}</strong></div>
              <div>Status: <strong className="text-emerald-700">VERIFIED BY TRANSPORT AUTHORITY</strong></div>
              <div className="h-32 bg-campus-bg border-2 border-campus-black flex items-center justify-center text-campus-muted">
                [ OFFICIAL RC DOCUMENT PDF PREVIEW ]
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowRcModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: REPORT DELAY (Per bustracking steps.pdf Page 40-41) */}
      {showDelayModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-4 border-campus-black shadow-brutal-lg max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b-2 border-campus-black pb-2">
              <h3 className="font-heading font-extrabold text-base uppercase text-campus-black">
                REPORT TRANSIT DELAY
              </h3>
              <button onClick={() => setShowDelayModal(false)} className="font-bold text-sm">✕</button>
            </div>
            <div className="font-mono text-xs space-y-3">
              <div>
                <label className="block font-bold mb-1">Delay Duration (mins):</label>
                <select
                  value={delayMinutes}
                  onChange={(e) => setDelayMinutes(parseInt(e.target.value, 10))}
                  className="w-full p-2 border-2 border-campus-black bg-white"
                >
                  <option value={3}>+3 Minutes</option>
                  <option value={5}>+5 Minutes</option>
                  <option value={8}>+8 Minutes</option>
                  <option value={12}>+12 Minutes</option>
                  <option value={20}>+20 Minutes</option>
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Reason (Per Specification):</label>
                <select
                  value={selectedDelayReason}
                  onChange={(e) => setSelectedDelayReason(e.target.value)}
                  className="w-full p-2 border-2 border-campus-black bg-white"
                >
                  {DELAY_REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-900 text-amber-900 text-[11px]">
                ⚠ This delay will immediately be displayed on the map with a delay marker and alert banner for students and control tower.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-campus-black/20">
              <Button variant="outline" size="sm" onClick={() => setShowDelayModal(false)}>
                Cancel
              </Button>
              <Button
                variant="orange"
                size="sm"
                onClick={() => {
                  alert(`Delay of +${delayMinutes || 5} mins reported: ${selectedDelayReason}`);
                  setShowDelayModal(false);
                }}
              >
                Broadcast Delay
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

