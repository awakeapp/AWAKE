import { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
};

const TOAST_CONFIG = {
    success: { icon: CheckCircle2, bg: 'bg-emerald-600', text: 'text-white' },
    error: { icon: AlertCircle, bg: 'bg-rose-600', text: 'text-white' },
    info: { icon: Info, bg: 'bg-indigo-600', text: 'text-white' },
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    }, []);

    const dismissToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-[calc(env(safe-area-inset-top,0px)+16px)] left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-[90%] max-w-sm pointer-events-none">
                <AnimatePresence>
                    {toasts.map(toast => {
                        const config = TOAST_CONFIG[toast.type] || TOAST_CONFIG.info;
                        const Icon = config.icon;
                        return (
                            <motion.div
                                key={toast.id}
                                initial={{ opacity: 0, y: -30, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                                className={`${config.bg} ${config.text} px-4 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 pointer-events-auto backdrop-blur-lg`}
                            >
                                <Icon className="w-5 h-5 shrink-0" />
                                <span className="text-sm font-bold flex-1">{toast.message}</span>
                                <button
                                    onClick={() => dismissToast(toast.id)}
                                    className="p-1 rounded-full hover:bg-white/20 transition-colors shrink-0"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};
