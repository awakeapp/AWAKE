import { useEffect } from 'react';

let lockCount = 0;
let originalOverflow = '';

export function useScrollLock(isLocked = true) {
    useEffect(() => {
        if (!isLocked) return;
        
        if (lockCount === 0) {
            originalOverflow = window.getComputedStyle(document.body).overflow;
            document.body.style.overflow = 'hidden';
            document.body.style.touchAction = 'none'; // Prevents pinch-zoom and scroll on mobile
        }
        lockCount++;

        return () => {
            lockCount--;
            if (lockCount === 0) {
                document.body.style.overflow = originalOverflow;
                document.body.style.touchAction = '';
            }
        };
    }, [isLocked]);
}
