import { motion, AnimatePresence } from 'framer-motion';
import { Award, CheckCircle, Star, TrendingUp, X } from 'lucide-react';
import Button from '../atoms/Button';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

import { useScrollLock } from '../../hooks/useScrollLock';

const TROLL_MESSAGES = {
    'EARLY MORNING': [
        "Love your bed too much?",
        "Sun's up, you should be too.",
        "Snooze button is for losers.",
        "Morning glory? More like morning sad story.",
        "The early bird gets the worm. You get nothing."
    ],
    'BEFORE NOON': [
        "Lunch isn't earned yet.",
        "Productivity peak? I think not.",
        "Already slacking? It's not even 12.",
        "Your coffee needs to be stronger.",
        "Is this your 'focus' time?"
    ],
    'AFTER NOON': [
        "Post-lunch coma hit hard?",
        "Afternoon slump or just lazy?",
        "Day's wasting away...",
        "Sun's going down, and so is your discipline.",
        "Siesta time is over."
    ],
    'NIGHT': [
        "Too tired or just quitting?",
        "Ending the day on a low note?",
        "Sleep is sweet, but success is sweeter.",
        "Don't let the day win.",
        "Night owl? More like night fail."
    ],
    'DEFAULT': [
        "Giving up already? My grandma moves faster.",
        "Oh, skipping tasks? Is that your strategy for success?",
        "Weakness disgusts me. Try again.",
        "I thought you said you wanted to change?",
        "Pathetic. Just click it done next time.",
        "Do you need a participation trophy for skipping?",
        "Your future self is disappointed in you.",
        "Discipline is hard, isn't it? clearly too hard for you."
    ]
};

const UnifiedFeedbackModal = ({ isOpen, onClose, type = 'success', category }) => {
    useScrollLock(isOpen);
    // type: 'success' | 'troll'

    useEffect(() => {
        if (isOpen && type === 'success') {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    }, [isOpen, type]);

    const getTrollMessage = () => {
        if (!category) return TROLL_MESSAGES['DEFAULT'][0];
        const messages = TROLL_MESSAGES[category] || TROLL_MESSAGES['DEFAULT'];
        return messages[Math.floor(Math.random() * messages.length)];
    };

    const message = type === 'troll' ? getTrollMessage() : null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0, rotate: type === 'troll' ? -5 : 0 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden relative"
                    >
                        {/* Header Background */}
                        <div className={`h-40 flex items-center justify-center relative overflow-hidden ${type === 'success'
                                ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
                                : 'bg-gradient-to-br from-purple-500 to-pink-600'
                            }`}>
                            <div className="absolute inset-0 opacity-20">
                                <Star className="absolute top-4 left-4 w-8 h-8 text-white rotate-12" />
                                <Star className="absolute bottom-4 right-10 w-6 h-6 text-white -rotate-12" />
                                <TrendingUp className="absolute top-10 right-6 w-10 h-10 text-white" />
                            </div>

                            <motion.div
                                className="relative z-10"
                                initial={type === 'troll' ? { y: 10 } : { scale: 0.8 }}
                                animate={type === 'troll' ? { y: 0 } : { scale: 1 }}
                            >
                                {type === 'success' ? (
                                    <div className="bg-white/20 p-4 rounded-full backdrop-blur-md shadow-inner">
                                        <Award className="w-16 h-16 text-white" />
                                    </div>
                                ) : (
                                    <div className="bg-white/10 p-2 rounded-2xl backdrop-blur-sm transform rotate-3">
                                        <img
                                            src="/funny_troll_cat.png"
                                            alt="Judging Cat"
                                            className="w-24 h-24 object-contain drop-shadow-md transform -rotate-6"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.style.display = 'none';
                                                e.target.parentNode.innerHTML = '<span style="font-size:3rem">😿</span>';
                                            }}
                                        />
                                    </div>
                                )}
                            </motion.div>

                            <button onClick={onClose} className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded-full text-white/80 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 text-center">
                            <h2 className={`text-2xl font-black mb-2 uppercase tracking-wide ${type === 'success' ? 'text-slate-900' : 'text-purple-600'
                                }`}>
                                {type === 'success' ? 'Great Job!' : 'UH OH...'}
                            </h2>

                            {type === 'success' ? (
                                <p className="text-slate-600 mb-6 leading-relaxed">
                                    You've completed all tasks in <span className="font-bold text-indigo-600">{category}</span>.
                                    Keep up the momentum!
                                </p>
                            ) : (
                                <div className="mb-6">
                                    <p className="text-lg font-bold text-slate-800 mb-2 leading-tight">"{message}"</p>
                                    <p className="text-xs text-purple-400 uppercase tracking-widest font-semibold mt-3">
                                        Failed at {category}
                                    </p>
                                </div>
                            )}

                            <Button
                                onClick={onClose}
                                className={`w-full justify-center text-lg h-12 shadow-lg ${type === 'success'
                                        ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                                        : 'bg-purple-600 hover:bg-purple-700 shadow-purple-200'
                                    }`}
                            >
                                {type === 'success' ? 'Keep Going' : "I'll Do Better"}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default UnifiedFeedbackModal;
