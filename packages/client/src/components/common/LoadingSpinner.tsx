import React from 'react';
import { cn } from '@/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-gray-300 border-t-primary-600',
        sizeClasses[size],
        className
      )}
    />
  );
}

interface LoadingStateProps {
  loading?: boolean;
  error?: string | null;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function LoadingState({ 
  loading, 
  error, 
  children, 
  fallback 
}: LoadingStateProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        {fallback || <LoadingSpinner />}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-error-600 text-sm font-medium">Error</div>
          <div className="text-gray-600 text-sm mt-1">{error}</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}