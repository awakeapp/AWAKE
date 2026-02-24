import { motion, AnimatePresence } from 'framer-motion';
import { Award, CheckCircle, Star, TrendingUp } from 'lucide-react';
import Button from '../atoms/Button';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';

import { useScrollLock } from '../../hooks/useScrollLock';

const CategoryCompletionModal = ({ isOpen, onClose, categoryName }) => {
    useScrollLock(isOpen);
    useEffect(() => {
        if (isOpen) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden relative"
                    >
                        {/* Header Background */}
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 h-32 flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 opacity-20">
                                <Star className="absolute top-4 left-4 w-8 h-8 text-white rotate-12" />
                                <Star className="absolute bottom-4 right-10 w-6 h-6 text-white -rotate-12" />
                                <TrendingUp className="absolute top-10 right-6 w-10 h-10 text-white" />
                            </div>
                            <div className="bg-white/20 p-4 rounded-full backdrop-blur-md shadow-inner relative z-10">
                                <Award className="w-12 h-12 text-white" />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 text-center">
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">Great Job!</h2>
                            <p className="text-slate-600 mb-6">
                                You've completed all tasks in <span className="font-bold text-indigo-600">{categoryName}</span>.
                                Keep up the momentum!
                            </p>

                            <Button onClick={onClose} className="w-full justify-center text-lg h-12">
                                Keep Going
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CategoryCompletionModal;
