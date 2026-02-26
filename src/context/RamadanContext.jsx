import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuthContext } from '../hooks/useAuthContext';
import { FirestoreService } from '../services/firestore-service';
import { usePrayer } from './PrayerContext';

const RamadanContext = createContext();

export const useRamadan = () => useContext(RamadanContext);

export const RamadanProvider = ({ children }) => {
    const { user } = useAuthContext();
    const { hijriDate, loading: prayerLoading, error: prayerError } = usePrayer();
    
    const [ramadanData, setRamadanData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // We no longer manage location, prayer API fetching, or settings (method/madhab) here.
    // They are fully managed by PrayerContext.

    // Firestore Integration for tracking days
    useEffect(() => {
        if (!user || !hijriDate?.year) {
            setLoading(prayerLoading);
            if (prayerError) setError(prayerError);
            return;
        }

        const yearId = String(hijriDate.year);
        const path = `users/${user.uid}/ramadan`;
        
        setLoading(true);
        const unsubscribe = FirestoreService.subscribeToDocument(
            path,
            yearId,
            (data) => {
                if (data) {
                    setRamadanData(data);
                } else {
                    // Document doesn't exist yet, we will auto-create on first interaction
                    setRamadanData({
                        id: yearId,
                        hijriYear: yearId,
                        days: {}
                    });
                }
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user, hijriDate?.year, prayerLoading, prayerError]);

    const updateRamadanDay = async (dateKey, updates) => {
        if (!user || !hijriDate?.year) return;
        const yearId = String(hijriDate.year);
        const path = `users/${user.uid}/ramadan`;

        // Optimistic update to UI
        setRamadanData(prev => {
            if (!prev) return prev;
            const existingDayData = prev.days?.[dateKey] || {};
            return {
                ...prev,
                days: {
                    ...prev.days,
                    [dateKey]: { ...existingDayData, ...updates }
                }
            };
        });

        // Deep merge on Firestore side (setDoc with { merge: true })
        const payload = {
            hijriYear: yearId,
            days: {
                [dateKey]: updates
            }
        };

        try {
            await FirestoreService.setItem(path, yearId, payload, true);
        } catch (err) {
            console.error("Failed to update Ramadan day:", err);
        }
    };

    const updateQuranGoal = async (goal) => {
        if (!user || !hijriDate?.year) return;
        const yearId = String(hijriDate.year);
        const path = `users/${user.uid}/ramadan`;

        try {
            await FirestoreService.setItem(path, yearId, { quranGoal: goal }, true);
        } catch (err) {
            console.error("Failed to update Quran goal:", err);
        }
    };

    const updateCustomPrayers = async (prayers) => {
        if (!user || !hijriDate?.year) return;
        const yearId = String(hijriDate.year);
        const path = `users/${user.uid}/ramadan`;
        try {
            await FirestoreService.setItem(path, yearId, { customPrayers: prayers }, true);
        } catch (err) {
            console.error("Failed to update custom prayers:", err);
        }
    };

    const updateCustomDhikr = async (dhikr) => {
        if (!user || !hijriDate?.year) return;
        const yearId = String(hijriDate.year);
        const path = `users/${user.uid}/ramadan`;
        try {
            await FirestoreService.setItem(path, yearId, { customDhikr: dhikr }, true);
        } catch (err) {
            console.error("Failed to update custom dhikr:", err);
        }
    };

    const value = {
        ramadanData,
        loading,
        error,
        updateRamadanDay,
        updateQuranGoal,
        updateCustomPrayers,
        updateCustomDhikr,
        // re-export hijriDate for easy access down the tree
        hijriDate 
    };

    return (
        <RamadanContext.Provider value={value}>
            {children}
        </RamadanContext.Provider>
    );
};
