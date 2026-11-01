import React from 'react';

export default function Badge({ children, variant = 'default', className = '' }) {
  const variantStyles = {
    default: 'bg-white text-campus-black border-campus-black',
    blue: 'bg-campus-blue text-white border-campus-black',
    lime: 'bg-campus-lime text-campus-black border-campus-black',
    orange: 'bg-campus-orange text-white border-campus-black',
    danger: 'bg-red-500 text-white border-campus-black',
    success: 'bg-emerald-500 text-white border-campus-black',
    warning: 'bg-amber-400 text-campus-black border-campus-black',
    muted: 'bg-campus-surface text-campus-text border-campus-muted',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-mono font-bold uppercase tracking-wider border-2 shadow-[2px_2px_0px_#171717] ${
        variantStyles[variant] || variantStyles.default
      } ${className}`}
    >
      {children}
    </span>
  );
}

