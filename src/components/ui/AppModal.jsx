import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { TRANSITION_FAST } from '../../styles/tokens';

import { useScrollLock } from '../../hooks/useScrollLock';
import ActionButton from '../atoms/ActionButton';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function AppModal({ 
  isOpen, 
  onClose, 
  title, 
  children,
  className,
  maxWidth = 'sm' // 'xs' | 'sm' | 'md' | 'lg' | 'full'
}) {
  useScrollLock(isOpen);

  const maxWidthMap = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    full: 'max-w-full m-4',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={TRANSITION_FAST}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Panel - iOS Spring Feel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.99, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.99, y: 10 }}
            transition={TRANSITION_FAST}
            className={cn(
              "relative w-full overflow-hidden flex flex-col max-h-[90vh]",
              "bg-surface dark:bg-surface-dark border border-slate-100 dark:border-slate-800",
              "rounded shadow-md", // Base shadow and radius from tokens
              maxWidthMap[maxWidth],
              className
            )}
          >
            {/* Header (Optional) */}
            {title && (
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {title}
                </h3>
                {onClose && (
                  <ActionButton 
                    variant="exit" 
                    onClick={onClose} 
                    size="sm"
                    className="-mr-2"
                  />
                )}
              </div>
            )}
            
            {/* Content Body - 24px inner padding (p-6) or 16px (p-4)? Grid is 16px or 24px. Using 24px vertical, 16px horizontal often works, but let's stick to strict 16px (p-4) globally */}
            <div className="p-4 overflow-y-auto w-full">
              {children}
            </div>
            
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
