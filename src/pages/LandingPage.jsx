import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bus,
  ShieldCheck,
  MapPin,
  Clock,
  Radio,
  ArrowRight,
  GraduationCap,
  Briefcase,
  Smartphone,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

export default function LandingPage() {
  const stops = [
    { name: 'ITPL Main Gate', time: '07:15 AM' },
    { name: 'Hope Farm Circle', time: '07:22 AM' },
    { name: 'Kundalahalli Gate', time: '07:30 AM' },
    { name: 'Marathahalli Bridge', time: '07:40 AM' },
    { name: 'HAL Old Airport Rd', time: '07:50 AM' },
    { name: 'Domlur Flyover', time: '08:00 AM' },
    { name: 'Trinity Circle', time: '08:10 AM' },
    { name: 'Campus Gate 1', time: '08:30 AM' },
  ];

  return (
    <div className="space-y-16 py-8">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden border-b-4 border-campus-black pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Headline */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-campus-lime border-2 border-campus-black shadow-brutal-sm font-mono text-xs font-bold uppercase tracking-wider">
                <Radio className="w-3.5 h-3.5 animate-pulse text-campus-black" />
                <span>Next-Gen Campus Transit Intelligence</span>
              </div>

              <h1 className="font-heading font-extrabold text-5xl sm:text-6xl lg:text-7xl text-campus-black leading-[0.95] tracking-tight uppercase">
                YOUR CAMPUS.<br />
                <span className="text-campus-blue underline decoration-campus-lime decoration-8 underline-offset-4">
                  YOUR ROUTE.
                </span><br />
                YOUR RIDE.
              </h1>

              <p className="font-sans text-base sm:text-lg text-campus-black/80 max-w-xl leading-relaxed border-l-4 border-campus-black pl-4">
                The unified transportation intelligence platform built for modern universities. Live 100-meter GPS telemetry, strict 10-minute check-in cutoff enforcement, and automated 200m circular campus geofence checkouts.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link to="/login">
                  <Button variant="primary" size="lg" icon={ArrowRight}>
                    Access Transit Portal
                  </Button>
                </Link>
                <Link to="/admin/dashboard">
                  <Button variant="outline" size="lg">
                    Control Tower Demo
                  </Button>
                </Link>
              </div>

              {/* Stat Counters */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t-2 border-campus-black">
                <div>
                  <div className="font-mono font-extrabold text-2xl sm:text-3xl text-campus-black">07</div>
                  <div className="font-sans text-xs text-campus-muted uppercase font-semibold">Fixed Buses</div>
                </div>
                <div>
                  <div className="font-mono font-extrabold text-2xl sm:text-3xl text-campus-blue">70</div>
                  <div className="font-sans text-xs text-campus-muted uppercase font-semibold">Verified Stops</div>
                </div>
                <div>
                  <div className="font-mono font-extrabold text-2xl sm:text-3xl text-emerald-600">200m</div>
                  <div className="font-sans text-xs text-campus-muted uppercase font-semibold">Auto Geofence</div>
                </div>
              </div>
            </div>

            {/* Right Hero Graphic: Animated Bus Route & Road Progression */}
            <div className="lg:col-span-5">
              <div className="bg-white border-4 border-campus-black shadow-brutal-lg p-6 relative">
                <div className="flex items-center justify-between border-b-2 border-campus-black pb-3 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-rose-500 rounded-full border border-campus-black"></span>
                    <span className="w-3 h-3 bg-amber-400 rounded-full border border-campus-black"></span>
                    <span className="w-3 h-3 bg-emerald-500 rounded-full border border-campus-black"></span>
                  </div>
                  <span className="font-mono text-xs font-bold text-campus-black uppercase">
                    LIVE ROUTE 1 • WHITEFIELD EXP
                  </span>
                </div>

                {/* Animated Bus Visual Track */}
                <div className="relative pl-6 space-y-6">
                  {/* Vertical connecting line */}
                  <div className="absolute left-2.5 top-3 bottom-3 w-1 bg-campus-black"></div>

                  {stops.map((s, idx) => {
                    const isBusHere = idx === 2; // Kundalahalli Gate
                    return (
                      <div key={idx} className="relative flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          {/* Marker Node */}
                          <div
                            className={`relative z-10 w-6 h-6 border-2 border-campus-black flex items-center justify-center font-mono text-[10px] font-bold ${
                              isBusHere
                                ? 'bg-campus-lime text-campus-black scale-125 shadow-brutal-sm ring-4 ring-campus-lime/40'
                                : idx < 2
                                ? 'bg-campus-black text-white'
                                : 'bg-white text-campus-black'
                            }`}
                          >
                            {isBusHere ? '🚌' : idx + 1}
                          </div>

                          <div>
                            <div className="font-heading font-bold text-sm text-campus-black group-hover:text-campus-blue transition-colors">
                              {s.name}
                            </div>
                            <div className="font-mono text-[11px] text-campus-muted">
                              Sched: {s.time}
                            </div>
                          </div>
                        </div>

                        {isBusHere && (
                          <motion.span
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="font-mono text-[10px] font-bold px-2 py-0.5 bg-campus-blue text-white border border-campus-black uppercase shadow-[2px_2px_0px_#171717]"
                          >
                            IN TRANSIT (38 KM/H)
                          </motion.span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Live Telemetry Card Footer */}
                <div className="mt-6 pt-4 border-t-2 border-campus-black bg-campus-bg p-3 flex items-center justify-between font-mono text-xs">
                  <div>
                    <span className="text-campus-muted block text-[10px]">NEXT ARRIVAL</span>
                    <span className="font-bold text-campus-black">07:40 AM (Marathahalli)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-campus-muted block text-[10px]">TELEMETRY RULE</span>
                    <span className="font-bold text-campus-blue">100m Delta Filter</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* THREE PILLAR ARCHITECTURE (Student, Teacher, Driver) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <Badge variant="blue" className="mb-3">ROLE-BASED INTELLIGENCE</Badge>
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-campus-black uppercase tracking-tight">
            Engineered for Every Campus Stakeholder
          </h2>
          <p className="font-sans text-sm text-campus-black/70 mt-2">
            Each role interacts with tailored views designed according to the university transportation specifications.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Student Pillar */}
          <div className="bg-white border-2 border-campus-black shadow-brutal p-6 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-campus-lime border-2 border-campus-black shadow-brutal-sm flex items-center justify-center mb-4">
                <GraduationCap className="w-6 h-6 text-campus-black" />
              </div>
              <h3 className="font-heading font-bold text-xl uppercase text-campus-black mb-2">
                Student Portal
              </h3>
              <p className="font-sans text-sm text-campus-black/80 leading-relaxed mb-4">
                View assigned bus telemetry, submit 10-minute boarding confirmations, track live GPS arrivals, and lodge administrative complaints with tracking.
              </p>
              <ul className="space-y-2 font-mono text-xs text-campus-black/90">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-campus-blue" />
                  10-Min Pre-Arrival Cutoff
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-campus-blue" />
                  Circular 200m Auto-Checkout
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-campus-blue" />
                  Stale Location Detection (&gt;2m)
                </li>
              </ul>
            </div>

            <div className="pt-6 mt-6 border-t-2 border-campus-black">
              <Link to="/student/dashboard" className="w-full block">
                <Button variant="outline" size="sm" className="w-full">
                  Open Student View
                </Button>
              </Link>
            </div>
          </div>

          {/* Teacher Pillar */}
          <div className="bg-white border-2 border-campus-black shadow-brutal p-6 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-campus-orange border-2 border-campus-black shadow-brutal-sm flex items-center justify-center mb-4 text-white">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-heading font-bold text-xl uppercase text-campus-black mb-2">
                Teacher Portal
              </h3>
              <p className="font-sans text-sm text-campus-black/80 leading-relaxed mb-4">
                Faculty transport check-ins, status toggles (ON_TIME, LATE, ABSENT), live assigned bus monitoring, and private real-time messaging pipeline to Admin.
              </p>
              <ul className="space-y-2 font-mono text-xs text-campus-black/90">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-campus-orange" />
                  Private Admin Direct Chat
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-campus-orange" />
                  Emergency Delay Reporting
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-campus-orange" />
                  Work Coverage Reassignments
                </li>
              </ul>
            </div>

            <div className="pt-6 mt-6 border-t-2 border-campus-black">
              <Link to="/teacher/dashboard" className="w-full block">
                <Button variant="outline" size="sm" className="w-full">
                  Open Teacher View
                </Button>
              </Link>
            </div>
          </div>

          {/* Driver & Mobile Pillar */}
          <div className="bg-white border-2 border-campus-black shadow-brutal p-6 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-campus-blue border-2 border-campus-black shadow-brutal-sm flex items-center justify-center mb-4 text-white">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-heading font-bold text-xl uppercase text-campus-black mb-2">
                Driver App (Flutter)
              </h3>
              <p className="font-sans text-sm text-campus-black/80 leading-relaxed mb-4">
                Dedicated Flutter mobile application running native background GPS telemetry with 100m movement filter and passenger status rosters.
              </p>
              <ul className="space-y-2 font-mono text-xs text-campus-black/90">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Native Haversine 100m Filter
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  2-Minute Stop Waiting Countdown
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Fixed Vehicle &amp; Route Lock
                </li>
              </ul>
            </div>

            <div className="pt-6 mt-6 border-t-2 border-campus-black">
              <Link to="/admin/dashboard" className="w-full block">
                <Button variant="primary" size="sm" className="w-full">
                  Open Control Tower
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CENTRAL CONTROL TOWER HIGHLIGHT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-campus-black text-white border-4 border-campus-black shadow-brutal-lg p-8 sm:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <Badge variant="lime">ADMIN CONTROL TOWER</Badge>
              <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-white uppercase tracking-tight">
                Complete Operational Oversight for Campus Dispatch
              </h2>
              <p className="font-sans text-sm sm:text-base text-campus-muted max-w-2xl leading-relaxed">
                Supervise all 7 buses and 7 routes concurrently. Conduct manual check-in overrides with automatic regulatory audit logging, resolve complaints with mandatory resolution notices, and reassign emergency lecture coverage in seconds.
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-col gap-3">
              <Link to="/admin/dashboard">
                <Button variant="lime" size="lg" className="w-full" icon={ArrowRight}>
                  Enter Control Tower
                </Button>
              </Link>
              <div className="font-mono text-center text-xs text-campus-muted">
                Admin credentials preloaded for testing
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

