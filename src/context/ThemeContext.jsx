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
        
        // Define theme colors matching index.css
        const lightColor = '#ffffff';
        const darkColor = '#020617';

        // Add minimal transition class to avoid hover lag
        // We add it here to ensure it's present during the class switch
        root.classList.add('theme-transition');

        if (theme === 'dark') {
            root.classList.add('dark');
            root.style.colorScheme = 'dark';
        } else {
            root.classList.remove('dark');
            root.style.colorScheme = 'light';
        }

        // Dynamic Meta Tag Update for Instant Status Bar Switch
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        // Legacy status bar style is static 'default' in index.html to avoid conflicts
        // iOS 15+ handles contrast automatically via theme-color

        const newColor = theme === 'dark' ? darkColor : lightColor;

        if (metaThemeColor) metaThemeColor.setAttribute('content', newColor);

        localStorage.setItem('theme', theme);

        // Remove transition class after animation completes
        const timer = setTimeout(() => {
            root.classList.remove('theme-transition');
        }, 300); // Matches CSS duration

        return () => clearTimeout(timer);
    }, [theme]);
    
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

