import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const useSwipeNavigation = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);

    const minSwipeDistance = 75;

    const onTouchStart = (e) => {
        // Avoid intercepting swipes on horizontally scrollable elements or interactive charts
        if (e.target.closest('.no-swipe')) return;
        setTouchEnd(null);
        setTouchStart({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
    };

    const onTouchMove = (e) => {
        setTouchEnd({ x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY });
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        
        const distanceX = touchStart.x - touchEnd.x;
        const distanceY = touchStart.y - touchEnd.y;
        
        const isLeftSwipe = distanceX > minSwipeDistance;
        const isRightSwipe = distanceX < -minSwipeDistance;

        // Ensure swipe is predominantly horizontal to avoid firing on vertical scrolling
        if (Math.abs(distanceX) > Math.abs(distanceY) * 1.5) {
            const tabs = ['/', '/routine', '/workspace', '/finance', '/vehicle'];
            
            // Find current active tab based on pathname
            let currentIndex = tabs.findIndex(tab => 
                tab === '/' ? location.pathname === '/' : location.pathname.startsWith(tab)
            );
            
            if (currentIndex !== -1) {
                 if (isLeftSwipe && currentIndex < tabs.length - 1) {
                     navigate(tabs[currentIndex + 1]);
                 } else if (isRightSwipe && currentIndex > 0) {
                     navigate(tabs[currentIndex - 1]);
                 }
            }
        }
    };

    return { onTouchStart, onTouchMove, onTouchEnd };
};
