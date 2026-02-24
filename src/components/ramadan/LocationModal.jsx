import React, { useState } from 'react';
import { usePrayer } from '../../context/PrayerContext';
import { MapPin, Navigation, Save, X, Loader2 } from 'lucide-react';
import clsx from 'clsx';

const LocationModal = ({ isOpen, onClose }) => {
    const { requestLocation, updateManualLocation, loading, location } = usePrayer();
    const [manualLat, setManualLat] = useState(location?.lat || '');
    const [manualLng, setManualLng] = useState(location?.lng || '');
    const [detecting, setDetecting] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleDetect = async () => {
        setDetecting(true);
        setError(null);
        try {
            const loc = await requestLocation();
            if (loc?.isFallback) {
                setError("Could not detect location. Note: GPS permission may be denied. Please check browser settings or enter manually.");
            } else {
                onClose();
            }
        } catch (err) {
            setError("Failed to auto-detect location. Please ensure location services are enabled or enter manual coordinates.");
        } finally {
            setDetecting(false);
        }
    };

    const handleSaveManual = () => {
        const parsedLat = parseFloat(manualLat);
        const parsedLng = parseFloat(manualLng);
        
        if (isNaN(parsedLat) || isNaN(parsedLng) || parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
            setError("Please enter valid coordinates (-90 to 90 for Latitude, -180 to 180 for Longitude).");
            return;
        }

        updateManualLocation(parsedLat, parsedLng);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="relative w-full sm:w-[400px] bg-white dark:bg-[#1C1C1E] rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-5">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-[#2C2C2E]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 rounded-xl">
                            <MapPin className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Location Settings</h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#2C2C2E] rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-6">
                    
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 text-sm font-medium rounded-xl border border-red-100 dark:border-red-500/20">
                            {error}
                        </div>
                    )}

                    {/* Auto Detect Button */}
                    <div>
                        <button 
                            onClick={handleDetect}
                            disabled={detecting || loading}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3.5 px-4 rounded-xl transition-colors shadow-sm"
                        >
                            {detecting ? (
                                <><Loader2 className="w-5 h-5 animate-spin"/> Locating...</>
                            ) : (
                                <><Navigation className="w-5 h-5" /> Auto-Detect via GPS</>
                            )}
                        </button>
                        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-2">
                            Uses your device's GPS to find the most accurate prayer times.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-slate-200 dark:bg-[#2C2C2E]"></div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Or Entry Manually</span>
                        <div className="flex-1 h-px bg-slate-200 dark:bg-[#2C2C2E]"></div>
                    </div>

                    {/* Manual Entry */}
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <div className="flex-1 space-y-1">
                                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 ml-1">Latitude</label>
                                <input 
                                    type="number" 
                                    step="any"
                                    value={manualLat}
                                    onChange={(e) => setManualLat(e.target.value)}
                                    placeholder="e.g. 12.9716"
                                    className="w-full bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-[#38383A] text-slate-900 dark:text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow text-[15px] font-medium placeholder:text-slate-400"
                                />
                            </div>
                            <div className="flex-1 space-y-1">
                                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 ml-1">Longitude</label>
                                <input 
                                    type="number" 
                                    step="any"
                                    value={manualLng}
                                    onChange={(e) => setManualLng(e.target.value)}
                                    placeholder="e.g. 77.5946"
                                    className="w-full bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-[#38383A] text-slate-900 dark:text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow text-[15px] font-medium placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        <button 
                            onClick={handleSaveManual}
                            disabled={!manualLat || !manualLng}
                            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white font-bold py-3.5 px-4 rounded-xl transition-colors disabled:opacity-50"
                        >
                            <Save className="w-5 h-5" /> Save Manual Location
                        </button>
                    </div>

                </div>
                
                {/* Safe Area Padding for mobile */}
                <div className="h-6 sm:hidden bg-white dark:bg-[#1C1C1E]"></div>
            </div>
        </div>
    );
};

export default LocationModal;
