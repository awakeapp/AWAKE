import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useScrollLock } from '../../hooks/useScrollLock';

const MESSAGES = [
    "Welcome",
    "You are doing great",
    "Be consistent",
    "Don't give up"
];

// Display duration per message (ms)
const MESSAGE_DURATION = 800;
// Transition overlap (ms) - slightly lower than duration to overlap or be immediate
const TOTAL_DURATION = MESSAGES.length * MESSAGE_DURATION + 500;

export default function WelcomeSequence({ onComplete }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useScrollLock(true);

    useEffect(() => {
        if (currentIndex < MESSAGES.length - 1) {
            const timer = setTimeout(() => {
                setCurrentIndex(prev => prev + 1);
            }, MESSAGE_DURATION);
            return () => clearTimeout(timer);
        } else {
            // Sequence ended
            const timer = setTimeout(() => {
                onComplete();
            }, MESSAGE_DURATION + 200); // Wait a bit on the last message
            return () => clearTimeout(timer);
        }
    }, [currentIndex, onComplete]);

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-950 z-[9999] overflow-hidden">
            {/* Background Ambience similar to Login */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="relative w-full h-full flex items-center justify-center">
                <AnimatePresence mode="wait">
                    <motion.h1
                        key={currentIndex}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="absolute text-3xl md:text-5xl font-bold text-slate-800 dark:text-slate-100 text-center tracking-tight px-4 w-full"
                    >
                        {MESSAGES[currentIndex]}
                    </motion.h1>
                </AnimatePresence>
            </div>
        </div>
    );
}
