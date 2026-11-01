import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useBus } from '../../context/BusContext';
import { USER_ROLES } from '../../utils/constants';
import Badge from './Badge';
import {
  Bus,
  Shield,
  GraduationCap,
  Briefcase,
  Play,
  Square,
  LogOut,
  Bell,
  Menu,
  X,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

export default function Navbar() {
  const { user, profile, role, logout, switchDemoRole, isLiveSupabase } = useAuth();
  const { isSimulatorRunning, toggleGpsSimulator, notifications } = useBus();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const isLanding = location.pathname === '/';
  const isLogin = location.pathname === '/login';

  return (
    <header className="sticky top-0 z-40 bg-campus-bg border-b-2 border-campus-black shadow-[0_2px_0px_#171717]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Tag */}
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-campus-lime border-2 border-campus-black shadow-[2px_2px_0px_#171717] flex items-center justify-center transition-transform group-hover:-rotate-3">
                <Bus className="w-6 h-6 text-campus-black" />
              </div>
              <div className="flex flex-col">
                <span className="font-heading font-extrabold text-xl tracking-tighter text-campus-black leading-none">
                  CAMPUS<span className="text-campus-blue">RIDE</span>
                </span>
                <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-campus-muted mt-0.5">
                  TRANSIT CONTROL v2.1
                </span>
              </div>
            </Link>

            {/* System Status Tag (Desktop) */}
            <div className="hidden lg:flex items-center gap-2 pl-4 border-l-2 border-campus-black/20">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="font-mono text-xs font-semibold text-campus-black">
                7 BUSES LIVE • GEOFENCE 200M
              </span>
            </div>
          </div>

          {/* Right Action Cluster */}
          <div className="hidden md:flex items-center gap-3">
            {/* GPS Simulator Controller Button */}
            <button
              onClick={toggleGpsSimulator}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider border-2 border-campus-black shadow-[2px_2px_0px_#171717] transition-all hover:translate-x-0.5 hover:translate-y-0.5 active:translate-x-1 active:translate-y-1 ${
                isSimulatorRunning
                  ? 'bg-amber-400 text-campus-black animate-pulse'
                  : 'bg-white text-campus-black hover:bg-neutral-100'
              }`}
              title="Toggle Live GPS Telemetry Simulator along Route 1 (Demo Mode)"
            >
              {isSimulatorRunning ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-campus-black" />
                  <span>SIMULATING GPS (DEMO)</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-campus-black" />
                  <span>START GPS SIM</span>
                </>
              )}
            </button>

            {/* Backend Status Badge */}
            <Badge variant={isLiveSupabase ? 'success' : 'warning'} className="hidden sm:inline-flex">
              {isLiveSupabase ? 'SUPABASE LIVE' : 'DEMO MODE'}
            </Badge>

            {/* Quick Role Switcher Pill for Demo / Review */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-campus-black shadow-[2px_2px_0px_#171717] font-mono text-xs font-bold uppercase tracking-wider hover:bg-campus-surface transition-all"
              >
                <span>ROLE:</span>
                <span className="text-campus-blue">{role || 'GUEST'}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border-2 border-campus-black shadow-brutal z-50 p-2">
                  <div className="text-[10px] font-mono uppercase text-campus-muted px-2 py-1 font-bold">
                    Quick Role Switch (Demo Mode)
                  </div>
                  <button
                    onClick={() => {
                      switchDemoRole(USER_ROLES.STUDENT, 'stu-1');
                      setRoleMenuOpen(false);
                      navigate('/student/dashboard');
                    }}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-mono font-bold hover:bg-campus-lime/40 border border-transparent hover:border-campus-black"
                  >
                    <GraduationCap className="w-4 h-4 text-campus-blue" />
                    <span>Student: Aarav (1MS21CS045)</span>
                  </button>
                  <button
                    onClick={() => {
                      switchDemoRole(USER_ROLES.TEACHER, 'tch-1');
                      setRoleMenuOpen(false);
                      navigate('/teacher/dashboard');
                    }}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-mono font-bold hover:bg-campus-lime/40 border border-transparent hover:border-campus-black"
                  >
                    <Briefcase className="w-4 h-4 text-campus-orange" />
                    <span>Teacher: Dr. Priya (EMP-101)</span>
                  </button>
                  <button
                    onClick={() => {
                      switchDemoRole(USER_ROLES.ADMIN);
                      setRoleMenuOpen(false);
                      navigate('/admin/dashboard');
                    }}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-mono font-bold hover:bg-campus-lime/40 border border-transparent hover:border-campus-black"
                  >
                    <Shield className="w-4 h-4 text-campus-black" />
                    <span>Admin Control Tower</span>
                  </button>
                  <button
                    onClick={() => {
                      switchDemoRole(USER_ROLES.DRIVER);
                      setRoleMenuOpen(false);
                      navigate('/driver/dashboard');
                    }}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-mono font-bold hover:bg-campus-lime/40 border border-transparent hover:border-campus-black"
                  >
                    <Bus className="w-4 h-4 text-campus-lime" />
                    <span>Driver: Ramesh (KA-01-MJ-5421)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Notifications Toggle */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 bg-white border-2 border-campus-black shadow-[2px_2px_0px_#171717] hover:bg-campus-surface transition-all"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4 text-campus-black" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-campus-orange text-white text-[9px] font-mono font-bold flex items-center justify-center rounded-none border border-campus-black">
                    {notifications.length}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border-2 border-campus-black shadow-brutal z-50 p-3 max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b-2 border-campus-black">
                    <h4 className="font-heading font-bold text-xs uppercase tracking-wider">Transit Alerts</h4>
                    <span className="font-mono text-[10px] text-campus-muted">{notifications.length} Total</span>
                  </div>
                  <div className="space-y-2">
                    {notifications.map(n => (
                      <div key={n.id} className="p-2 border border-campus-black bg-campus-bg text-left">
                        <div className="flex items-center justify-between">
                          <span className="font-heading font-bold text-xs text-campus-black">{n.title}</span>
                          {n.busNumber && <Badge variant="blue" className="text-[9px]">BUS {n.busNumber}</Badge>}
                        </div>
                        <p className="font-sans text-[11px] text-campus-black/80 mt-1 leading-snug">{n.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Authenticated User / Direct Login Button */}
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to={
                    role === USER_ROLES.STUDENT
                      ? '/student/dashboard'
                      : role === USER_ROLES.TEACHER
                      ? '/teacher/dashboard'
                      : role === USER_ROLES.ADMIN
                      ? '/admin/dashboard'
                      : role === USER_ROLES.DRIVER
                      ? '/driver/dashboard'
                      : '/login'
                  }
                  className="px-3 py-1.5 bg-campus-blue text-white font-heading font-bold text-xs uppercase tracking-wider border-2 border-campus-black shadow-[2px_2px_0px_#171717] hover:bg-blue-700 transition-all"
                >
                  My Dashboard
                </Link>
                <button
                  onClick={logout}
                  className="p-1.5 bg-white border-2 border-campus-black shadow-[2px_2px_0px_#171717] hover:bg-rose-100 transition-all"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4 text-campus-black" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-campus-blue text-white font-heading font-bold text-xs uppercase tracking-wider border-2 border-campus-black shadow-brutal hover:bg-blue-700 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-brutal-sm transition-all"
              >
                Log In
              </Link>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 bg-white border-2 border-campus-black shadow-[2px_2px_0px_#171717]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t-2 border-campus-black space-y-3">
            <div className="flex flex-col gap-2">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 font-heading font-bold text-sm uppercase border border-campus-black bg-white"
              >
                Landing Page
              </Link>
              <Link
                to="/student/dashboard"
                onClick={() => {
                  switchDemoRole(USER_ROLES.STUDENT);
                  setMobileMenuOpen(false);
                }}
                className="px-3 py-2 font-heading font-bold text-sm uppercase border border-campus-black bg-white"
              >
                Student Dashboard
              </Link>
              <Link
                to="/teacher/dashboard"
                onClick={() => {
                  switchDemoRole(USER_ROLES.TEACHER);
                  setMobileMenuOpen(false);
                }}
                className="px-3 py-2 font-heading font-bold text-sm uppercase border border-campus-black bg-white"
              >
                Teacher Dashboard
              </Link>
              <Link
                to="/admin/dashboard"
                onClick={() => {
                  switchDemoRole(USER_ROLES.ADMIN);
                  setMobileMenuOpen(false);
                }}
                className="px-3 py-2 font-heading font-bold text-sm uppercase border border-campus-black bg-white"
              >
                Admin Control Tower
              </Link>
              <Link
                to="/driver/dashboard"
                onClick={() => {
                  switchDemoRole(USER_ROLES.DRIVER);
                  setMobileMenuOpen(false);
                }}
                className="px-3 py-2 font-heading font-bold text-sm uppercase border border-campus-black bg-white"
              >
                Driver Dashboard
              </Link>
              <button
                onClick={() => {
                  toggleGpsSimulator();
                  setMobileMenuOpen(false);
                }}
                className="px-3 py-2 font-mono font-bold text-xs uppercase border border-campus-black bg-campus-lime"
              >
                {isSimulatorRunning ? 'Stop GPS Simulator' : 'Start GPS Simulator'}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

