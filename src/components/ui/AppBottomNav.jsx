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
        "bg-surface/90 dark:bg-surface-dark/90 backdrop-blur-md",
        "border-t border-slate-100 dark:border-slate-800",
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
                "flex flex-col items-center justify-center w-full h-full gap-1 tap-highlight-transparent",
                isActive 
                  ? "text-primary-600 dark:text-primary-500" 
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              )}
            >
              <div className={cn(
                "flex items-center justify-center transition-transform duration-200",
                isActive && "scale-110"
              )}>
                {/* Standardize Navigation icons at 24px (w-6 h-6) */}
                <Icon className={cn("w-6 h-6", isActive ? "stroke-[2.5px]" : "stroke-2")} />
              </div>
              <span className="text-[10px] font-medium tracking-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
