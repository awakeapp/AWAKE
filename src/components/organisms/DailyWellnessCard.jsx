import { useState } from 'react';
import { RefreshCw, Sparkles, Droplet, Moon, Sun, Heart, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WELLNESS_INSIGHTS } from '../../data/wellnessInsights';

const DailyWellnessCard = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const insights = WELLNESS_INSIGHTS;
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);



    const handleRefresh = () => {
        setIsRefreshing(true);
        // Spin animation via state, then rotate content
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % insights.length);
            setIsRefreshing(false);
        }, 300);
    };

    const tip = insights[currentIndex];
    const Icon = tip.icon;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Daily Wellness</span>
                </div>
                <button
                    onClick={handleRefresh}
                    className="text-slate-300 hover:text-slate-500 transition-colors p-1"
                >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Content Body */}
            <AnimatePresence mode='wait'>
                <motion.div
                    key={tip.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex gap-4"
                >
                    {/* Icon Column */}
                    <div className="flex-shrink-0">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tip.Bg} ${tip.color}`}>
                            <Icon className="w-6 h-6" />
                        </div>
                    </div>

                    {/* Text Column */}
                    <div className="space-y-3">
                        <h3 className={`text-lg font-bold ${tip.color.replace('text-', 'text-')}`}>{tip.title}</h3>

                        <div className="italic text-slate-500 dark:text-slate-400 text-sm leading-relaxed border-l-2 border-slate-100 dark:border-slate-800 pl-3 py-1">
                            {tip.sunnah}
                        </div>

                        <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                            {tip.science}
                        </p>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Action Footer */}
            <AnimatePresence mode='wait'>
                <motion.div
                    key={`action-${tip.id}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="mt-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 flex items-start gap-3"
                >
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Action</span>
                    <p className="text-slate-700 dark:text-slate-200 text-sm font-medium">
                        {tip.action}
                    </p>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default DailyWellnessCard;
