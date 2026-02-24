import React, { useState, useRef, useEffect, useCallback } from 'react';
import { usePrayer } from '../../context/PrayerContext';
import { MapPin, Navigation, Search, X, Loader2, Check } from 'lucide-react';
import { useScrollLock } from '../../hooks/useScrollLock';

const LocationModal = ({ isOpen, onClose }) => {
    useScrollLock(isOpen);
    const { requestLocation, updateManualLocation, displayName, searchLocation } = usePrayer();
    
    const [detecting, setDetecting] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');
    
    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchTimerRef = useRef(null);
    const inputRef = useRef(null);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setError(null);
            setSuccessMsg('');
            setSearchQuery('');
            setSearchResults([]);
            // Auto-focus search input on open
            setTimeout(() => inputRef.current?.focus(), 200);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // --- GPS Auto-Detect ---
    const handleDetect = async () => {
        setDetecting(true);
        setError(null);
        setSuccessMsg('');
        try {
            const loc = await requestLocation();
            if (loc?.isFallback) {
                setError("Could not detect location. GPS may be denied. Check browser settings or search below.");
            } else {
                setSuccessMsg('Location detected successfully!');
                setTimeout(() => onClose(), 800);
            }
        } catch (err) {
            setError("Location detection failed. Please search for your city below.");
        } finally {
            setDetecting(false);
        }
    };

    // --- Nominatim Search ---
    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        setError(null);
        
        // Clear previous timer
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        
        if (query.trim().length < 3) {
            setSearchResults([]);
            return;
        }

        // Debounce search by 400ms
        searchTimerRef.current = setTimeout(() => {
            performSearch(query.trim());
        }, 400);
    };

    const performSearch = async (query) => {
        setIsSearching(true);
        try {
            const data = await searchLocation(query);
            setSearchResults(data);
        } catch (err) {
            console.error('Location search error:', err);
            setError('Search failed. Please check your connection.');
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    // --- Select a Search Result ---
    const handleSelectResult = (result) => {
        updateManualLocation(result.lat, result.lng);
        setSuccessMsg(`Set to ${result.displayName}`);
        setSearchQuery('');
        setSearchResults([]);
        setTimeout(() => onClose(), 600);
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
                onClick={onClose}
            />
            
            {/* Modal — with bottom safe area and max height */}
            <div className="relative w-full sm:w-[420px] max-h-[85vh] bg-white dark:bg-[#1C1C1E] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden mb-0 sm:mb-0" style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}>
                
                {/* Header */}
                <div className="flex items-center justify-between p-5 pb-4 border-b border-slate-100 dark:border-[#2C2C2E] shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 rounded-xl">
                            <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Prayer Location</h2>
                            {displayName && displayName !== 'Location...' && (
                                <p className="text-[12px] text-slate-500 dark:text-[#8E8E93] mt-0.5 truncate max-w-[200px]">
                                    Current: {displayName}
                                </p>
                            )}
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#2C2C2E] rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-5" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 16px) + 16px)' }}>
                    
                    {/* Status Messages */}
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 text-sm font-medium rounded-xl border border-red-100 dark:border-red-500/20">
                            {error}
                        </div>
                    )}
                    {successMsg && (
                        <div className="p-3 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 text-sm font-medium rounded-xl border border-emerald-100 dark:border-emerald-500/20 flex items-center gap-2">
                            <Check className="w-4 h-4 shrink-0" /> {successMsg}
                        </div>
                    )}

                    {/* GPS Auto-Detect */}
                    <button 
                        onClick={handleDetect}
                        disabled={detecting}
                        className="w-full flex items-center justify-center gap-2.5 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3.5 px-4 rounded-xl transition-colors shadow-sm"
                    >
                        {detecting ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Detecting Location...</>
                        ) : (
                            <><Navigation className="w-5 h-5" /> Auto-Detect via GPS</>
                        )}
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-px bg-slate-200 dark:bg-[#2C2C2E]"></div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Or Search</span>
                        <div className="flex-1 h-px bg-slate-200 dark:bg-[#2C2C2E]"></div>
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
                        <input 
                            ref={inputRef}
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            placeholder="Search city, area, or place..."
                            className="w-full bg-slate-50 dark:bg-[#2C2C2E] border border-slate-200 dark:border-[#38383A] text-slate-900 dark:text-white pl-10 pr-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow text-[15px] font-medium placeholder:text-slate-400"
                        />
                        {isSearching && (
                            <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 animate-spin" />
                        )}
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div className="bg-slate-50 dark:bg-[#2C2C2E] rounded-xl border border-slate-200 dark:border-[#38383A] overflow-hidden divide-y divide-slate-200 dark:divide-[#38383A]">
                            {searchResults.map((result, idx) => (
                                <button
                                    key={`${result.lat}-${result.lng}-${idx}`}
                                    onClick={() => handleSelectResult(result)}
                                    className="w-full text-left px-4 py-3.5 hover:bg-slate-100 dark:hover:bg-[#38383A] active:bg-slate-200 dark:active:bg-[#48484A] transition-colors flex items-start gap-3"
                                >
                                    <MapPin className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[14px] font-semibold text-slate-800 dark:text-white leading-tight truncate">
                                            {result.area || result.city || result.displayName.split(',')[0]}
                                        </p>
                                        <p className="text-[12px] text-slate-500 dark:text-[#8E8E93] mt-0.5 truncate">
                                            {result.displayName}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* No Results */}
                    {searchQuery.length >= 3 && !isSearching && searchResults.length === 0 && (
                        <p className="text-center text-sm text-slate-400 dark:text-[#8E8E93] py-2">
                            No locations found. Try a different search.
                        </p>
                    )}

                    {/* Hint */}
                    <p className="text-center text-[11px] text-slate-400 dark:text-[#8E8E93] leading-relaxed">
                        Search for your city or area to set accurate prayer times. Powered by OpenStreetMap.
                    </p>

                </div>
            </div>
        </div>
    );
};

export default LocationModal;
