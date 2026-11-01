import React from 'react';
import { AlertTriangle, Clock, Info, ShieldAlert, X } from 'lucide-react';

export default function AlertBanner({
  type = 'warning',
  title,
  message,
  onDismiss,
  action,
  className = '',
}) {
  const styles = {
    warning: {
      container: 'bg-amber-100 border-amber-900 text-amber-900',
      icon: AlertTriangle,
      badge: 'bg-amber-400 text-campus-black',
    },
    danger: {
      container: 'bg-rose-100 border-rose-900 text-rose-900',
      icon: ShieldAlert,
      badge: 'bg-rose-500 text-white',
    },
    info: {
      container: 'bg-blue-50 border-campus-blue text-campus-black',
      icon: Info,
      badge: 'bg-campus-blue text-white',
    },
    stale: {
      container: 'bg-red-50 border-red-600 text-red-900',
      icon: Clock,
      badge: 'bg-red-600 text-white',
    },
  };

  const current = styles[type] || styles.warning;
  const Icon = current.icon;

  return (
    <div
      className={`border-2 shadow-brutal p-4 flex items-start justify-between gap-3 ${current.container} ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="p-1 bg-white border border-campus-black shrink-0 mt-0.5">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          {title && (
            <h4 className="font-heading font-bold text-sm tracking-tight flex items-center gap-2">
              {title}
            </h4>
          )}
          {message && <p className="text-xs font-sans mt-0.5 leading-relaxed">{message}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {action}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 hover:bg-black/10 rounded transition-colors text-campus-black"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

