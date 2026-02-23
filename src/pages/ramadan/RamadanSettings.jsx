import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe2, Save, MapPin, Navigation, Calendar, BookOpen, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { useRamadan } from '../../context/RamadanContext';

// Shared Group Component matching Settings App layout
const SettingsGroup = ({ children, className }) => (
    <div className={clsx("mb-6 sm:mb-8", className)}>
        <div className="bg-white dark:bg-[#1C1C1E] rounded-none sm:rounded-xl overflow-hidden shadow-sm dark:shadow-none sm:border sm:border-slate-200 sm:dark:border-[#2C2C2E]">
            {children}
        </div>
    </div>
);

// Shared Row Component matching Settings App layout
const SettingsRow = ({ icon: Icon, iconBgClass, title, subtitle, right, rightElement, onClick, className, isLast }) => (
    <div 
        onClick={onClick}
        className={clsx(
            "flex items-center min-h-[44px] sm:min-h-[50px] bg-white dark:bg-[#1C1C1E] active:bg-slate-100 dark:active:bg-[#2C2C2E] transition-colors duration-75 ml-4 pr-4",
            !isLast && "border-b border-slate-200 dark:border-[#38383A]",
            onClick && "cursor-pointer",
            className
        )}
    >
        <div className="flex items-center gap-3.5 py-2.5 flex-1 min-w-0">
            {Icon && (
                <div className={clsx("w-[30px] h-[30px] rounded-lg shrink-0 flex items-center justify-center text-white", iconBgClass || "bg-indigo-500")}>
                    <Icon strokeWidth={2} className="w-[18px] h-[18px]" />
                </div>
            )}
            <div className="flex-1 min-w-0 flex items-center justify-between py-1">
                <div className="flex flex-col min-w-0">
                    <p className="text-[16px] xl:text-[17px] text-black dark:text-white leading-tight truncate">{title}</p>
                    {subtitle && <p className="text-[13px] text-slate-500 dark:text-[#8E8E93] mt-0.5 truncate">{subtitle}</p>}
                </div>
            </div>
        </div>
        {rightElement || right ? (
            <div className="shrink-0 ml-2 flex items-center">
                {rightElement || right}
            </div>
        ) : onClick ? (
            <ChevronRight className="w-5 h-5 text-slate-300 dark:text-[#5C5C5E] ml-2 shrink-0 relative top-[1px]" />
        ) : null}
    </div>
);

// Reverse geocode utility with localStorage caching
const resolveLocationName = async (lat, lng) => {
    const cacheKey = `location_${parseFloat(lat).toFixed(4)}_${parseFloat(lng).toFixed(4)}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) return cached;

    const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    );
    const data = await res.json();
    if (!data?.address) throw new Error('No address returned');

    const addr = data.address;
    const parts = [
        addr.suburb || addr.neighbourhood || addr.residential || addr.village || addr.town || addr.city_district,
        addr.city || addr.town || addr.county,
        addr.state,
        addr.country
    ].filter(Boolean);

    const unique = parts.filter((item, i, arr) => i === 0 || item !== arr[i - 1]);
    const name = unique.join(', ');
    if (name) localStorage.setItem(cacheKey, name);
    return name || 'Location resolved';
};

const RamadanSettings = () => {
    const navigate = useNavigate();
    const { settings, updateSettings, location, requestLocation, updateManualLocation } = useRamadan();
    
    const [localSettings, setLocalSettings] = useState(settings);
    const [manualLat, setManualLat] = useState(location?.lat || '');
    const [manualLng, setManualLng] = useState(location?.lng || '');
    const [locationName, setLocationName] = useState('Resolving...');
    const [showManualLocation, setShowManualLocation] = useState(false);
    const [gpsLoading, setGpsLoading] = useState(false);
    const [gpsError, setGpsError] = useState('');

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    useEffect(() => {
        setManualLat(location?.lat || '');
        setManualLng(location?.lng || '');
    }, [location]);

    // Reverse geocode whenever the location changes
    useEffect(() => {
        if (!location?.lat || !location?.lng) {
            setLocationName('Location not set');
            return;
        }
        setLocationName('Resolving...');
        resolveLocationName(location.lat, location.lng)
            .then(name => setLocationName(name))
            .catch(() => setLocationName('Tap to update location'));
    }, [location?.lat, location?.lng]);

    const ALADHAN_METHODS = [
        { id: 2, name: 'ISNA (North America)' },
        { id: 3, name: 'Muslim World League (MWL)' },
        { id: 4, name: 'Umm Al-Qura, Makkah' },
        { id: 5, name: 'Egyptian General Authority' },
        { id: 8, name: 'Gulf Region' },
        { id: 1, name: 'Karachi (South Asia / India)' },
        { id: 11, name: 'Majlis Ugama Islam Singapura' },
        { id: 17, name: 'JAKIM (Malaysia)' },
        { id: 20, name: 'Kemenag (Indonesia)' },
    ];

    const MADHABS = [
        { id: 0, name: 'Standard (Shafi, Maliki, Hanbali)' },
        { id: 1, name: 'Hanafi' },
    ];

    const handleChange = (key, value) => setLocalSettings(prev => ({ ...prev, [key]: value }));

    const handleSave = async () => {
        updateSettings(localSettings);
        const lat = parseFloat(manualLat);
        const lng = parseFloat(manualLng);
        if (lat && lng && (lat !== location?.lat || lng !== location?.lng)) {
            updateManualLocation(lat, lng);
        }
        navigate(-1);
    };

    const handleGPSDetect = async () => {
        setGpsLoading(true);
        setGpsError('');
        try {
            const newLoc = await requestLocation();
            if (newLoc) {
                setManualLat(newLoc.lat);
                setManualLng(newLoc.lng);
                const name = await resolveLocationName(newLoc.lat, newLoc.lng);
                setLocationName(name);
            }
        } catch (err) {
            const msg = err?.code === 1
                ? 'Location permission denied. Enable it in your browser settings.'
                : err?.code === 3
                ? 'GPS timed out. Please try again.'
                : 'Could not detect location. Please try again.';
            setGpsError(msg);
        } finally {
            setGpsLoading(false);
        }
    };

    return (
        <div className="pb-12 pt-2 sm:pt-4 bg-[#F2F2F7] dark:bg-black min-h-screen text-black dark:text-white font-sans">
            <div className="max-w-screen-md mx-auto sm:px-4">
                
                {/* Header */}
                <div className="px-4 flex items-center gap-3 mb-4 sm:mb-6 mt-2">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 bg-transparent hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors active:scale-95 text-black dark:text-white -ml-2 focus:outline-none"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">Ramadan Settings</h1>
                </div>

                <div className="mt-4 sm:mt-6">
                    
                    {/* Prayer Calculation Group */}
                    <SettingsGroup>
                        <div className="relative">
                            <SettingsRow 
                                icon={Globe2} 
                                iconBgClass="bg-blue-500"
                                title="Calculation Method" 
                                right={
                                    <div className="flex items-center">
                                        <span className="text-[15px] text-slate-500 dark:text-[#8E8E93] mr-1 truncate max-w-[140px]">
                                            {ALADHAN_METHODS.find(m => m.id === localSettings.calcMethod)?.name || 'Select'}
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-[#5C5C5E] shrink-0" />
                                    </div>
                                }
                            />
                            <select
                                value={localSettings.calcMethod}
                                onChange={(e) => handleChange('calcMethod', Number(e.target.value))}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            >
                                {ALADHAN_METHODS.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="relative">
                            <SettingsRow 
                                icon={BookOpen} 
                                iconBgClass="bg-indigo-500"
                                title="Asr Madhab" 
                                isLast={true}
                                right={
                                    <div className="flex items-center">
                                        <span className="text-[15px] text-slate-500 dark:text-[#8E8E93] mr-1 truncate max-w-[140px]">
                                            {MADHABS.find(m => m.id === localSettings.madhab)?.name || 'Select'}
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-[#5C5C5E] shrink-0" />
                                    </div>
                                }
                            />
                            <select
                                value={localSettings.madhab}
                                onChange={(e) => handleChange('madhab', Number(e.target.value))}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            >
                                {MADHABS.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                    </SettingsGroup>

                    {/* Hijri Date Adjustment */}
                    <SettingsGroup>
                        <div className="px-4 py-4 bg-white dark:bg-[#1C1C1E]">
                            <div className="flex items-center gap-3.5 mb-4">
                                <div className="w-[30px] h-[30px] rounded-lg shrink-0 flex items-center justify-center bg-emerald-500 text-white">
                                    <Calendar strokeWidth={2} className="w-[18px] h-[18px]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[16px] text-black dark:text-white leading-tight">Hijri Date Adjustment</p>
                                    <p className="text-[13px] text-slate-500 dark:text-[#8E8E93] mt-0.5">
                                        Offset: <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                            {localSettings.hijriOffset > 0 ? `+${localSettings.hijriOffset}` : localSettings.hijriOffset} days
                                        </span>
                                    </p>
                                </div>
                            </div>
                            <div className="px-10 pb-1">
                                <input 
                                    type="range" 
                                    min="-2" max="2" step="1"
                                    value={localSettings.hijriOffset}
                                    onChange={(e) => handleChange('hijriOffset', Number(e.target.value))}
                                    className="w-full accent-emerald-500"
                                />
                                <div className="flex justify-between text-[11px] font-bold text-slate-400 dark:text-[#8E8E93] mt-1.5">
                                    {['-2', '-1', '0', '+1', '+2'].map(v => <span key={v}>{v}</span>)}
                                </div>
                            </div>
                        </div>
                    </SettingsGroup>

                    {/* Location Group */}
                    <SettingsGroup>
                        <SettingsRow 
                            icon={MapPin} 
                            iconBgClass="bg-red-500"
                            title="Prayer Location" 
                            subtitle={locationName}
                            onClick={() => setShowManualLocation(s => !s)}
                            rightElement={<ChevronRight className={clsx("w-5 h-5 text-slate-300 dark:text-[#5C5C5E] transition-transform duration-200", showManualLocation && "rotate-90")} />}
                            isLast={!showManualLocation}
                        />
                        {showManualLocation && (
                            <div className="px-4 pb-4 pt-3 bg-white dark:bg-[#1C1C1E] border-t border-slate-200 dark:border-[#38383A]">
                                
                                {/* Auto-detect GPS button */}
                                <button 
                                    onClick={handleGPSDetect}
                                    disabled={gpsLoading}
                                    className="w-full mb-4 py-3 rounded-xl text-[15px] font-semibold flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors disabled:opacity-60"
                                >
                                    {gpsLoading ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Detecting location…</>
                                    ) : (
                                        <><Navigation className="w-4 h-4" /> Auto-Detect using GPS</>
                                    )}
                                </button>

                                {/* GPS Error */}
                                {gpsError && (
                                    <div className="mb-4 flex items-start gap-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-3">
                                        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                                        <p className="text-[13px] text-red-600 dark:text-red-400">{gpsError}</p>
                                    </div>
                                )}

                                {/* Manual coordinates */}
                                <p className="text-[11px] font-semibold text-slate-400 dark:text-[#8E8E93] uppercase tracking-wide mb-2">Or enter manually</p>
                                <div className="flex gap-3">
                                    <div className="flex-1 space-y-1">
                                        <span className="text-[11px] font-medium text-slate-500 ml-1">Latitude</span>
                                        <input 
                                            type="number" 
                                            value={manualLat}
                                            onChange={(e) => setManualLat(e.target.value)}
                                            className="w-full bg-[#F2F2F7] dark:bg-black border border-transparent dark:border-[#2C2C2E] rounded-xl p-3 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                                            placeholder="e.g. 12.9716"
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <span className="text-[11px] font-medium text-slate-500 ml-1">Longitude</span>
                                        <input 
                                            type="number" 
                                            value={manualLng}
                                            onChange={(e) => setManualLng(e.target.value)}
                                            className="w-full bg-[#F2F2F7] dark:bg-black border border-transparent dark:border-[#2C2C2E] rounded-xl p-3 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                                            placeholder="e.g. 77.5946"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </SettingsGroup>

                </div>

                {/* Save Button */}
                <div className="px-4 sm:px-0 mt-6 mb-12">
                    <button
                        onClick={handleSave}
                        className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98]"
                    >
                        <Save className="w-5 h-5" />
                        Save Settings
                    </button>
                    <p className="text-center text-[12px] text-slate-400 dark:text-[#8E8E93] mt-4">
                        Changes recalculate prayer times immediately.
                    </p>
                </div>

            </div>
        </div>
    );
};

export default RamadanSettings;
