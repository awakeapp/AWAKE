import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function AppSkeleton({ 
  className,
  variant = 'rectangular', // 'text' | 'circular' | 'rectangular'
  ...props 
}) {
  return (
    <div
      className={cn(
        "animate-pulse bg-slate-200 dark:bg-slate-700/50",
        variant === 'text' && "h-4 w-full rounded",
        variant === 'circular' && "rounded-full",
        variant === 'rectangular' && "rounded", // Uses standard 14px radius from theme
        className
      )}
      {...props}
    />
  );
}
