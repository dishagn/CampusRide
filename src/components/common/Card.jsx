import React from 'react';

export default function Card({
  children,
  className = '',
  title,
  subtitle,
  badge,
  action,
  headerClassName = '',
}) {
  return (
    <div className={`bg-white border-2 border-campus-black shadow-brutal p-5 ${className}`}>
      {(title || subtitle || badge || action) && (
        <div className={`flex items-start justify-between gap-4 mb-4 pb-3 border-b-2 border-campus-black ${headerClassName}`}>
          <div>
            <div className="flex items-center gap-2">
              {title && <h3 className="font-heading font-bold text-lg text-campus-black tracking-tight">{title}</h3>}
              {badge}
            </div>
            {subtitle && <p className="text-xs font-mono text-campus-muted mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

