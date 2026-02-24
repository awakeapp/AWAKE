import React from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const variants = {
  primary: "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800",
  secondary: "bg-surface-elevated text-slate-900 dark:bg-surface-elevatedDark dark:text-white hover:bg-gray-200 dark:hover:bg-slate-700",
  ghost: "bg-transparent text-primary-600 hover:bg-primary-50 active:bg-primary-100 dark:text-primary-400 dark:hover:bg-primary-950",
  danger: "bg-red-500 text-white hover:bg-red-600 active:bg-red-700",
};

export const AppButton = React.forwardRef(({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  isLoading = false,
  disabled = false,
  icon: Icon,
  className,
  onClick,
  ...props 
}, ref) => {
  const baseClasses = cn(
    // Base constraints: height >= 44px tap target, typography token, motion token
    // Strict: transition-all focus-visible:ring-2
    "relative flex items-center justify-center gap-2 min-h-[44px]",
    "rounded font-medium transition-all outline-none",
    "focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900",
    // Variants
    variants[variant] || variants.primary,
    // Full width
    fullWidth ? "w-full" : "",
    // Disabled/Loading state: 50% opacity, no pointer events to prevent fast double clicking.
    (disabled || isLoading) ? "opacity-50 cursor-not-allowed" : "",
    className
  );

  return (
    <button
      ref={ref}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={baseClasses}
      {...props}
    >
      {/* 
        Zero Layout Shift Loading Structure:
        Instead of conditionally rendering the text which changes the width,
        we render it invisibly, and place the spinner absolutely centered over it.
      */}
      <div className={cn("flex items-center justify-center gap-2", isLoading && "opacity-0")}>
        {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
        <span>{children}</span>
      </div>
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-current" />
        </div>
      )}
    </button>
  );
});

AppButton.displayName = 'AppButton';
