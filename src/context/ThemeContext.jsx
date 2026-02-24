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
    const [theme, setTheme] = useState(() => {
        // Init from storage or system preference
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('theme');
            if (stored) return stored;

            // System preference
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                return 'dark';
            }
        }
        return 'light';
    });

    // Apply theme to DOM and Status Bar
    useEffect(() => {
        const root = window.document.documentElement;
        
        // Prevent partial rendering/flickering with temporary lock
        root.classList.add('theme-switching');
        
        // Define theme colors matching index.css
        const lightColor = '#ffffff';
        const darkColor = '#020617';

        if (theme === 'dark') {
            root.classList.add('dark');
            root.style.colorScheme = 'dark';
        } else {
            root.classList.remove('dark');
            root.style.colorScheme = 'light';
        }

        // Dynamic Meta Tag Update for Instant Status Bar Switch
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        const newColor = theme === 'dark' ? darkColor : lightColor;

        if (metaThemeColor) metaThemeColor.setAttribute('content', newColor);

        localStorage.setItem('theme', theme);

        // Remove lock after browser naturally repaints
        setTimeout(() => {
            root.classList.remove('theme-switching');
        }, 50);
    }, [theme]);

    // Listen for system theme changes if no explicit user preference
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e) => {
            const stored = localStorage.getItem('theme');
            if (stored) return; // Ignore if user has set a preference
            setTheme(e.matches ? 'dark' : 'light');
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);
    
    // ... Sync from Firestore on load (unchanged) ...

    const toggleTheme = useCallback(async () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);

        if (user) {
            try {
                // Merge with existing settings? 
                // We should probably rely on a SettingsContext for this, but simplistic approach here:
                await FirestoreService.setItem(`users/${user.uid}/config`, 'settings', { theme: newTheme }, true);
            } catch (e) {
                console.error("Failed to save theme", e);
            }
        }
    }, [theme, user]);

    const value = useMemo(() => ({
        theme,
        toggleTheme,
        isDark: theme === 'dark'
    }), [theme, toggleTheme]);

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

