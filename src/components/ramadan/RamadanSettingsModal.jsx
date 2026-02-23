import React, { useState, useEffect } from 'react';
import { X, Globe2, Save, Moon, MapPin, Navigation, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { useRamadan } from '../../context/RamadanContext';

const RamadanSettingsModal = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
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

    // Reverse geocode location
    useEffect(() => {
        if (location?.lat && location?.lng) {
            fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${location.lat}&longitude=${location.lng}&localityLanguage=en`)
                .then(res => res.json())
                .then(data => {
                    if (data.city || data.locality || data.principalSubdivision) {
                        const city = data.city || data.locality || '';
                        const state = data.principalSubdivision || '';
                        const country = data.countryName || '';
                        setLocationName([city, state, country].filter(Boolean).join(', '));
                    } else {
                        setLocationName('Location Resolved');
                    }
                })
                .catch(() => setLocationName('Location Resolved'));
        } else {
            setLocationName('Location not set');
        }
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

    const OFFSET_OPTIONS = [
        { value: -2, label: '-2 Days' },
        { value: -1, label: '-1 Day' },
        { value: 0, label: '0 (Accurate Map)' },
        { value: 1, label: '+1 Day' },
        { value: 2, label: '+2 Days' },
    ];

    const handleChange = (key, value) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        updateSettings(localSettings);
        
        // Check if map coordinates changed manually
        if (
            parseFloat(manualLat) !== location.lat ||
            parseFloat(manualLng) !== location.lng
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
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-auto sm:zoom-in-95">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
                            <Moon className="w-5 h-5 text-indigo-500" />
                            Ramadan Settings
                        </h2>
                        <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">Manage calculation methods and date offsets to match your local mosque.</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors dark:hover:bg-slate-800 dark:hover:text-slate-300"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-6">
                    
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Globe2 className="w-4 h-4 text-slate-400" />
                                Calculation Method (Region)
                            </span>
                            <Info className="w-4 h-4 text-slate-400 cursor-help" title="Determines Fajr and Isha angles based on your region." />
                        </label>
                        <select
                            value={localSettings.calcMethod}
                            onChange={(e) => handleChange('calcMethod', Number(e.target.value))}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                            {ALADHAN_METHODS.map(method => (
                                <option key={method.id} value={method.id}>{method.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Asr Madhab */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                            Asr Calculation (Madhab)
                            <Info className="w-4 h-4 text-slate-400 cursor-help" title="Standard is Shafi, Maliki, Hanbali. Hanafi applies later Asr times." />
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {MADHABS.map(madhab => (
                                <button
                                    key={madhab.id}
                                    onClick={() => handleChange('madhab', madhab.id)}
                                    className={clsx(
                                        "py-2.5 px-4 rounded-xl text-sm font-medium border transition-all text-left",
                                        localSettings.madhab === madhab.id
                                            ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-300"
                                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                                    )}
                                >
                                    {madhab.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Hijri Adjustment Slider */}
                    <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                            Hijri Date Adjustment
                            <Info className="w-4 h-4 text-slate-400 cursor-help" title="The Islamic calendar depends on local moonsighting. Use this to offset the date." />
                        </label>
                        
                        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                             <input 
                                type="range" 
                                min="-2" 
                                max="2" 
                                step="1"
                                value={localSettings.hijriOffset}
                                onChange={(e) => handleChange('hijriOffset', Number(e.target.value))}
                                className="w-full accent-indigo-500 mb-4"
                             />
                             <div className="flex justify-between text-xs font-bold text-slate-400">
                                {OFFSET_OPTIONS.map(opt => (
                                    <span 
                                        key={opt.value} 
                                        className={clsx(
                                            "transition-colors",
                                            localSettings.hijriOffset === opt.value && "text-indigo-600 dark:text-indigo-400 font-bold text-sm"
                                        )}
                                    >
                                        {opt.value > 0 ? `+${opt.value}` : opt.value}
                                    </span>
                                ))}
                             </div>
                        </div>
                        <div className="text-center mt-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
                            Current Offset: <span className="text-indigo-600 dark:text-indigo-400">{localSettings.hijriOffset > 0 ? `+${localSettings.hijriOffset}` : localSettings.hijriOffset} Days</span>
                        </div>
                    </div>

                    {/* Location Settings */}
                    <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-slate-400" />
                                Your Location
                                <Info className="w-4 h-4 text-slate-400 cursor-help ml-2" title="Accurate prayer times require an exact location." />
                            </label>
                            {location?.isDefault && (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded">Default Active</span>
                            )}
                        </div>

                        {showManualLocation ? (
                            <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                                <div className="flex gap-3">
                                    <div className="flex-1 space-y-1">
                                        <span className="text-[10px] font-semibold text-slate-400 uppercase ml-1">Latitude</span>
                                        <input 
                                            type="number" 
                                            value={manualLat}
                                            onChange={(e) => setManualLat(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            placeholder="e.g. 12.9716"
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <span className="text-[10px] font-semibold text-slate-400 uppercase ml-1">Longitude</span>
                                        <input 
                                            type="number" 
                                            value={manualLng}
                                            onChange={(e) => setManualLng(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                            placeholder="e.g. 77.5946"
                                        />
                                    </div>
                                </div>
                                <button 
                                    onClick={requestLocation}
                                    className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors shadow-sm"
                                >
                                    <Navigation className="w-4 h-4 text-indigo-500" />
                                    Auto-Detect using GPS
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                    <span className="truncate">{locationName}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={requestLocation}
                                        className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors shadow-sm"
                                    >
                                        <Navigation className="w-4 h-4 text-indigo-500" />
                                        Auto-Detect
                                    </button>
                                    <button 
                                        onClick={() => setShowManualLocation(true)}
                                        className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors shadow-sm"
                                    >
                                        Change Location
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-3xl">
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
