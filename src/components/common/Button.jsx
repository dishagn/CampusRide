import React from 'react';

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  icon: Icon,
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-heading font-bold uppercase tracking-wider border-2 border-campus-black transition-all active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 shadow-brutal-sm',
    md: 'text-sm px-5 py-2.5 gap-2 shadow-brutal',
    lg: 'text-base px-6 py-3 gap-2.5 shadow-brutal-lg',
  };

  const variantStyles = {
    primary: 'bg-campus-blue text-white hover:bg-blue-700 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-brutal-sm',
    lime: 'bg-campus-lime text-campus-black hover:bg-lime-400 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-brutal-sm',
    orange: 'bg-campus-orange text-white hover:bg-orange-600 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-brutal-sm',
    outline: 'bg-white text-campus-black hover:bg-campus-bg hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-brutal-sm',
    danger: 'bg-red-500 text-white hover:bg-red-600 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-brutal-sm',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant] || variantStyles.primary} ${className}`}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      {children}
    </button>
  );
}

