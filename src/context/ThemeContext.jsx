import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useAuthContext } from '../hooks/useAuthContext';
import { FirestoreService } from '../services/firestore-service';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeContextProvider');
    }
    return context;
};

export const ThemeContextProvider = ({ children }) => {
    const { user } = useAuthContext();
    
    // Track user's explicit preference: 'system', 'light', or 'dark'
    const [themePreference, setThemePreferenceState] = useState(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('themePreference') || localStorage.getItem('theme'); // fallback legacy
            if (stored && ['light', 'dark', 'system'].includes(stored)) return stored;
        }
        return 'system';
    });

    // The actual resolved active theme based on preference and OS
    const [resolvedTheme, setResolvedTheme] = useState(() => {
        if (themePreference === 'system') {
            return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return themePreference;
    });

    // Optional override for specific pages (e.g. Finance Dashboard)
    const [themeOverride, setThemeOverride] = useState(null);

    // Sync preference strictly to Firestore and LocalStorage
    const setThemePreference = useCallback(async (newPref) => {
        if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(20);
        setThemePreferenceState(newPref);
        localStorage.setItem('themePreference', newPref);

        // Optional: save to firebase
        if (user) {
            try {
                await FirestoreService.setItem(`users/${user.uid}/config`, 'settings', { theme: newPref }, true);
            } catch (e) {
                console.error("Failed to save theme setting", e);
            }
        }
    }, [user]);

    // System theme listener
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e) => {
            if (themePreference === 'system') {
                setResolvedTheme(e.matches ? 'dark' : 'light');
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        
        // Ensure resolved theme is always up to date if preference changes
        if (themePreference === 'system') {
            setResolvedTheme(mediaQuery.matches ? 'dark' : 'light');
        } else {
            setResolvedTheme(themePreference);
        }

        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [themePreference]);

    // Apply resolved theme to DOM and Status Bar
    useEffect(() => {
        const root = window.document.documentElement;
        
        // Prevent partial rendering/flickering with temporary lock
        root.classList.add('theme-switching');
        
        // Define theme colors matching index.css
        const lightColor = '#ffffff';
        const darkColor = '#020617';

        if (resolvedTheme === 'dark') {
            root.classList.add('dark');
            root.style.colorScheme = 'dark';
        } else {
            root.classList.remove('dark');
            root.style.colorScheme = 'light';
        }

        // Dynamic Meta Tag Update for Instant Status Bar Switch
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        const colorSchemeMeta = document.getElementById('color-scheme-meta');
        
        // Use override if present, else default
        const targetColor = themeOverride || (resolvedTheme === 'dark' ? darkColor : lightColor);

        // Force recreation of theme-color meta tag to bypass iOS PWA caching bug
        if (metaThemeColor) {
            metaThemeColor.remove();
        }
        const newMetaThemeColor = document.createElement('meta');
        newMetaThemeColor.name = 'theme-color';
        newMetaThemeColor.content = targetColor;
        document.head.appendChild(newMetaThemeColor);

        // Force recreation of color-scheme meta tag to enforce text color (black vs white)
        if (colorSchemeMeta) {
            colorSchemeMeta.remove();
        }
        const newColorSchemeMeta = document.createElement('meta');
        newColorSchemeMeta.id = 'color-scheme-meta';
        newColorSchemeMeta.name = 'color-scheme';
        // Only force the specific scheme so the PWA matches the manual app override
        newColorSchemeMeta.content = resolvedTheme === 'dark' ? 'dark' : 'light';
        document.head.appendChild(newColorSchemeMeta);

        document.documentElement.style.backgroundColor = targetColor; // Hard apply iOS Top Bounce
        document.body.style.backgroundColor = targetColor;           // Hard apply iOS Bottom Bounce

        // Provide legacy fallback just in case scripts read it
        localStorage.setItem('theme', resolvedTheme);

        // Remove lock after browser naturally repaints
        setTimeout(() => {
            root.classList.remove('theme-switching');
        }, 50);
    }, [resolvedTheme, themeOverride]);

    const value = useMemo(() => ({
        theme: resolvedTheme, // Keep 'theme' property for backward compatibility (evaluates to 'dark' | 'light')
        themePreference,      // New explicit preference property ('dark' | 'light' | 'system')
        setThemePreference,
        themeOverride,
        setThemeOverride,
        isDark: resolvedTheme === 'dark'
    }), [resolvedTheme, themePreference, setThemePreference, themeOverride, setThemeOverride]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

