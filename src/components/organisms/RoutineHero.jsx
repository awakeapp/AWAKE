import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const RoutineHero = () => {
    // Determine phase based on real time
    const getPhase = () => {
        const hour = new Date().getHours();
        if (hour < 9) return { id: 'morning', src: '/hero_morning.png', label: 'Early Morning', sub: 'Start Strong' };
        if (hour < 13) return { id: 'noon', src: '/hero_noon.png', label: 'Before Noon', sub: 'Deep Focus' };
        if (hour < 17) return { id: 'afternoon', src: '/hero_afternoon.png', label: 'After Noon', sub: 'Stay Active' };
        return { id: 'night', src: '/hero_night.png', label: 'Night', sub: 'Rest & Recover' };
    };

    const image = getPhase();

    return (
        <div className="relative w-full aspect-[2/1] rounded-3xl overflow-hidden shadow-lg border border-slate-100 dark:border-slate-800 group">
            <motion.div
                key={image.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                className="absolute inset-0 w-full h-full"
            >
                <img
                    src={image.src}
                    alt={image.label}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </motion.div>

            <div className="absolute bottom-0 left-0 p-6 w-full flex justify-between items-end">
                <div>
                    <p className="text-xs font-bold text-white/80 uppercase tracking-widest mb-1">
                        {image.sub}
                    </p>
                    <h2 className="text-2xl font-black text-white">
                        {image.label}
                    </h2>
                </div>
            </div>
        </div>
    );
};

export default RoutineHero;
