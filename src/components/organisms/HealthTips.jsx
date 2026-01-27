import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WELLNESS_INSIGHTS } from '../../data/wellnessInsights';
import { RefreshCw, Sparkles } from 'lucide-react';

const HealthTips = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    useEffect(() => {
        // Random start index
        setCurrentIndex(Math.floor(Math.random() * WELLNESS_INSIGHTS.length));
    }, []);

    useEffect(() => {
        let interval;
        if (isAutoPlaying) {
            interval = setInterval(() => {
                setCurrentIndex((prev) => (prev + 1) % WELLNESS_INSIGHTS.length);
            }, 8000); // Rotate every 8 seconds
        }
        return () => clearInterval(interval);
    }, [isAutoPlaying]);

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % WELLNESS_INSIGHTS.length);
        setIsAutoPlaying(false); // Pause auto-play on interaction
    };

    const tip = WELLNESS_INSIGHTS[currentIndex];
    const Icon = tip.icon;

    return (
        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                        <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Daily Wellness</h3>
                </div>
                <button
                    onClick={handleNext}
                    className="p-2 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Content Area */}
            <div className="p-5 min-h-[160px] flex flex-col justify-center relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={tip.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-3"
                    >
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-2xl ${tip.Bg} ${tip.color} shrink-0`}>
                                <Icon className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className={`text-base font-bold ${tip.color}`}>{tip.title}</h4>
                                <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed italic">
                                    "{tip.sunnah}"
                                </p>
                            </div>
                        </div>

                        <div className="pl-[3.25rem]">
                            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-snug">
                                {tip.science}
                            </p>
                            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Action</span>
                                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{tip.action}</span>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Progress Bar (Visual flair) */}
            <div className="absolute bottom-0 left-0 h-0.5 bg-slate-100 dark:bg-slate-800 w-full">
                <motion.div
                    key={currentIndex}
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 8, ease: "linear" }}
                    className="h-full bg-slate-200 dark:bg-slate-700"
                />
            </div>
        </div>
    );
};

export default HealthTips;
