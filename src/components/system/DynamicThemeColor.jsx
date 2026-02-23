import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

export default function DynamicThemeColor() {
    const location = useLocation();
    const { isDark } = useTheme();

    useEffect(() => {
        // Universal Native System Blend
        // Always match the base body background color precisely.
        // This solves P3 color space mismatches between Solid CSS and Meta-Tags on iOS.
        let color = isDark ? '#020617' : '#ffffff'; // Default: bg-slate-950 / bg-white

        // 1. Update Meta Theme Color for Android/PWA
        let metaTheme = document.querySelector('meta[name="theme-color"]');
        if (!metaTheme) {
            metaTheme = document.createElement('meta');
            metaTheme.name = 'theme-color';
            document.head.appendChild(metaTheme);
        }
        metaTheme.setAttribute('content', color);
        
        // 2. Update HTML background for iOS Safari overscroll top bounce
        document.documentElement.style.backgroundColor = color;
        
        // 3. Ensure Body background matches for bottom bounce
        document.body.style.backgroundColor = color;
        
    }, [location.pathname, isDark]);

    return null;
}
