import { useEffect } from 'react';

let lockCount = 0;
let originalOverflow = '';

export function useScrollLock(isLocked = true) {
    useEffect(() => {
        if (!isLocked) return;
        
        if (lockCount === 0) {
            originalOverflow = window.getComputedStyle(document.body).overflow;
            document.body.style.overflow = 'hidden';
            // Also clamp height to 100% and position fixed on ios to prevent bounce?
            // Actually, overscroll-behavior: none in index.css usually handles chaining.
        }
        lockCount++;

        return () => {
            lockCount--;
            if (lockCount === 0) {
                document.body.style.overflow = originalOverflow;
            }
        };
    }, [isLocked]);
}
