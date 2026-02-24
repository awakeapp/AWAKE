import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const PrayerContext = createContext();

export const usePrayer = () => useContext(PrayerContext);

const FALLBACK_LOCATION = { lat: 12.9716, lng: 77.5946, isFallback: true };
const STORAGE_KEY_LOC = 'awake_prayer_location';
const STORAGE_KEY_SETTINGS = 'awake_prayer_settings';
const STORAGE_KEY_PRAYER = 'awake_prayer_daily';

// Haversine formula to calculate distance in km
function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Number.MAX_VALUE;
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

export const PrayerProvider = ({ children }) => {
    const [location, setLocation] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY_LOC);
        return saved ? JSON.parse(saved) : null;
    });

    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
        return saved ? JSON.parse(saved) : { method: null, madhab: null, hijriOffset: 0, manualOverride: false };
    });

    const [locationDetails, setLocationDetails] = useState({
        city: '', state: '', country: '', displayName: 'Location...'
    });

    const [prayerData, setPrayerData] = useState({
        dailyTimings: null,
        hijriDate: null,
        timezone: ''
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const watchIdRef = useRef(null);
    const fetchTimeoutRef = useRef(null);
    const isFetchingRef = useRef(false);

    // Persist settings
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    }, [settings]);

    // Save location to local storage (only real GPS / manual locations)
    useEffect(() => {
        if (location && !location.isFallback) {
            localStorage.setItem(STORAGE_KEY_LOC, JSON.stringify(location));
        }
    }, [location]);

    // 1. Initialize Location Engine (watchPosition)
    useEffect(() => {
        if (!navigator.geolocation) {
            if (!location) setLocation(FALLBACK_LOCATION);
            return;
        }

        const handlePosition = (position) => {
            const { latitude, longitude } = position.coords;
            
            setLocation((prev) => {
                // If previous was fallback or null, always accept GPS coordinates
                if (!prev || prev.isFallback) {
                    // Clear stale fallback from localStorage
                    localStorage.removeItem(STORAGE_KEY_LOC);
                    return { lat: latitude, lng: longitude };
                }
                const dist = calculateDistance(prev.lat, prev.lng, latitude, longitude);
                // Update only if distance is more than 5km
                if (dist > 5) {
                    return { lat: latitude, lng: longitude };
                }
                return prev; // keep old to avoid refetch
            });
        };

        const handleError = (err) => {
            console.warn("GPS Denied or Error:", err);
            // Only set fallback if we literally have no location yet
            if (!location) {
                setLocation(FALLBACK_LOCATION);
            }
        };

        // Start watching
        watchIdRef.current = navigator.geolocation.watchPosition(
            handlePosition, 
            handleError, 
            { enableHighAccuracy: false, maximumAge: 60000, timeout: 20000 }
        );

        // If no location after 3s, assume fallback (but watchPosition might still update it later)
        const initTimeout = setTimeout(() => {
            setLocation(prev => prev ? prev : FALLBACK_LOCATION);
        }, 3000);

        return () => {
            clearTimeout(initTimeout);
            if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount

    // 2. Fetch Location Details & Prayer Times (Debounced)
    useEffect(() => {
        if (!location) return;

        const executeFetch = async () => {
            if (isFetchingRef.current) return;
            isFetchingRef.current = true;
            setLoading(true);

            try {
                // A. Reverse Geocoding (with addressdetails=1 for full breakdown)
                let country = '';
                try {
                    const resGeocode = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${location.lat}&lon=${location.lng}&format=json&addressdetails=1&zoom=18`
                    );
                    if (resGeocode.ok) {
                        const dataGeocode = await resGeocode.json();
                        const addr = dataGeocode.address || {};
                        
                        // Locality: prefer granular locality first, then broader
                        const locality = addr.suburb || addr.neighbourhood || addr.village || addr.town || addr.city_district || addr.city || addr.county || '';
                        // City: broader city/town name
                        const city = addr.city || addr.town || addr.county || '';
                        const state = addr.state || '';
                        country = addr.country || '';

                        // Build display: "Locality, City" or "Locality, State" 
                        const parts = [locality, city, state].filter(Boolean);
                        // Deduplicate adjacent duplicates (e.g. if locality == city)
                        const uniqueParts = parts.filter((item, i, arr) => i === 0 || item !== arr[i - 1]);
                        const locDisplayName = uniqueParts.slice(0, 2).join(', ') || 'Unknown Location';
                        
                        setLocationDetails({ city: locality || city, state, country, displayName: locDisplayName });
                    }
                } catch (geoErr) {
                    console.warn("Geocoding failed, using fallback display:", geoErr);
                }

                // B. Auto-detect India Settings if not manually overridden
                let currentMethod = settings.method || 2; // Default 2 (ISNA)
                let currentMadhab = settings.madhab || 0; // Default 0 (Shafi)
                let currentHijriOffset = settings.hijriOffset ?? 0;

                if (country === 'India' && !settings.manualOverride) {
                    currentMethod = 1;    // Karachi
                    currentMadhab = 1;    // Hanafi
                    currentHijriOffset = 1; // +1 for India moon sighting
                    
                    if (settings.method !== 1 || settings.madhab !== 1 || settings.hijriOffset !== 1) {
                         setSettings({ method: 1, madhab: 1, hijriOffset: 1, manualOverride: false });
                    }
                }

                // C. Fetch AlAdhan API
                const dateStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
                const cacheKey = `${STORAGE_KEY_PRAYER}_${dateStr}_${location.lat.toFixed(2)}_${location.lng.toFixed(2)}_${currentMethod}_${currentMadhab}_${currentHijriOffset}`;
                
                const cachedData = localStorage.getItem(cacheKey);
                if (cachedData) {
                    setPrayerData(JSON.parse(cachedData));
                    setLoading(false);
                    isFetchingRef.current = false;
                    setError(null);
                    return;
                }

                try {
                    const timestamp = Math.floor(Date.now() / 1000);
                    const resPrayer = await fetch(
                        `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${location.lat}&longitude=${location.lng}&method=${currentMethod}&school=${currentMadhab}&adjustment=${currentHijriOffset}`
                    );
                    
                    if (!resPrayer.ok) throw new Error("Failed to fetch timings");
                    const dataPrayer = await resPrayer.json();

                    if (dataPrayer.code === 200) {
                        const hijri = dataPrayer.data.date.hijri;
                        const cleanHijriMonth = hijri.month.en.replace(/\s/g, '');
                        
                        const pData = {
                            dailyTimings: dataPrayer.data.timings,
                            hijriDate: {
                                day: parseInt(hijri.day, 10),
                                month: hijri.month.number,
                                monthName: cleanHijriMonth,
                                year: parseInt(hijri.year, 10),
                                isRamadan: hijri.month.number === 9
                            },
                            timezone: dataPrayer.data.meta.timezone
                        };
                        
                        // Cleanup old caches
                        Object.keys(localStorage).forEach(key => {
                            if (key.startsWith(STORAGE_KEY_PRAYER)) localStorage.removeItem(key);
                        });
                        
                        localStorage.setItem(cacheKey, JSON.stringify(pData));
                        setPrayerData(pData);
                        setError(null);
                    }
                } catch (prayerErr) {
                    console.error("Prayer API fetch failed:", prayerErr);
                    setError("Timings unavailable. Please check your connection.");
                }
            } catch (err) {
                console.error("Prayer/Location Engine Error:", err);
                setError("An error occurred loading settings.");
            } finally {
                setLoading(false);
                isFetchingRef.current = false;
            }
        };

        // Debounce 30 seconds (or 1s if first load)
        const delay = prayerData.dailyTimings ? 30000 : 1000;
        fetchTimeoutRef.current = setTimeout(executeFetch, delay);

        return () => {
            clearTimeout(fetchTimeoutRef.current);
            isFetchingRef.current = false;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location?.lat, location?.lng, settings.method, settings.madhab, settings.hijriOffset]);

    const requestLocation = () => {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                console.warn("Geolocation not supported. Falling back.");
                resolve(location || FALLBACK_LOCATION);
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    // Clear fallback cache
                    localStorage.removeItem(STORAGE_KEY_LOC);
                    const newLoc = { lat: latitude, lng: longitude, isManual: false };
                    setLocation(newLoc);
                    resolve(newLoc);
                },
                (err) => {
                    console.warn("GPS request failed or denied:", err);
                    resolve(location || FALLBACK_LOCATION);
                },
                { timeout: 10000, enableHighAccuracy: true }
            );
        });
    };

    const updateManualLocation = (lat, lng) => {
        localStorage.removeItem(STORAGE_KEY_LOC);
        setLocation({ lat: parseFloat(lat), lng: parseFloat(lng), isManual: true });
    };

    const updateSettings = (updates) => {
        // Clear prayer cache so new settings trigger a fresh fetch
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(STORAGE_KEY_PRAYER)) localStorage.removeItem(key);
        });
        setSettings(prev => ({ ...prev, ...updates, manualOverride: true }));
    };

    const value = {
        latitude: location?.lat,
        longitude: location?.lng,
        ...locationDetails,
        timezone: prayerData.timezone,
        calculationMethod: settings.method,
        madhab: settings.madhab,
        hijriOffset: settings.hijriOffset ?? 0,
        dailyTimings: prayerData.dailyTimings,
        hijriDate: prayerData.hijriDate,
        loading,
        error,
        requestLocation,
        updateManualLocation,
        updateSettings
    };

    return (
        <PrayerContext.Provider value={value}>
            {children}
        </PrayerContext.Provider>
    );
};
