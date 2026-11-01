import React from 'react';
import { Bus, MapPin, Radio, ShieldCheck } from 'lucide-react';
import { CAMPUS_CONFIG } from '../../utils/constants';

export default function Footer() {
  return (
    <footer className="mt-16 bg-campus-black text-campus-bg border-t-4 border-campus-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-campus-muted/30">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-campus-lime border border-white flex items-center justify-center">
                <Bus className="w-5 h-5 text-campus-black" />
              </div>
              <span className="font-heading font-extrabold text-xl text-white tracking-tight">
                CAMPUS<span className="text-campus-lime">RIDE</span>
              </span>
            </div>
            <p className="font-sans text-xs text-campus-muted max-w-md leading-relaxed">
              Full-Stack College Transportation Management System. Real-time telemetry adhering strictly to the 100-meter publication rule, 10-minute check-in cutoff protocol, and 200m circular campus geofencing.
            </p>
          </div>

          <div>
            <h5 className="font-heading font-bold text-xs uppercase tracking-wider text-campus-lime mb-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Campus Geofence Hub
            </h5>
            <div className="font-mono text-xs space-y-1 text-campus-muted">
              <div>Lat: <span className="text-white">{CAMPUS_CONFIG.LATITUDE}</span></div>
              <div>Lon: <span className="text-white">{CAMPUS_CONFIG.LONGITUDE}</span></div>
              <div>Radius: <span className="text-white">{CAMPUS_CONFIG.GEOFENCE_RADIUS_METERS}m</span> auto-checkout</div>
            </div>
          </div>

          <div>
            <h5 className="font-heading font-bold text-xs uppercase tracking-wider text-campus-lime mb-3 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5" />
              Transit Control
            </h5>
            <div className="font-mono text-xs space-y-1 text-campus-muted">
              <div>Fleet: <span className="text-white">7 Buses active</span></div>
              <div>Routes: <span className="text-white">7 Fixed lines</span></div>
              <div>Stops: <span className="text-white">70 Road nodes</span></div>
              <div>Helpline: <span className="text-white">+91 80 2345 6789</span></div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-campus-muted">
          <div>
            &copy; {new Date().getFullYear()} Campus Ride Engineering. Architecture complying with PRD/SRS v2.1.
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" /> OpenStreetMap &amp; Leaflet Connected
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

