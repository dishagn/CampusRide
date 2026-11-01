import React from 'react';
import { CHECKIN_STATUS, PASSENGER_ROSTER_STATUS } from '../../utils/constants';
import { CheckCircle2, XCircle, Clock, AlertTriangle, MapPin } from 'lucide-react';

export default function StatusIndicator({ status, label, showIcon = true, className = '' }) {
  if (status === CHECKIN_STATUS.CHECKED_IN || status === PASSENGER_ROSTER_STATUS.COMING) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 font-mono font-bold text-xs uppercase tracking-wider bg-emerald-100 text-emerald-800 border-2 border-emerald-800 shadow-[2px_2px_0px_#065f46] ${className}`}>
        {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />}
        {label || 'CHECKED IN'}
      </span>
    );
  }

  if (status === CHECKIN_STATUS.NOT_CHECKED_IN || status === PASSENGER_ROSTER_STATUS.ABSENT) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 font-mono font-bold text-xs uppercase tracking-wider bg-rose-100 text-rose-800 border-2 border-rose-800 shadow-[2px_2px_0px_#9f1239] ${className}`}>
        {showIcon && <XCircle className="w-3.5 h-3.5 text-rose-700" />}
        {label || 'NOT CHECKED IN'}
      </span>
    );
  }

  if (status === CHECKIN_STATUS.AUTO_CHECKED_OUT) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 font-mono font-bold text-xs uppercase tracking-wider bg-blue-100 text-blue-800 border-2 border-blue-800 shadow-[2px_2px_0px_#1e40af] ${className}`}>
        {showIcon && <MapPin className="w-3.5 h-3.5 text-blue-700" />}
        {label || 'CAMPUS ARRIVED (AUTO OUT)'}
      </span>
    );
  }

  if (status === PASSENGER_ROSTER_STATUS.NOT_UPDATED) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 font-mono font-bold text-xs uppercase tracking-wider bg-amber-100 text-amber-900 border-2 border-amber-900 shadow-[2px_2px_0px_#78350f] ${className}`}>
        {showIcon && <Clock className="w-3.5 h-3.5 text-amber-700" />}
        {label || 'NOT UPDATED'}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 font-mono font-bold text-xs uppercase tracking-wider bg-neutral-100 text-neutral-800 border-2 border-neutral-800 ${className}`}>
      {label || status}
    </span>
  );
}

