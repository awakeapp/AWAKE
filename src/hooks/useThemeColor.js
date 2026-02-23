import { useEffect } from 'react';

/**
 * Dynamically sets the `theme-color` meta tag while a component is mounted.
 * Restores the previous value on unmount so navigation away from the page reverts correctly.
 *
 * @param {string} color  - CSS color string, e.g. '#0f172a'
 */
export function useThemeColor(color) {
    useEffect(() => {
        const meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) return;
        const previous = meta.getAttribute('content');
        meta.setAttribute('content', color);
        return () => {
            meta.setAttribute('content', previous);
        };
    }, [color]);
}
