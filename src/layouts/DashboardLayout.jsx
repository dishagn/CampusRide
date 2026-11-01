import React from 'react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import AlertBanner from '../components/common/AlertBanner';
import { isSupabaseConfigured } from '../services/supabase';

export default function DashboardLayout({ children, currentRole = 'student' }) {
  return (
    <div className="min-h-screen flex flex-col bg-campus-bg text-campus-black selection:bg-campus-lime selection:text-campus-black">
      <Navbar />

      {/* Backend configuration notification banner if credentials not yet configured */}
      {!isSupabaseConfigured && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 w-full">
          <AlertBanner
            type="info"
            title="CAMPUS RIDE PREVIEW & DEMO ENVIRONMENT ACTIVE"
            message="Supabase credentials are not yet configured in your local .env file. The application is running in fully interactive preview mode with live mock data, simulation, role-switching, and local persistence."
          />
        </div>
      )}

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>

      <Footer />
    </div>
  );
}

