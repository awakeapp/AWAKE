import React from 'react';
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

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
  const location = useLocation();

  const handleBack = (e) => {
      if (e) {
          e.preventDefault();
          e.stopPropagation();
      }

      if (onBack) {
          onBack(e);
          return;
      }

      navigate(-1);
  };

  return (
    <header
      className={cn(
        // Strict Height Token: 56px (h-14) or 64px (h-16). WhatsApp uses 56px roughly on Android, 44px + safe area on iOS. We'll use 56px.
        // Needs proper padding: px-4 (16px)
        "fixed top-0 left-0 right-0 z-50 w-full px-4",
        "flex items-center justify-between",
        "bg-white dark:bg-slate-950",
        "border-b border-slate-200 dark:border-slate-800",
        className
      )}
      style={{
          paddingTop: 'env(safe-area-inset-top)',
          height: 'calc(56px + env(safe-area-inset-top))'
      }}
    >
      {/* Left Action Area */}
      <div className="flex-1 flex justify-start items-center">
        {showBack ? (
          <div className="-ml-2">
            <button
                onClick={handleBack}
                className="p-2 bg-transparent hover:bg-slate-100 dark:bg-transparent dark:hover:bg-slate-800 rounded-full transition-colors active:scale-95 text-primary-600 dark:text-primary-400 focus:outline-none"
            >
                <ArrowLeft className="w-6 h-6" />
            </button>
          </div>
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
