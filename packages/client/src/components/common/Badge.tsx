import React from 'react';
import { cn } from '@/utils';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'gray' | 'primary';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ 
  variant = 'gray', 
  size = 'md', 
  children, 
  className 
}: BadgeProps) {
  const baseClasses = [
    'inline-flex items-center rounded-full font-medium',
  ];

  const variantClasses = {
    success: 'bg-success-100 text-success-800',
    warning: 'bg-warning-100 text-warning-800',
    error: 'bg-error-100 text-error-800',
    gray: 'bg-gray-100 text-gray-800',
    primary: 'bg-primary-100 text-primary-800',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
  };

  return (
    <span
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </span>
  );
}