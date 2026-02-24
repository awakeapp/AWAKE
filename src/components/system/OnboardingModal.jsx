import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../hooks/useAuthContext';
import { FirestoreService } from '../../services/firestore-service';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Sparkles, Activity, Zap } from 'lucide-react';
import clsx from 'clsx';
import Button from '../atoms/Button';
import { useScrollLock } from '../../hooks/useScrollLock';

const OnboardingModal = () => {
    const { user } = useAuthContext();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentSlide, setCurrentSlide] = useState(0);

    useScrollLock(isOpen);

    const slides = [
        {
            title: "Welcome to Awake",
            text: "Your daily routine and discipline system.",
            icon: Sparkles,
            color: "text-amber-500",
            bg: "bg-amber-50 dark:bg-amber-900/20"
        },
        {
            title: "Track Tasks & Routine",
            text: "Complete daily actions and build consistency.",
            icon: Activity,
            color: "text-indigo-500",
            bg: "bg-indigo-50 dark:bg-indigo-900/20"
        },
        {
            title: "Quick Capture",
            text: "Add tasks or expenses instantly. Finance supports your discipline.",
            icon: Zap,
            color: "text-emerald-500",
            bg: "bg-emerald-50 dark:bg-emerald-900/20"
        }
    ];

    useEffect(() => {
        if (user) {
            FirestoreService.getDocument(`users/${user.uid}/config`, 'settings')
                .then(doc => {
                    if (doc?.onboardingCompleted !== true) {
                        setIsOpen(true);
                    }
                    setLoading(false);
                })
                .catch(err => {
                    console.error("Error checking onboarding status:", err);
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, [user]);

    const handleComplete = async () => {
        if (!user) return;
        try {
            await FirestoreService.setItem(
                `users/${user.uid}/config`, 
                'settings', 
                { onboardingCompleted: true }, 
                true
            );
            setIsOpen(false);
        } catch (error) {
            console.error("Failed to complete onboarding:", error);
            setIsOpen(false);
        }
    };

    const handleNext = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(curr => curr + 1);
        } else {
            handleComplete();
        }
    };

    if (loading || !isOpen) return null;

    const CurrentIcon = slides[currentSlide].icon;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
                        className="relative bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
                    >
                        <div className="p-8 flex flex-col items-center text-center min-h-[420px]">
                            
                            {/* Icon Animation */}
                            <motion.div 
                                key={`icon-${currentSlide}`}
                                initial={{ scale: 0, rotate: -20 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", bounce: 0.5, duration: 0.6 }}
                                className={clsx("w-24 h-24 rounded-[2rem] flex items-center justify-center mb-8 shadow-inner", slides[currentSlide].bg)}
                            >
                                <CurrentIcon className={clsx("w-10 h-10", slides[currentSlide].color)} />
                            </motion.div>

                            {/* Text Content */}
                            <motion.div
                                key={`text-${currentSlide}`}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: 0.1 }}
                                className="flex-1"
                            >
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                                    {slides[currentSlide].title}
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-[260px] mx-auto text-sm">
                                    {slides[currentSlide].text}
                                </p>
                            </motion.div>

                            {/* Progress Indicator */}
                            <div className="flex gap-2 my-8 justify-center">
                                {slides.map((_, idx) => (
                                    <motion.div 
                                        key={idx}
                                        initial={false}
                                        animate={{
                                            width: idx === currentSlide ? 32 : 6,
                                            backgroundColor: idx === currentSlide ? (document.documentElement.classList.contains('dark') ? '#fff' : '#0f172a') : (document.documentElement.classList.contains('dark') ? '#334155' : '#e2e8f0')
                                        }}
                                        className="h-1.5 rounded-full"
                                    />
                                ))}
                            </div>

                            {/* Button */}
                            <div className="w-full">
                                <Button 
                                    onClick={handleNext}
                                    className="w-full py-4 rounded-2xl text-base font-bold shadow-xl shadow-indigo-500/20 active:scale-95 transition-transform"
                                >
                                    {currentSlide === slides.length - 1 ? (
                                        <span className="flex items-center justify-center gap-2">
                                            Start Using Awake <Check className="w-5 h-5 stroke-[3]" />
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            Continue <ArrowRight className="w-5 h-5 stroke-[3]" />
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default OnboardingModal;
