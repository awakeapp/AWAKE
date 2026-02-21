import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuthContext } from '../hooks/useAuthContext';
import { FirestoreService } from '../services/firestore-service';

const RamadanContext = createContext();

export const useRamadan = () => useContext(RamadanContext);

export const RamadanProvider = ({ children }) => {
    const { user } = useAuthContext();
    const [location, setLocation] = useState(null);
    const [prayerTimes, setPrayerTimes] = useState(null);
    const [hijriDate, setHijriDate] = useState(null);
    const [ramadanData, setRamadanData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('awake_ramadan_prefs');
        return saved ? JSON.parse(saved) : {
            calcMethod: 1, // Karachi (South Asia)
            madhab: 0, // Standard
            hijriOffset: 0
        };
    });

    const updateSettings = (newSettings) => {
        setSettings(newSettings);
        localStorage.setItem('awake_ramadan_prefs', JSON.stringify(newSettings));
    };

    // Initial Location & API Fetch
    useEffect(() => {
        const initRamadanData = async () => {
            try {
                // 1. Get Location
                let storedLoc = localStorage.getItem('awake_ramadan_location');
                let lat, lng;

                if (storedLoc) {
                    const parsed = JSON.parse(storedLoc);
                    lat = parsed.lat;
                    lng = parsed.lng;
                    setLocation(parsed);
                } else {
                    try {
                        const position = await new Promise((resolve, reject) => {
                            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
                        });
                        lat = position.coords.latitude;
                        lng = position.coords.longitude;
                        const newLoc = { lat, lng };
                        localStorage.setItem('awake_ramadan_location', JSON.stringify(newLoc));
                        setLocation(newLoc);
                    } catch (geoErr) {
                        console.warn("Geolocation failed or denied. Defaulting to Bangalore.", geoErr);
                        // Default to Bangalore coordinates if permission denied or timeout
                        lat = 12.9716;
                        lng = 77.5946;
                        setLocation({ lat, lng, isDefault: true });
                    }
                }

                // 2. Fetch Prayers
                const today = new Date();
                const month = today.getMonth() + 1;
                const year = today.getFullYear();
                const cacheKey = `ramadan_prayers_${lat.toFixed(2)}_${lng.toFixed(2)}_${month}_${year}_${settings.calcMethod}_${settings.madhab}`;
                
                let monthPrayers;
                const cached = localStorage.getItem(cacheKey);

                if (cached) {
                    monthPrayers = JSON.parse(cached);
                } else {
                    try {
                        const url = `https://api.aladhan.com/v1/calendar/${year}/${month}?latitude=${lat}&longitude=${lng}&method=${settings.calcMethod}&school=${settings.madhab}`;
                        const res = await fetch(url);
                        
                        if (!res.ok) {
                            const errText = await res.text();
                            throw new Error(`API Error ${res.status}: ${errText}`);
                        }
                        
                        const json = await res.json();
                        if (json.code === 200) {
                            monthPrayers = json.data;
                            localStorage.setItem(cacheKey, JSON.stringify(monthPrayers));
                        } else {
                            throw new Error(`Invalid API Code: ${json.code}`);
                        }
                    } catch (fetchErr) {
                        console.error("Prayer API Fetch Failed:", fetchErr);
                        throw new Error(`Fetch Failed: ${fetchErr.message}. Are you using an AdBlocker?`);
                    }
                }
                setPrayerTimes(monthPrayers);

                // 3. Get Hijri Date
                const offsetDate = new Date(today);
                offsetDate.setDate(offsetDate.getDate() + settings.hijriOffset);

                const formatter = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
                    day: 'numeric', month: 'numeric', year: 'numeric'
                });
                const [{ value: hMonth }, , { value: hDay }, , { value: hYear }] = formatter.formatToParts(offsetDate);
                
                setHijriDate({
                    day: parseInt(hDay),
                    month: parseInt(hMonth),
                    year: parseInt(hYear),
                    isRamadan: parseInt(hMonth) === 9
                });

            } catch (err) {
                console.error("Ramadan Init Error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            initRamadanData();
        } else {
            setLoading(false);
        }
    }, [user, settings]);

    // Firestore Integration for tracking days
    useEffect(() => {
        if (!user || !hijriDate?.year) return;

        const yearId = String(hijriDate.year);
        const path = `users/${user.uid}/ramadan`;
        
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
            }
        );

        return () => unsubscribe();
    }, [user, hijriDate?.year]);

    const updateRamadanDay = async (dateKey, updates) => {
        if (!user || !hijriDate?.year) return;
        const yearId = String(hijriDate.year);
        const path = `users/${user.uid}/ramadan`;

        // We use setItem with merge: true so it auto-creates the document if missing
        const newData = {
            hijriYear: yearId,
            days: {
                [dateKey]: updates // Because of mere:true, it will only merge deep under this dateKey (actually Firestore setDoc merge does shallow map merge, but to be 100% safe on nested we should construct the dot notation or ensure spread)
            }
        };

        // To safely merge nested map 'days.YYYY-MM-DD' via setDoc merge: true
        // It creates if not exists, and merges keys. 
        // More robust: use updateDoc with dot notation if doc exists, but setDoc merge:true handles creation.
        // For nested maps `days: { [dateKey]: updates }` merge might overwrite the whole `dateKey` object if we don't pass the old state.
        // So we spread the existing local state for that day first.
        const existingDayData = ramadanData?.days?.[dateKey] || {};
        
        const mergedDayData = { ...existingDayData, ...updates };

        const payload = {
            hijriYear: yearId,
            days: {
                [dateKey]: mergedDayData
            }
        };

        try {
            await FirestoreService.setItem(path, yearId, payload, true);
        } catch (err) {
            console.error("Failed to update Ramadan day:", err);
            // Revert state logic isn't strictly needed as real-time listener will correct it, 
            // but error handling is good.
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

    const requestLocation = async () => {
        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
            });
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const newLoc = { lat, lng };
            localStorage.setItem('awake_ramadan_location', JSON.stringify(newLoc));
            window.location.reload(); // Quick clean refresh to re-init everything with new coords
        } catch (err) {
            console.error("Manual location request failed:", err);
            alert("Location permission denied. Please enable it in your browser settings and try again.");
        }
    };

    const updateManualLocation = (lat, lng) => {
        const newLoc = { lat, lng };
        localStorage.setItem('awake_ramadan_location', JSON.stringify(newLoc));
        window.location.reload();
    };

    const value = {
        location,
        prayerTimes,
        hijriDate,
        ramadanData,
        loading,
        error,
        updateRamadanDay,
        updateQuranGoal,
        requestLocation,
        updateManualLocation,
        settings,
        updateSettings
    };

    return (
        <RamadanContext.Provider value={value}>
            {children}
        </RamadanContext.Provider>
    );
};
