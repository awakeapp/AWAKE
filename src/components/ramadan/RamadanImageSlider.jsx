import React, { useState, useEffect } from 'react';
import { RAMADAN_BACKGROUNDS } from '../../utils/ramadanImages';

const RamadanImageSlider = () => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Preload images for absolutely flawless transitions (no blank flashes)
    useEffect(() => {
        RAMADAN_BACKGROUNDS.forEach((src) => {
            const img = new Image();
            img.src = src;
        });
    }, []);

    useEffect(() => {
        // Change image every 8 seconds
        const intervalId = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % RAMADAN_BACKGROUNDS.length);
        }, 8000);

        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="absolute inset-0 w-full h-full overflow-hidden rounded-xl sm:rounded-2xl z-0 pointer-events-none">
            {/* The Image Layers */}
            {RAMADAN_BACKGROUNDS.map((src, index) => (
                <img
                    key={src}
                    src={src}
                    alt={`Ramadan Background ${index + 1}`}
                    loading={index === 0 ? "eager" : "lazy"}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity durationSingular-[1500ms] ease-in-out ${
                        index === currentIndex ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
                    }`}
                    style={{ transition: 'opacity 1.5s ease-in-out, transform 8s linear' }}
                />
            ))}

            {/* Heavy Black Gradient Overlay - Essential for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-slate-900 dark:to-[#0F1115] z-10" />
            <div className="absolute inset-0 bg-slate-900/40 mix-blend-multiply z-10" />
        </div>
    );
};

export default RamadanImageSlider;
