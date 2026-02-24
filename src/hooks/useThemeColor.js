import { useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * Dynamically sets the `theme-color` meta tag while a component is mounted.
 * Uses ThemeContext override to ensure proper sync with device themes implicitly.
 *
 * @param {string} color  - CSS color string, e.g. '#0f172a'
 */
export function useThemeColor(color) {
    const { setThemeOverride } = useTheme();
    
    useEffect(() => {
        setThemeOverride(color);
        return () => {
            setThemeOverride(null);
        };
    }, [color, setThemeOverride]);
}
