import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe2, Save, MapPin, Navigation, Calendar, BookOpen, ChevronRight } from 'lucide-react';
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
            "flex items-center min-h-[44px] sm:min-h-[50px] bg-white dark:bg-[#1C1C1E] active:bg-slate-100 dark:active:bg-[#2C2C2E] transition-colors ml-4 pr-4",
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

const RamadanSettings = () => {
    const navigate = useNavigate();
    const { settings, updateSettings, location, requestLocation, updateManualLocation } = useRamadan();
    
    // Local state for the form
    const [localSettings, setLocalSettings] = useState(settings);
    const [manualLat, setManualLat] = useState(location?.lat || '');
    const [manualLng, setManualLng] = useState(location?.lng || '');
    const [locationName, setLocationName] = useState('Resolving location...');
    const [showManualLocation, setShowManualLocation] = useState(false);

    // Initial load
    useEffect(() => {
        setLocalSettings(settings);
        setManualLat(location?.lat || '');
        setManualLng(location?.lng || '');
        setShowManualLocation(false);
    }, [settings, location]);

    // Reverse geocode location robustly using Nominatim
    useEffect(() => {
        if (!location?.lat || !location?.lng) {
            setLocationName('Location not set');
            return;
        }

        const cacheKey = `location_${location.lat}_${location.lng}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            setLocationName(cached);
            return;
        }

        setLocationName('Resolving location...');
        
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}&zoom=18&addressdetails=1`)
            .then(res => res.json())
            .then(data => {
                if (data && data.address) {
                    const addr = data.address;
                    const locality = addr.suburb || addr.neighbourhood || addr.residential || addr.village || addr.town || addr.city_district || '';
                    const city = addr.city || addr.town || addr.county || '';
                    const state = addr.state || '';
                    const country = addr.country || '';
                    
                    const parts = [locality, city, state, country].filter(p => p && p.trim() !== '');
                    const uniqueParts = parts.filter((item, pos, arr) => {
                        return pos === 0 || item !== arr[pos - 1];
                    });
                    
                    const resolvedName = uniqueParts.join(', ');
                    if (resolvedName) {
                        setLocationName(resolvedName);
                        localStorage.setItem(cacheKey, resolvedName);
                    } else {
                        throw new Error('No valid address parts');
                    }
                } else {
                    throw new Error('Invalid response');
                }
            })
            .catch((err) => {
                console.error("Geocoding failed", err);
                setLocationName('Tap Auto-Detect to retry');
            });
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

    const handleChange = (key, value) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        updateSettings(localSettings);
        
        // Check if map coordinates changed manually
        if (
            parseFloat(manualLat) !== location?.lat ||
            parseFloat(manualLng) !== location?.lng
        ) {
            updateManualLocation(parseFloat(manualLat), parseFloat(manualLng));
            navigate(-1);
        } else {
            navigate(-1);
        }
    };

    return (
        <div className="pb-12 pt-2 sm:pt-4 bg-[#F2F2F7] dark:bg-black min-h-screen text-black dark:text-white font-sans">
            <div className="max-w-screen-md mx-auto sm:px-4">
                
                {/* Header Title */}
                <div className="px-4 flex items-center justify-between mb-4 sm:mb-6 mt-2 relative">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 bg-transparent hover:bg-black/5 dark:bg-transparent dark:hover:bg-white/10 rounded-full transition-colors active:scale-95 text-black dark:text-white -ml-2 focus:outline-none"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-black dark:text-white">Ramadan Settings</h1>
                        </div>
                    </div>
                </div>

                <div className="px-0 sm:px-0 mt-4 sm:mt-6">
                    
                    <SettingsGroup>
                        <div className="relative">
                            <SettingsRow 
                                icon={Globe2} 
                                iconBgClass="bg-blue-500"
                                title="Calculation Method" 
                                right={
                                    <div className="flex items-center">
                                        <span className="text-[16px] text-slate-500 dark:text-[#8E8E93] mr-1 truncate max-w-[140px] md:max-w-none">
                                            {ALADHAN_METHODS.find(m => m.id === localSettings.calcMethod)?.name || 'Select'}
                                        </span>
                                        <ChevronRight className="w-5 h-5 text-slate-300 dark:text-[#5C5C5E]" />
                                    </div>
                                }
                            />
                            <select
                                value={localSettings.calcMethod}
                                onChange={(e) => handleChange('calcMethod', Number(e.target.value))}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            >
                                {ALADHAN_METHODS.map(method => (
                                    <option key={method.id} value={method.id}>{method.name}</option>
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
                                        <span className="text-[16px] text-slate-500 dark:text-[#8E8E93] mr-1 truncate max-w-[140px] md:max-w-none">
                                            {MADHABS.find(m => m.id === localSettings.madhab)?.name || 'Select'}
                                        </span>
                                        <ChevronRight className="w-5 h-5 text-slate-300 dark:text-[#5C5C5E]" />
                                    </div>
                                }
                            />
                            <select
                                value={localSettings.madhab}
                                onChange={(e) => handleChange('madhab', Number(e.target.value))}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            >
                                {MADHABS.map(madhab => (
                                    <option key={madhab.id} value={madhab.id}>{madhab.name}</option>
                                ))}
                            </select>
                        </div>
                    </SettingsGroup>

                    <SettingsGroup>
                        <div className="px-4 py-3 bg-white dark:bg-[#1C1C1E]">
                            <div className="flex items-center gap-3.5 px-0 mb-3">
                                <div className="w-[30px] h-[30px] rounded-lg shrink-0 flex items-center justify-center bg-emerald-500 text-white">
                                    <Calendar strokeWidth={2} className="w-[18px] h-[18px]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-[16px] xl:text-[17px] text-black dark:text-white leading-tight">Hijri Date Adjustment</h3>
                                    <p className="text-[13px] text-slate-500 dark:text-[#8E8E93] mt-0.5 truncate">
                                        Offset: <span className="font-medium text-emerald-600 dark:text-emerald-400">{localSettings.hijriOffset > 0 ? `+${localSettings.hijriOffset}` : localSettings.hijriOffset} Days</span>
                                    </p>
                                </div>
                            </div>
                            <div className="px-12 mt-4 pb-2">
                                 <input 
                                    type="range" 
                                    min="-2" 
                                    max="2" 
                                    step="1"
                                    value={localSettings.hijriOffset}
                                    onChange={(e) => handleChange('hijriOffset', Number(e.target.value))}
                                    className="w-full accent-emerald-500"
                                 />
                                 <div className="flex justify-between text-[11px] font-bold text-slate-400 dark:text-[#8E8E93] mt-2 px-1">
                                    <span>-2</span>
                                    <span>-1</span>
                                    <span>0</span>
                                    <span>+1</span>
                                    <span>+2</span>
                                 </div>
                            </div>
                        </div>
                    </SettingsGroup>

                    <SettingsGroup>
                        <SettingsRow 
                            icon={MapPin} 
                            iconBgClass="bg-red-500"
                            title="Your Location" 
                            subtitle={locationName} 
                            onClick={() => setShowManualLocation(!showManualLocation)}
                            rightElement={<ChevronRight className={clsx("w-5 h-5 text-slate-300 dark:text-[#5C5C5E] transition-transform", showManualLocation && "rotate-90")} />}
                            isLast={!showManualLocation}
                        />
                        {showManualLocation && (
                            <div className="p-4 bg-white dark:bg-[#1C1C1E] animate-in fade-in slide-in-from-top-2 border-t border-slate-200 dark:border-[#38383A]">
                                <div className="flex gap-3 mb-4">
                                    <div className="flex-1 space-y-1">
                                        <span className="text-[11px] font-semibold text-slate-500 uppercase ml-1">Latitude</span>
                                        <input 
                                            type="number" 
                                            value={manualLat}
                                            onChange={(e) => setManualLat(e.target.value)}
                                            className="w-full bg-[#F2F2F7] dark:bg-black border border-transparent dark:border-[#2C2C2E] rounded-xl p-3 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                                            placeholder="e.g. 12.9716"
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <span className="text-[11px] font-semibold text-slate-500 uppercase ml-1">Longitude</span>
                                        <input 
                                            type="number" 
                                            value={manualLng}
                                            onChange={(e) => setManualLng(e.target.value)}
                                            className="w-full bg-[#F2F2F7] dark:bg-black border border-transparent dark:border-[#2C2C2E] rounded-xl p-3 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                                            placeholder="e.g. 77.5946"
                                        />
                                    </div>
                                </div>
                                <button 
                                    onClick={requestLocation}
                                    className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 border border-slate-200 dark:border-[#38383A] bg-white text-slate-700 hover:bg-slate-50 dark:bg-[#2C2C2E] dark:text-slate-200 dark:hover:bg-[#38383A] transition-colors"
                                >
                                    <Navigation className="w-4 h-4 text-indigo-500" />
                                    Auto-Detect using GPS
                                </button>
                            </div>
                        )}
                    </SettingsGroup>

                </div>

                <div className="px-4 sm:px-0 mt-8 mb-12">
                     <button
                        onClick={handleSave}
                        className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98]"
                    >
                        <Save className="w-5 h-5" />
                        Save Settings
                    </button>
                    <p className="text-center text-[12px] text-slate-400 dark:text-[#8E8E93] mt-4 font-medium">
                        Changes recalculate prayer times immediately.
                    </p>
                </div>

            </div>
        </div>
    );
};

export default RamadanSettings;
