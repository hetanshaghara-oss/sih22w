import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'green' | 'blue' | 'yellow' | 'red' | 'gray' | 'purple';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'blue',
  size = 'sm',
}) => {
  const variantStyles = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/10',
    blue: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-700/10',
    yellow: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-600/10',
    red: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-600/10',
    purple: 'bg-purple-50 text-purple-700 border-purple-200 ring-purple-700/10',
    gray: 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-600/10',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border ring-1 ring-inset ${variantStyles[variant]} ${sizeStyles[size]}`}
    >
      {children}
    </span>
  );
};
