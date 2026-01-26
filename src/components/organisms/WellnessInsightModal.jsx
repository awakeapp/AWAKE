import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, RefreshCw } from 'lucide-react';
import { WELLNESS_INSIGHTS } from '../../data/wellnessInsights';

const WellnessInsightModal = ({ isOpen, onClose }) => {
    const [insight, setInsight] = useState(WELLNESS_INSIGHTS[0]);
    const [isRotating, setIsRotating] = useState(false);

    const getRandomInsight = () => {
        setIsRotating(true);
        // Add a small delay for the rotation animation feel
        setTimeout(() => {
            const randomIndex = Math.floor(Math.random() * WELLNESS_INSIGHTS.length);
            setInsight(WELLNESS_INSIGHTS[randomIndex]);
            setIsRotating(false);
        }, 300);
    };

    useEffect(() => {
        if (isOpen) {
            // Pick a random one immediately on open
            const randomIndex = Math.floor(Math.random() * WELLNESS_INSIGHTS.length);
            setInsight(WELLNESS_INSIGHTS[randomIndex]);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const Icon = insight.icon;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Bottom Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        drag="y"
                        dragConstraints={{ top: 0 }}
                        onDragEnd={(e, info) => {
                            if (info.offset.y > 100) onClose();
                        }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 rounded-t-3xl overflow-hidden shadow-2xl h-[75vh] flex flex-col"
                    >
                        {/* Drag Handle */}
                        <div className="w-full flex justify-center pt-4 pb-2" onClick={onClose}>
                            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 md:p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Wellness Insight</h5>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">Sunnah-Aligned Health</h2>
                                </div>
                                <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Main Card */}
                            <motion.div
                                key={insight.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3 }}
                                className={`p-6 rounded-3xl ${insight.Bg} mb-6`}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm ${insight.color}`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <h3 className={`text-xl font-bold ${insight.color.replace('text-', 'text-slate-900 dark:text-white')}`}>
                                        {insight.title}
                                    </h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-white/60 dark:bg-black/20 p-4 rounded-2xl">
                                        <p className="text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider">Sunnah Reference</p>
                                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 italic font-serif">
                                            "{insight.sunnah}"
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider">Modern Science</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                            {insight.science}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Actions */}
                            <div className="space-y-3">
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 text-center border border-slate-100 dark:border-slate-800">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Today's Action</p>
                                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                                        {insight.action}
                                    </p>
                                </div>

                                <button
                                    onClick={getRandomInsight}
                                    disabled={isRotating}
                                    className="w-full py-4 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-slate-200 dark:shadow-indigo-900/30 flex items-center justify-center gap-2"
                                >
                                    <RefreshCw className={`w-5 h-5 ${isRotating ? 'animate-spin' : ''}`} />
                                    Show Another Insight
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default WellnessInsightModal;
