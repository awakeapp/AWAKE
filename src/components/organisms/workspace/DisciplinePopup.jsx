import { X, Trophy, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useScrollLock } from '../../../hooks/useScrollLock';

const SUCCESS_QUOTES = [
    "Discipline is the bridge between goals and accomplishment.",
    "Don't stop when you're tired. Stop when you're done.",
    "The only way to do great work is to love what you do.",
    "You conquered the day. Tomorrow, the world.",
    "Consistency is the code to success."
];

const TROLL_QUOTES = [
    "Well, that was pathetic. Try harder tomorrow.",
    "Imagine if you actually tried? Just imagine.",
    "Your dreams called. They went to voicemail.",
    "A partial effort yields a partial result.",
    "Is this your best? Really?"
];

const DisciplinePopup = ({ isOpen, onClose, score }) => {
    useScrollLock(isOpen);
    if (!isOpen) return null;

    const isSuccess = score === 100;
    const isGood = score >= 70;
    const isFailure = score < 70;

    const quote = isSuccess
        ? SUCCESS_QUOTES[Math.floor(Math.random() * SUCCESS_QUOTES.length)]
        : TROLL_QUOTES[Math.floor(Math.random() * TROLL_QUOTES.length)];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className={`relative w-full max-w-md p-8 rounded-3xl shadow-2xl text-center overflow-hidden ${isSuccess
                            ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white'
                            : 'bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700'
                        }`}
                >
                    {/* Confetti / Background Effects for Success */}
                    {isSuccess && (
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-x-10 -translate-y-10" />
                            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl translate-x-10 translate-y-10" />
                        </div>
                    )}

                    <button
                        onClick={onClose}
                        className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${isSuccess ? 'text-white/70 hover:bg-white/20' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="relative z-10 flex flex-col items-center gap-6">
                        <div className={`p-4 rounded-full ${isSuccess ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'
                            }`}>
                            {isSuccess ? <Trophy className="w-10 h-10" /> : <AlertTriangle className="w-10 h-10" />}
                        </div>

                        <div>
                            <h2 className={`text-3xl font-bold mb-2 ${isSuccess ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                {isSuccess ? 'Day Conquered!' : 'You Missed It.'}
                            </h2>
                            <p className={`text-lg italic ${isSuccess ? 'text-indigo-100' : 'text-slate-500'}`}>
                                "{quote}"
                            </p>
                        </div>

                        <div className={`text-4xl font-black ${isSuccess ? 'text-white' : getScoreColor(score)}`}>
                            {score}%
                        </div>

                        <button
                            onClick={onClose}
                            className={`w-full py-3 rounded-xl font-bold transition-transform active:scale-95 ${isSuccess
                                    ? 'bg-white text-indigo-600 hover:bg-indigo-50'
                                    : 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900'
                                }`}
                        >
                            {isSuccess ? 'I Am Unstoppable' : 'I Will Do Better'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const getScoreColor = (s) => {
    if (s >= 71) return 'text-emerald-500';
    if (s >= 41) return 'text-amber-500';
    return 'text-red-500';
};

export default DisciplinePopup;
