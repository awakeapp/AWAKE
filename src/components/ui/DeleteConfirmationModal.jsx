import React from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Item?",
  message = "This action cannot be undone. Are you sure you want to proceed?",
  confirmLabel = "Delete",
  isFinancial = false
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 relative z-10 overflow-hidden"
        >
          <div className="p-8 text-center">
            <div className={clsx(
              "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6",
              isFinancial ? "bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" : "bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400"
            )}>
              {isFinancial ? <AlertTriangle className="w-8 h-8" /> : <Trash2 className="w-8 h-8" />}
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              {message}
            </p>
          </div>

          <div className="flex gap-3 p-6 pt-0">
            <button
              onClick={onClose}
              className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={clsx(
                "flex-1 py-4 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all",
                isFinancial ? "bg-amber-600 shadow-amber-500/30" : "bg-red-600 shadow-red-500/30"
              )}
            >
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Minimal helper to fix clsx if not imported correctly in the snippet
const clsx = (...classes) => classes.filter(Boolean).join(' ');
