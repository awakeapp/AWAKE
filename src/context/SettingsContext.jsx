import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuthContext } from '../hooks/useAuthContext';
import { FirestoreService } from '../services/firestore-service';
import { useTranslation } from 'react-i18next';

const SettingsContext = createContext();

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

export const SettingsProvider = ({ children }) => {
    const { user } = useAuthContext();
    const { i18n } = useTranslation();

    const [appSettings, setAppSettings] = useState(() => {
        return {
            language: localStorage.getItem('appLanguage') || 'en',
            timeFormat: localStorage.getItem('appTimeFormat') || '12h'
        }
    });

    useEffect(() => {
        if (!user) return;
        
        const unsub = FirestoreService.subscribeToDocument(
            `users/${user.uid}/config`,
            'settings',
            (data) => {
                if (data) {
                    setAppSettings(prev => {
                        const newSettings = { ...prev, ...data };
                        localStorage.setItem('appLanguage', newSettings.language || 'en');
                        localStorage.setItem('appTimeFormat', newSettings.timeFormat || '12h');
                        return newSettings;
                    });
                    
                    if (data.language && data.language !== i18n.language) {
                        i18n.changeLanguage(data.language);
                    }
                }
            }
        );
        
        return () => unsub();
    }, [user, i18n]);

    const updateSetting = useCallback(async (key, value) => {
        if (key === 'language') {
            i18n.changeLanguage(value);
        }
        
        localStorage.setItem(`app${key.charAt(0).toUpperCase() + key.slice(1)}`, value);
        
        setAppSettings(prev => ({ ...prev, [key]: value }));

        if (user) {
            try {
                await FirestoreService.setItem(`users/${user.uid}/config`, 'settings', { [key]: value }, true);
            } catch (e) {
                console.error("Failed to save setting", e);
            }
        }
    }, [user, i18n]);

    const value = useMemo(() => ({
        appSettings,
        updateSetting,
        timeFormat: appSettings.timeFormat || '12h'
    }), [appSettings, updateSetting]);

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};
