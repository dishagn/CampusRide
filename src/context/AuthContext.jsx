import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { MOCK_STUDENTS, MOCK_TEACHERS, MOCK_ADMIN, MOCK_BUSES } from '../services/mockData';
import { USER_ROLES } from '../utils/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Initialize session
  useEffect(() => {
    async function initSession() {
      setLoading(true);
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            setUser(session.user);
            await fetchProfile(session.user.id);
          } else {
            // Check local storage for preview session
            restoreDemoSession();
          }
        } catch (err) {
          console.error('[AuthContext] Session init error:', err);
          restoreDemoSession();
        }
      } else {
        restoreDemoSession();
      }
      setLoading(false);
    }

    initSession();

    // Listen to Supabase auth state changes if live
    if (isSupabaseConfigured && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
          setRole(null);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  function restoreDemoSession() {
    const savedRole = localStorage.getItem('campus_ride_demo_role');
    const savedUserId = localStorage.getItem('campus_ride_demo_user_id');
    if (savedRole) {
      loadDemoUser(savedRole, savedUserId);
    } else {
      // Default to student demo user for immediate smooth preview
      loadDemoUser(USER_ROLES.STUDENT, 'stu-1');
    }
  }

  function loadDemoUser(targetRole, targetId = null) {
    if (targetRole === USER_ROLES.STUDENT) {
      const student = MOCK_STUDENTS.find(s => s.id === targetId) || MOCK_STUDENTS[0];
      setUser({ id: student.authId, email: student.email });
      setProfile(student);
      setRole(USER_ROLES.STUDENT);
      localStorage.setItem('campus_ride_demo_role', USER_ROLES.STUDENT);
      localStorage.setItem('campus_ride_demo_user_id', student.id);
    } else if (targetRole === USER_ROLES.TEACHER) {
      const teacher = MOCK_TEACHERS.find(t => t.id === targetId) || MOCK_TEACHERS[0];
      setUser({ id: teacher.authId, email: teacher.email });
      setProfile(teacher);
      setRole(USER_ROLES.TEACHER);
      localStorage.setItem('campus_ride_demo_role', USER_ROLES.TEACHER);
      localStorage.setItem('campus_ride_demo_user_id', teacher.id);
    } else if (targetRole === USER_ROLES.ADMIN) {
      setUser({ id: MOCK_ADMIN.authId, email: MOCK_ADMIN.email });
      setProfile(MOCK_ADMIN);
      setRole(USER_ROLES.ADMIN);
      localStorage.setItem('campus_ride_demo_role', USER_ROLES.ADMIN);
      localStorage.setItem('campus_ride_demo_user_id', MOCK_ADMIN.id);
    } else if (targetRole === USER_ROLES.DRIVER) {
      const driver = MOCK_BUSES[0].driver;
      setUser({ id: 'driver-auth-1', email: 'driver1@campus.edu' });
      setProfile({
        ...driver,
        assignedBusNumber: 1,
        assignedRouteNumber: 1,
      });
      setRole(USER_ROLES.DRIVER);
      localStorage.setItem('campus_ride_demo_role', USER_ROLES.DRIVER);
      localStorage.setItem('campus_ride_demo_user_id', driver.id);
    }
  }

  async function fetchProfile(userId) {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw error;
      setProfile(data);
      setRole(data.role);
    } catch (err) {
      console.error('[AuthContext] Error fetching user profile:', err);
    }
  }

  // Unified login handler supporting USN / Employee ID / Email
  async function login({ identifier, password, selectedRole }) {
    setAuthError(null);
    setLoading(true);

    if (isSupabaseConfigured && supabase) {
      try {
        const email = identifier.includes('@') ? identifier : `${identifier.toLowerCase()}@campus.edu`;
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        await fetchProfile(data.user.id);
        setLoading(false);
        return { success: true, role };
      } catch (err) {
        setAuthError(err.message || 'Invalid credentials provided.');
        setLoading(false);
        return { success: false, error: err.message };
      }
    } else {
      // Demo / Offline Mode authentication simulation
      await new Promise(r => setTimeout(r, 400));
      const cleanId = identifier.trim().toUpperCase();

      if (cleanId.startsWith('1MS') || selectedRole === USER_ROLES.STUDENT) {
        const found = MOCK_STUDENTS.find(s => s.usn.toUpperCase() === cleanId || s.email.toUpperCase() === cleanId) || MOCK_STUDENTS[0];
        loadDemoUser(USER_ROLES.STUDENT, found.id);
        setLoading(false);
        return { success: true, role: USER_ROLES.STUDENT, redirect: '/student/dashboard' };
      } else if (cleanId.startsWith('EMP') || selectedRole === USER_ROLES.TEACHER) {
        const found = MOCK_TEACHERS.find(t => t.employee_id.toUpperCase() === cleanId || t.email.toUpperCase() === cleanId) || MOCK_TEACHERS[0];
        loadDemoUser(USER_ROLES.TEACHER, found.id);
        setLoading(false);
        return { success: true, role: USER_ROLES.TEACHER, redirect: '/teacher/dashboard' };
      } else if (cleanId.includes('ADMIN') || selectedRole === USER_ROLES.ADMIN) {
        loadDemoUser(USER_ROLES.ADMIN);
        setLoading(false);
        return { success: true, role: USER_ROLES.ADMIN, redirect: '/admin/dashboard' };
      } else if (cleanId.includes('DRIVER') || selectedRole === USER_ROLES.DRIVER) {
        loadDemoUser(USER_ROLES.DRIVER);
        setLoading(false);
        return { success: true, role: USER_ROLES.DRIVER, redirect: '/login' };
      } else {
        // Default to student if unknown format
        loadDemoUser(USER_ROLES.STUDENT, 'stu-1');
        setLoading(false);
        return { success: true, role: USER_ROLES.STUDENT, redirect: '/student/dashboard' };
      }
    }
  }

  async function logout() {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('campus_ride_demo_role');
    localStorage.removeItem('campus_ride_demo_user_id');
    setUser(null);
    setProfile(null);
    setRole(null);
  }

  function switchDemoRole(newRole, newId = null) {
    loadDemoUser(newRole, newId);
  }

  const value = {
    user,
    profile,
    role,
    loading,
    authError,
    login,
    logout,
    switchDemoRole,
    isLiveSupabase: isSupabaseConfigured,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

