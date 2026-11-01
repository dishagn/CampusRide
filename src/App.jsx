import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { BusProvider } from './context/BusContext';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/student/StudentDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import AdminControlTower from './pages/admin/AdminControlTower';
import DriverDashboard from './pages/driver/DriverDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BusProvider>
          <Routes>
            {/* Landing & Public Pages */}
            <Route
              path="/"
              element={
                <PublicLayout>
                  <LandingPage />
                </PublicLayout>
              }
            />
            <Route
              path="/login"
              element={
                <PublicLayout>
                  <LoginPage />
                </PublicLayout>
              }
            />

            {/* Student Dashboard */}
            <Route
              path="/student/dashboard"
              element={
                <DashboardLayout currentRole="student">
                  <StudentDashboard />
                </DashboardLayout>
              }
            />

            {/* Teacher Dashboard */}
            <Route
              path="/teacher/dashboard"
              element={
                <DashboardLayout currentRole="teacher">
                  <TeacherDashboard />
                </DashboardLayout>
              }
            />

            {/* Admin Control Tower */}
            <Route
              path="/admin/dashboard"
              element={
                <DashboardLayout currentRole="admin">
                  <AdminControlTower />
                </DashboardLayout>
              }
            />

            {/* Driver Dashboard (Per PRD Module 1 & Module 2) */}
            <Route
              path="/driver/dashboard"
              element={
                <DashboardLayout currentRole="driver">
                  <DriverDashboard />
                </DashboardLayout>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BusProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

