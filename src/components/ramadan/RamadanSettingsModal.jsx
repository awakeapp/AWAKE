import React, { useState, useEffect } from 'react';
import { X, Globe2, Save, Moon, MapPin, Navigation, Calendar, BookOpen, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { useRamadan } from '../../context/RamadanContext';

const ListGroup = ({ children }) => (
    <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl overflow-hidden mb-6 shadow-sm dark:shadow-none border border-slate-200 dark:border-[#2C2C2E]">
        {children}
    </div>
);

const ListRow = ({ icon: Icon, title, subtitle, rightElement, onClick, isLast }) => (
    <div 
        onClick={onClick}
        className={clsx(
            "flex items-center gap-4 p-4 transition-colors relative",
            onClick && "cursor-pointer active:bg-slate-50 dark:active:bg-[#2C2C2E]",
        )}
    >
        <div className="flex-shrink-0">
            <Icon className="w-6 h-6 text-slate-400 dark:text-slate-500" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
            <h3 className="text-[16px] text-slate-900 dark:text-white truncate">{title}</h3>
            {subtitle && <p className="text-[13px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{subtitle}</p>}
        </div>
        {rightElement && (
            <div className="flex-shrink-0 ml-2">
                {rightElement}
            </div>
        )}
        
        {/* Divider */}
        {!isLast && (
            <div className="absolute bottom-0 left-[3.5rem] right-0 h-px bg-slate-100 dark:bg-[#2C2C2E]" />
        )}
    </div>
);

const RamadanSettingsModal = ({ isOpen, onClose }) => {
    const { settings, updateSettings, location, requestLocation, updateManualLocation } = useRamadan();
    
    // Local state for the form
    const [localSettings, setLocalSettings] = useState(settings);
    const [manualLat, setManualLat] = useState(location?.lat || '');
    const [manualLng, setManualLng] = useState(location?.lng || '');
    const [locationName, setLocationName] = useState('Resolving location...');
    const [showManualLocation, setShowManualLocation] = useState(false);

    // Reset local state when modal opens
    useEffect(() => {
        if (isOpen) {
            setLocalSettings(settings);
            setManualLat(location?.lat || '');
            setManualLng(location?.lng || '');
            setShowManualLocation(false);
        }
    }, [isOpen, settings, location]);

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
        
        // Use reliable Nominatim API
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
                    // Deduplicate adjacent identical parts
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

    if (!isOpen) return null;

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
        } else {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-slate-50 dark:bg-black rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-auto sm:zoom-in-95">
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-200 dark:border-[#2C2C2E] bg-white dark:bg-[#1C1C1E] rounded-t-3xl sm:rounded-t-3xl relative z-10">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Settings</h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 -mr-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-[#2C2C2E] rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 sm:p-6 overflow-y-auto">
                    
                    <ListGroup>
                        <div className="relative">
                            <ListRow 
                                icon={Globe2} 
                                title="Calculation Method" 
                                subtitle={ALADHAN_METHODS.find(m => m.id === localSettings.calcMethod)?.name || 'Select Method'} 
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
                            <ListRow 
                                icon={BookOpen} 
                                title="Asr Madhab" 
                                subtitle={MADHABS.find(m => m.id === localSettings.madhab)?.name || 'Select Madhab'} 
                                isLast={true}
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
                    </ListGroup>

                    <ListGroup>
                        <div className="p-4">
                            <div className="flex items-center gap-4 mb-3">
                                <Calendar className="w-6 h-6 text-slate-400 dark:text-slate-500 flex-shrink-0" strokeWidth={1.5} />
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-[16px] text-slate-900 dark:text-white truncate">Hijri Date Adjustment</h3>
                                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
                                        Offset: <span className="text-indigo-600 dark:text-indigo-400 font-medium">{localSettings.hijriOffset > 0 ? `+${localSettings.hijriOffset}` : localSettings.hijriOffset} Days</span>
                                    </p>
                                </div>
                            </div>
                            <div className="px-10 mt-4">
                                 <input 
                                    type="range" 
                                    min="-2" 
                                    max="2" 
                                    step="1"
                                    value={localSettings.hijriOffset}
                                    onChange={(e) => handleChange('hijriOffset', Number(e.target.value))}
                                    className="w-full accent-indigo-500"
                                 />
                                 <div className="flex justify-between text-[11px] font-bold text-slate-400 mt-1">
                                    <span>-2</span>
                                    <span>-1</span>
                                    <span>0</span>
                                    <span>+1</span>
                                    <span>+2</span>
                                 </div>
                            </div>
                        </div>
                    </ListGroup>

                    <ListGroup>
                        <ListRow 
                            icon={MapPin} 
                            title="Your Location" 
                            subtitle={locationName} 
                            onClick={() => setShowManualLocation(!showManualLocation)}
                            rightElement={<ChevronRight className={clsx("w-5 h-5 text-slate-400 transition-transform", showManualLocation && "rotate-90")} />}
                            isLast={!showManualLocation}
                        />
                        {showManualLocation && (
                            <div className="p-4 pt-2 animate-in fade-in slide-in-from-top-2">
                                <div className="flex gap-3 mb-4">
                                    <div className="flex-1 space-y-1">
                                        <span className="text-[11px] font-semibold text-slate-500 uppercase ml-1">Latitude</span>
                                        <input 
                                            type="number" 
                                            value={manualLat}
                                            onChange={(e) => setManualLat(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#2C2C2E] rounded-xl p-3 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                                            placeholder="e.g. 12.9716"
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <span className="text-[11px] font-semibold text-slate-500 uppercase ml-1">Longitude</span>
                                        <input 
                                            type="number" 
                                            value={manualLng}
                                            onChange={(e) => setManualLng(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#2C2C2E] rounded-xl p-3 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                                            placeholder="e.g. 77.5946"
                                        />
                                    </div>
                                </div>
                                <button 
                                    onClick={requestLocation}
                                    className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 border border-slate-200 dark:border-[#2C2C2E] bg-white text-slate-700 hover:bg-slate-50 dark:bg-[#2C2C2E]/50 dark:text-slate-200 dark:hover:bg-[#2C2C2E] transition-colors"
                                >
                                    <Navigation className="w-4 h-4 text-indigo-500" />
                                    Auto-Detect using GPS
                                </button>
                            </div>
                        )}
                    </ListGroup>

                </div>

                {/* Footer */}
                <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-[#2C2C2E] bg-white dark:bg-[#1C1C1E] rounded-b-3xl">
                    <button
                        onClick={handleSave}
                        className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98]"
                    >
                        <Save className="w-5 h-5" />
                        Save Settings
                    </button>
                    <p className="text-center text-[11px] text-slate-400 mt-3 font-medium">
                        Saving will recalculate your prayer times and dates immediately.
                    </p>
                </div>

            </div>
        </div>
    );
};

export default RamadanSettingsModal;
