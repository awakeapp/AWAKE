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

    // Apply theme to DOM
    useEffect(() => {
        const root = window.document.documentElement;

        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }

        localStorage.setItem('theme', theme);
    }, [theme]);

    // Sync from Firestore on load
    useEffect(() => {
        if (!user) return;
        const fetchSettings = async () => {
            try {
                const settings = await FirestoreService.getDocument(`users/${user.uid}/config`, 'settings');
                if (settings && settings.theme && settings.theme !== theme) {
                    setTheme(settings.theme);
                }
            } catch (e) {
                console.error("Failed to fetch theme settings", e);
            }
        };
        fetchSettings();
    }, [user?.uid]);

    // Update Firestore when theme changes (debounced or simple effect?)
    // To avoid loops, we only write if it matches what we just read? 
    // Ideally user explicit action triggers save. 
    // toggleTheme is the action.

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

