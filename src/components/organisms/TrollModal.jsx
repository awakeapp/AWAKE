import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Button from '../atoms/Button';

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

const TrollModal = ({ isOpen, onClose, category }) => {
    useScrollLock(isOpen);
    // Pick keys based on category or default
    const categoryMessages = TROLL_MESSAGES[category] || TROLL_MESSAGES['DEFAULT'];

    // Pick a random message each time open
    // Note: In pure React, this might change on re-render. Ideally use memo or ref if we want strict stability,
    // but random on re-open is fine. If it jitters, we can fix.
    const message = categoryMessages[Math.floor(Math.random() * categoryMessages.length)];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-purple-900/40 backdrop-blur-md">
                    <motion.div
                        initial={{ scale: 0.5, rotate: -10, opacity: 0 }}
                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                        exit={{ scale: 0.5, rotate: 10, opacity: 0 }}
                        className="w-full max-w-xs bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-purple-400"
                    >
                        <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-6 flex flex-col items-center justify-center relative overflow-hidden">
                            {/* Decorative background circles */}
                            <div className="absolute top-0 left-0 w-20 h-20 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
                            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3" />

                            <motion.div
                                animate={{
                                    y: [0, -10, 0],
                                    rotate: [0, -5, 5, 0]
                                }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 2,
                                    ease: "easeInOut"
                                }}
                                className="relative z-10"
                            >
                                <img
                                    src="/funny_troll_cat.png"
                                    alt="Judging Cat"
                                    className="w-32 h-32 object-contain drop-shadow-lg"
                                />
                            </motion.div>
                            <h2 className="text-white font-black text-2xl mt-4 uppercase tracking-widest drop-shadow-sm">UH OH...</h2>
                            <button onClick={onClose} className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full text-white/80 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 text-center">
                            <p className="text-lg font-bold text-slate-800 mb-2">
                                "{message}"
                            </p>
                            <p className="text-xs text-purple-400 uppercase tracking-widest mt-4 font-semibold">
                                {category ? `Failed at ${category}` : "Don't let it happen again"}
                            </p>

                            <Button onClick={onClose} className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white border-none shadow-lg shadow-purple-200">
                                I'll Do Better
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default TrollModal;
