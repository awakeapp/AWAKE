import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import clsx from 'clsx';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', cancelText = 'Cancel', isDestructive = true }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-slate-900/40 dark:bg-slate-900/60 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl pointer-events-auto border border-slate-100 dark:border-slate-800"
                        >
                            <div className="flex items-start gap-4">
                                <div className={clsx("p-3 rounded-2xl shrink-0", isDestructive ? "bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400" : "bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400")}>
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                                        {title}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                        {message}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3 mt-8">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-400 rounded-xl transition-colors"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={() => {
                                        onConfirm();
                                        onClose();
                                    }}
                                    className={clsx(
                                        "flex-1 py-3 text-sm font-bold rounded-xl transition-colors text-white",
                                        isDestructive 
                                            ? "bg-red-500 hover:bg-red-600 dark:bg-red-500/80 dark:hover:bg-red-500" 
                                            : "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500/80 dark:hover:bg-indigo-500"
                                    )}
                                >
                                    {confirmText}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ConfirmDialog;
