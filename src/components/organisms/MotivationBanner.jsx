import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { QUOTES } from '../../data/quotes';

const STYLES = [
    {
        bg: "bg-gradient-to-br from-orange-100 to-amber-200 dark:from-orange-900/30 dark:to-amber-900/30",
        text: "text-amber-900 dark:text-amber-100",
        accent: "bg-amber-500"
    },
    {
        bg: "bg-gradient-to-bl from-blue-100 to-indigo-200 dark:from-blue-900/30 dark:to-indigo-900/30",
        text: "text-indigo-900 dark:text-indigo-100",
        accent: "bg-indigo-500"
    },
    {
        bg: "bg-gradient-to-tr from-emerald-100 to-teal-200 dark:from-emerald-900/30 dark:to-teal-900/30",
        text: "text-teal-900 dark:text-teal-100",
        accent: "bg-teal-500"
    },
    {
        bg: "bg-gradient-to-tl from-rose-100 to-pink-200 dark:from-rose-900/30 dark:to-pink-900/30",
        text: "text-rose-900 dark:text-rose-100",
        accent: "bg-rose-500"
    },
    {
        bg: "bg-gradient-to-r from-violet-100 to-purple-200 dark:from-violet-900/30 dark:to-purple-900/30",
        text: "text-purple-900 dark:text-purple-100",
        accent: "bg-purple-500"
    },
    {
        bg: "bg-gradient-to-bl from-cyan-100 to-blue-200 dark:from-cyan-900/30 dark:to-blue-900/30",
        text: "text-cyan-900 dark:text-cyan-100",
        accent: "bg-cyan-500"
    }
];

const MotivationBanner = () => {
    const { i18n } = useTranslation();
    const currentLanguage = i18n.language || 'en';
    const currentQuotes = QUOTES[currentLanguage] || QUOTES['en'];

    // Randomize start index to keep it fresh on reload
    const [currentIndex, setCurrentIndex] = useState(() => Math.floor(Math.random() * currentQuotes.length));

    // Ensure index is valid for current language quotes
    const safeIndex = currentIndex % currentQuotes.length;

    // Memoize the current quote to prevent jitter during renders if parent updates
    const currentQuote = currentQuotes[safeIndex];
    
    // Deterministic style based on index (so it's stable for the same quote)
    const currentStyle = STYLES[safeIndex % STYLES.length];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => prev + 1);
        }, 8000); // 8 seconds per slide
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="relative w-full overflow-hidden rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 h-64 sm:h-72">
            <AnimatePresence mode='wait'>
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className={`absolute inset-0 ${currentStyle.bg} flex flex-col items-center justify-center p-8 text-center`}
                >
                    {/* Abstract Shapes/Illustration Simulation */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/30 dark:bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none mix-blend-overlay"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/30 dark:bg-white/5 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none mix-blend-overlay"></div>
                    
                    <div className="relative z-10 max-w-lg mx-auto">
                        <motion.div 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                        >
                            <Quote className={`w-8 h-8 mb-4 mx-auto opacity-50 ${currentStyle.text}`} />
                            <h3 className={`text-xl sm:text-2xl font-serif font-medium leading-relaxed mb-4 ${currentStyle.text}`}>
                                "{currentQuote.quote}"
                            </h3>
                            <div className={`w-12 h-1 rounded-full mx-auto mb-3 ${currentStyle.accent} opacity-50`} />
                            <p className={`text-xs font-bold uppercase tracking-widest opacity-70 ${currentStyle.text}`}>
                                {currentQuote.author}
                            </p>
                        </motion.div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Indicators (Simplified for large number of quotes - just show progress bar or nothing? User requested standard look, let's just hide dots for 100 items or show a small bar) */}
            {/* For 100 items, dots are bad. Let's use a subtle progress bar at bottom */}
            <div className="absolute bottom-0 left-0 h-1 bg-white/30 w-full z-20">
                <motion.div 
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 8, ease: "linear", repeat: 0 }} 
                    key={currentIndex}
                    className={`h-full ${currentStyle.accent}`}
                />
            </div>
        </div>
    );
};

export default MotivationBanner;
