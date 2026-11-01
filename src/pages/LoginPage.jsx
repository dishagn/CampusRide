import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { USER_ROLES } from '../utils/constants';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import {
  Bus,
  Lock,
  User,
  ArrowRight,
  GraduationCap,
  Briefcase,
  Shield,
  Smartphone,
  AlertCircle
} from 'lucide-react';

export default function LoginPage() {
  const { login, authError, isLiveSupabase } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('1MS21CS045');
  const [password, setPassword] = useState('password123');
  const [selectedRole, setSelectedRole] = useState(USER_ROLES.STUDENT);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Handle Login submission
  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (!identifier.trim()) {
      setFormError('Invalid User ID format.');
      return;
    }

    if (password.length < 8) {
      setFormError('Password must be a minimum of 8 characters.');
      return;
    }

    setIsSubmitting(true);
    const res = await login({
      identifier: identifier.trim(),
      password,
      selectedRole,
    });
    setIsSubmitting(false);

    if (res.success) {
      // Dynamic Role Redirection Router
      if (res.role === USER_ROLES.STUDENT || selectedRole === USER_ROLES.STUDENT) {
        navigate('/student/dashboard');
      } else if (res.role === USER_ROLES.TEACHER || selectedRole === USER_ROLES.TEACHER) {
        navigate('/teacher/dashboard');
      } else if (res.role === USER_ROLES.ADMIN || selectedRole === USER_ROLES.ADMIN) {
        navigate('/admin/dashboard');
      } else if (res.role === USER_ROLES.DRIVER || selectedRole === USER_ROLES.DRIVER) {
        navigate('/driver/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } else {
      setFormError(res.error || 'Invalid credentials provided.');
    }
  }

  // Quick preset helper
  function applyPreset(role) {
    setSelectedRole(role);
    if (role === USER_ROLES.STUDENT) {
      setIdentifier('1MS21CS045');
      setPassword('password123');
    } else if (role === USER_ROLES.TEACHER) {
      setIdentifier('EMP-TCH-101');
      setPassword('password123');
    } else if (role === USER_ROLES.ADMIN) {
      setIdentifier('admin.transport@campus.edu');
      setPassword('password123');
    } else if (role === USER_ROLES.DRIVER) {
      setIdentifier('DRIVER-KA01-01');
      setPassword('password123');
    }
    setFormError('');
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header Branding */}
        <div className="text-center">
          <div className="inline-flex w-14 h-14 bg-campus-lime border-2 border-campus-black shadow-brutal items-center justify-center mb-4">
            <Bus className="w-8 h-8 text-campus-black" />
          </div>
          <h2 className="font-heading font-extrabold text-3xl text-campus-black tracking-tight uppercase">
            Campus Ride Portal
          </h2>
          <p className="font-mono text-xs text-campus-muted uppercase tracking-wider mt-1">
            Common Authentication Entrypoint
          </p>
        </div>

        {/* Neo-brutalist Login Card */}
        <div className="bg-white border-4 border-campus-black shadow-brutal-lg p-6 sm:p-8 space-y-6">
          {/* Quick autofill tabs for easy review */}
          <div>
            <label className="block font-mono text-[11px] font-bold uppercase tracking-wider text-campus-muted mb-2">
              Select Role Preset (Testing / Quick Demo)
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => applyPreset(USER_ROLES.STUDENT)}
                className={`py-2 px-1 text-center font-mono text-xs font-bold uppercase border-2 border-campus-black transition-all ${
                  selectedRole === USER_ROLES.STUDENT
                    ? 'bg-campus-blue text-white shadow-brutal-sm'
                    : 'bg-white text-campus-black hover:bg-campus-bg'
                }`}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => applyPreset(USER_ROLES.TEACHER)}
                className={`py-2 px-1 text-center font-mono text-xs font-bold uppercase border-2 border-campus-black transition-all ${
                  selectedRole === USER_ROLES.TEACHER
                    ? 'bg-campus-orange text-white shadow-brutal-sm'
                    : 'bg-white text-campus-black hover:bg-campus-bg'
                }`}
              >
                Teacher
              </button>
              <button
                type="button"
                onClick={() => applyPreset(USER_ROLES.ADMIN)}
                className={`py-2 px-1 text-center font-mono text-xs font-bold uppercase border-2 border-campus-black transition-all ${
                  selectedRole === USER_ROLES.ADMIN
                    ? 'bg-campus-black text-white shadow-brutal-sm'
                    : 'bg-white text-campus-black hover:bg-campus-bg'
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => applyPreset(USER_ROLES.DRIVER)}
                className={`py-2 px-1 text-center font-mono text-xs font-bold uppercase border-2 border-campus-black transition-all ${
                  selectedRole === USER_ROLES.DRIVER
                    ? 'bg-campus-lime text-campus-black shadow-brutal-sm'
                    : 'bg-white text-campus-black hover:bg-campus-bg'
                }`}
              >
                Driver
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {(formError || authError) && (
            <div className="p-3 bg-rose-100 border-2 border-rose-900 text-rose-900 font-mono text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-800" />
              <span>{formError || authError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-heading font-bold text-xs uppercase tracking-wider text-campus-black mb-1">
                {selectedRole === USER_ROLES.STUDENT
                  ? 'University Seat Number (USN)'
                  : selectedRole === USER_ROLES.TEACHER
                  ? 'Faculty Employee ID'
                  : 'Administrative User Email'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-campus-muted">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={
                    selectedRole === USER_ROLES.STUDENT
                      ? 'e.g. 1MS21CS045'
                      : selectedRole === USER_ROLES.TEACHER
                      ? 'e.g. EMP-TCH-101'
                      : 'admin.transport@campus.edu'
                  }
                  className="w-full pl-10 pr-3 py-2.5 font-mono text-sm bg-white border-2 border-campus-black shadow-brutal-sm focus:outline-none focus:bg-amber-50"
                />
              </div>
            </div>

            <div>
              <label className="block font-heading font-bold text-xs uppercase tracking-wider text-campus-black mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-campus-muted">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full pl-10 pr-3 py-2.5 font-mono text-sm bg-white border-2 border-campus-black shadow-brutal-sm focus:outline-none focus:bg-amber-50"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-4"
              disabled={isSubmitting}
              icon={ArrowRight}
            >
              {isSubmitting ? 'Authenticating...' : 'Sign In To Dashboard'}
            </Button>
          </form>

          {/* Driver Mobile Note */}
          <div className="pt-4 border-t-2 border-campus-black/20 flex items-start gap-2.5 font-mono text-[11px] text-campus-black/70">
            <Smartphone className="w-4 h-4 shrink-0 text-campus-blue mt-0.5" />
            <div>
              <strong>Bus Drivers:</strong> Dedicated Flutter mobile application required for native background GPS telemetry.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

