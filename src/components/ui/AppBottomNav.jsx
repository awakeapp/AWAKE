import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function AppBottomNav({ items = [], className }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      className={cn(
        // Fixed exactly to bottom, 64px height min, safe-area padded
        "fixed bottom-0 left-0 right-0 z-40 w-full",
        "bg-white dark:bg-slate-950",
        "border-t border-slate-200 dark:border-slate-800",
        "pb-[env(safe-area-inset-bottom)]",
        className
      )}
    >
      <div className="flex h-[64px] items-center justify-around px-2">
        {items.map((item) => {
          // Determine activity state based on path prefix or exact match
          const isActive = item.exact 
            ? location.pathname === item.path
            : location.pathname.startsWith(item.path);

          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-0.5 tap-highlight-transparent",
                isActive 
                  ? "text-primary-600 dark:text-primary-500" 
                  : "text-slate-400 dark:text-slate-500"
              )}
            >
              <div className="flex items-center justify-center">
                {/* Standardize Navigation icons at 24px (w-6 h-6) */}
                <Icon className={cn("w-6 h-6", isActive ? "stroke-[2.5px]" : "stroke-[1.75px]")} />
              </div>
              <span className="text-[10px] font-medium tracking-tight">
                {item.label}
              </span>
              {/* Dot indicator — appears instantly on tap, no transition delay */}
              <div className={cn(
                "h-[3px] w-[3px] rounded-full bg-primary-600 dark:bg-primary-500 mt-0.5 transition-opacity duration-150",
                isActive ? "opacity-100" : "opacity-0"
              )} />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
