import React from 'react';
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const AppInput = React.forwardRef(({
  label,
  error,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
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
      <div className="relative flex items-center">
        {LeftIcon && (
          <div className="absolute left-3 text-slate-400">
            <LeftIcon className="w-5 h-5" />
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            // Strict token usage: 44px min-height, iOS 17px base text, stable border strategy
            "w-full rounded bg-surface-elevated dark:bg-surface-elevatedDark text-slate-900 dark:text-white",
            "border border-transparent focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20",
            "px-4 py-3 min-h-[44px] text-base transition-all outline-none",
            "placeholder:text-slate-400 dark:placeholder:text-slate-500",
            LeftIcon && "pl-10",
            RightIcon && "pr-10",
            error && "border-red-500 focus:ring-red-500/20 focus:border-red-500",
            className
          )}
          {...props}
        />
        {RightIcon && (
          <div className="absolute right-3 text-slate-400">
            <RightIcon className="w-5 h-5" />
          </div>
        )}
      </div>
      {/*
        Zero Layout Shift Validation Rule:
        Always reserve the height for the error message (min-h-[16px]) so layout never jumps.
      */}
      <div className="min-h-[16px] mt-1 ml-1 flex items-start">
        {error && <span className="text-xs text-red-500 leading-none">{error}</span>}
      </div>
    </div>
  );
});

AppInput.displayName = 'AppInput';
