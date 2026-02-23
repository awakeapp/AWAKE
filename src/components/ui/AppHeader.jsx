import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function AppHeader({ 
  title, 
  leftNode, 
  rightNode, 
  showBack = false, 
  onBack,
  className 
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header
      className={cn(
        // Strict Height Token: 56px (h-14) or 64px (h-16). WhatsApp uses 56px roughly on Android, 44px + safe area on iOS. We'll use 56px.
        // Needs proper padding: px-4 (16px)
        "sticky top-0 z-40 w-full h-[56px] px-4",
        "flex items-center justify-between",
        "bg-surface/90 dark:bg-surface-dark/90 backdrop-blur-sm",
        "border-b border-slate-100 dark:border-slate-800",
        className
      )}
    >
      {/* Left Action Area */}
      <div className="flex-1 flex justify-start items-center">
        {showBack ? (
          <button
            onClick={handleBack}
            className="flex items-center text-primary-600 dark:text-primary-400 p-2 -ml-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" /> {/* Standard 24px icon */}
            <span className="text-base font-medium ml-1">Back</span>
          </button>
        ) : (
          leftNode
        )}
      </div>

      {/* Center Title */}
      <div className="flex-[2] flex justify-center text-center">
        <h1 className="text-base font-semibold text-slate-900 dark:text-white truncate px-2">
          {title}
        </h1>
      </div>

      {/* Right Action Area */}
      <div className="flex-1 flex justify-end items-center gap-2">
        {rightNode}
      </div>
    </header>
  );
}
