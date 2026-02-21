import React from 'react';
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function AppCard({ 
  children, 
  className, 
  padding = 'default', // 'none' | 'small' | 'default' | 'large'
  interactive = false,
  onClick,
  ...props 
}) {
  const paddingMap = {
    none: 'p-0',
    small: 'p-3', // 12px
    default: 'p-4', // 16px
    large: 'p-6', // 24px
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        // Base iOS card style: max 2 levels of shadow (using 'md' here for elevated surface)
        "bg-surface dark:bg-surface-dark border border-slate-100 dark:border-slate-800",
        "rounded shadow-md overflow-hidden flex flex-col",
        paddingMap[padding],
        // Strict interaction rules: Optional soft shadow or tint on hover/active, NO scale jumps, NO arbitrary timings
        interactive && "cursor-pointer transition-all outline-none hover:border-primary-200 dark:hover:border-slate-700 active:bg-slate-50 dark:active:bg-slate-800/50",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export const AppCardHeader = React.memo(({ className, ...props }) => (
    <div
        className={cn("flex flex-col gap-1 p-4 pb-2 border-b border-slate-100 dark:border-slate-800", className)}
        {...props}
    />
));
AppCardHeader.displayName = 'AppCardHeader';

export const AppCardTitle = React.memo(({ className, ...props }) => (
    <h3
        className={cn("text-lg font-semibold tracking-tight text-slate-900 dark:text-white", className)}
        {...props}
    />
));
AppCardTitle.displayName = 'AppCardTitle';

export const AppCardContent = React.memo(({ className, ...props }) => (
    <div className={cn("p-4 pt-2 flex-grow", className)} {...props} />
));
AppCardContent.displayName = 'AppCardContent';
