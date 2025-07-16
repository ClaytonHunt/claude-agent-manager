import React from 'react';
import { cn } from '@/utils';
import { AgentStatus } from '@/types';

interface StatusIndicatorProps {
  status: AgentStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function StatusIndicator({ 
  status, 
  size = 'md', 
  showLabel = false, 
  className 
}: StatusIndicatorProps) {
  const statusConfig = {
    idle: {
      color: 'bg-gray-400',
      label: 'Idle',
      animate: false,
    },
    active: {
      color: 'bg-success-500',
      label: 'Active',
      animate: true,
    },
    error: {
      color: 'bg-error-500',
      label: 'Error',
      animate: false,
    },
    handoff: {
      color: 'bg-warning-500',
      label: 'Handoff',
      animate: false,
    },
    complete: {
      color: 'bg-primary-500',
      label: 'Complete',
      animate: false,
    },
  };

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const config = statusConfig[status];

  return (
    <div className={cn('inline-flex items-center gap-2', className)}>
      <div
        className={cn(
          'inline-block rounded-full',
          sizeClasses[size],
          config.color,
          config.animate && 'animate-pulse'
        )}
      />
      {showLabel && (
        <span className="text-sm font-medium text-gray-700">
          {config.label}
        </span>
      )}
    </div>
  );
}