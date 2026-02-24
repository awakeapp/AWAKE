import React, { useState, useEffect } from 'react';
import { RAMADAN_BACKGROUNDS } from '../../utils/ramadanImages';

const VALID_FALLBACK = "https://images.unsplash.com/photo-1591000507165-38a8a984d942?auto=format&fit=crop&q=80&w=1000";

const RamadanImageSlider = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [validImages, setValidImages] = useState(RAMADAN_BACKGROUNDS);

    useEffect(() => {
        // Change image every 8 seconds
        let timeoutId;

        const advanceSlide = () => {
            setCurrentIndex((prev) => (prev + 1) % validImages.length);
            timeoutId = setTimeout(advanceSlide, 8000);
        };

        timeoutId = setTimeout(advanceSlide, 8000);
        return () => clearTimeout(timeoutId);
    }, [validImages.length]);

    const handleError = (index) => {
        setValidImages(prev => {
            const next = [...prev];
            next[index] = VALID_FALLBACK;
            return next;
        });
    };

    return (
        <div className="absolute inset-0 w-full h-full overflow-hidden rounded-xl sm:rounded-2xl z-0 pointer-events-none">
            {/* The Image Layers */}
            {validImages.map((src, index) => (
                <img
                    key={`${index}-${src}`}
                    src={src}
                    alt={`Ramadan Background ${index + 1}`}
                    loading={index === 0 ? "eager" : "lazy"}
                    onError={() => handleError(index)}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1500ms] ease-in-out ${
                        index === currentIndex ? 'opacity-100 scale-105' : 'opacity-0 scale-100'
                    }`}
                    style={{ transition: 'opacity 1.5s ease-in-out, transform 8s linear' }}
                />
            ))}

            {/* Controlled Gradient Overlay for readability while maintaining image visibility */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/80 z-10" />
        </div>
    );
};

export default RamadanImageSlider;
