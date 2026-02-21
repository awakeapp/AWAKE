import React from 'react';
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const AppTextarea = React.forwardRef(({
  label,
  error,
  className,
  wrapperClassName,
  ...props
}, ref) => {
  return (
    <div className={cn("flex flex-col gap-1 w-full", wrapperClassName)}>
      {label && (
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={cn(
          "w-full rounded bg-surface-elevated dark:bg-surface-elevatedDark text-slate-900 dark:text-white",
          "border border-transparent focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20",
          "px-4 py-3 min-h-[88px] text-base transition-all outline-none resize-y",
          "placeholder:text-slate-400 dark:placeholder:text-slate-500",
          error && "border-red-500 focus:ring-red-500/20 focus:border-red-500",
          className
        )}
        {...props}
      />
      <div className="min-h-[16px] mt-1 ml-1 flex items-start">
        {error && <span className="text-xs text-red-500 leading-none">{error}</span>}
      </div>
    </div>
  );
});

AppTextarea.displayName = 'AppTextarea';

export const AppSelect = React.forwardRef(({
  label,
  error,
  options = [],
  className,
  wrapperClassName,
  ...props
}, ref) => {
  return (
    <div className={cn("flex flex-col gap-1 w-full", wrapperClassName)}>
      {label && (
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={cn(
          "w-full rounded bg-surface-elevated dark:bg-surface-elevatedDark text-slate-900 dark:text-white",
          "border border-transparent focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20",
          "px-4 py-3 min-h-[44px] text-base transition-all outline-none appearance-none",
          "placeholder:text-slate-400 dark:placeholder:text-slate-500",
          error && "border-red-500 focus:ring-red-500/20 focus:border-red-500",
          className
        )}
        {...props}
      >
        <option value="" disabled hidden>Select an option</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="min-h-[16px] mt-1 ml-1 flex items-start">
        {error && <span className="text-xs text-red-500 leading-none">{error}</span>}
      </div>
    </div>
  );
});

AppSelect.displayName = 'AppSelect';
