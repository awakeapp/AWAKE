import React, { useState, useRef, useEffect } from 'react';
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
            setTimeout(() => inputRef.current?.focus(), 300);
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
                setError("Could not detect location. GPS may be denied.");
            } else {
                setSuccessMsg('Location detected!');
                setTimeout(() => onClose(), 800);
            }
        } catch (err) {
            setError("Location detection failed.");
        } finally {
            setDetecting(false);
        }
    };

    // --- Nominatim Search ---
    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        setError(null);
        
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        
        if (query.trim().length < 3) {
            setSearchResults([]);
            return;
        }

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
            setError('Search failed. Check connection.');
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectResult = (result) => {
        updateManualLocation(result.lat, result.lng);
        setSuccessMsg(`Set to ${result.city || 'Location'}`);
        setTimeout(() => onClose(), 600);
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-0 transition-all duration-300">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-md" 
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="relative w-full sm:w-[440px] max-h-[90vh] bg-black sm:bg-[#1C1C1E] rounded-t-[32px] sm:rounded-3xl border-t border-white/10 sm:border border-white/5 shadow-2xl flex flex-col overflow-hidden" style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}>
                
                {/* Grab Handle for Mobile */}
                <div className="sm:hidden flex justify-center py-2.5">
                    <div className="w-10 h-1 bg-white/20 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-4 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                            <MapPin className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Select Location</h2>
                            <p className="text-[13px] text-[#8E8E93] mt-0.5 font-medium truncate max-w-[200px]">
                                {displayName && displayName !== 'Location...' ? displayName : 'Search for your city'}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center bg-[#2C2C2E] text-[#8E8E93] rounded-full active:scale-90 transition-transform"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    
                    {/* Status Messages */}
                    {error && (
                        <div className="p-4 bg-red-500/10 text-red-400 text-[14px] font-semibold rounded-2xl border border-red-500/20">
                            {error}
                        </div>
                    )}
                    {successMsg && (
                        <div className="p-4 bg-emerald-500/10 text-emerald-400 text-[14px] font-semibold rounded-2xl border border-emerald-500/20 flex items-center gap-2.5">
                            <Check className="w-5 h-5 shrink-0" /> {successMsg}
                        </div>
                    )}

                    {/* Search Bar */}
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8E8E93] group-focus-within:text-white transition-colors" />
                        <input 
                            ref={inputRef}
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            placeholder="City, state, or country..."
                            className="w-full bg-[#1C1C1E] sm:bg-[#2C2C2E] border border-white/5 text-white pl-12 pr-12 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-[16px] font-medium placeholder:text-[#48484A]"
                        />
                        {isSearching && (
                            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400 animate-spin" />
                        )}
                    </div>

                    {/* GPS Button */}
                    {!searchQuery && (
                        <button 
                            onClick={handleDetect}
                            disabled={detecting}
                            className="w-full flex items-center justify-center gap-3 bg-white text-black active:bg-slate-200 disabled:opacity-50 font-bold py-4 px-4 rounded-2xl transition-all shadow-lg active:scale-[0.98]"
                        >
                            {detecting ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Detecting...</>
                            ) : (
                                <><Navigation className="w-5 h-5" /> Use Current Location</>
                            )}
                        </button>
                    )}

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-[11px] font-bold text-[#48484A] uppercase tracking-widest px-1">Results</p>
                            <div className="bg-[#1C1C1E] sm:bg-[#2C2C2E] rounded-2xl border border-white/5 overflow-hidden">
                                {searchResults.map((result, idx) => (
                                    <button
                                        key={`${result.lat}-${idx}`}
                                        onClick={() => handleSelectResult(result)}
                                        className="w-full text-left px-5 py-4 hover:bg-white/5 active:bg-white/10 transition-colors flex items-start gap-4 border-b border-white/5 last:border-0"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                            <MapPin className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[15px] font-bold text-white leading-tight truncate">
                                                {result.city || result.displayName.split(',')[0]}
                                            </p>
                                            <p className="text-[13px] text-[#8E8E93] mt-1 truncate">
                                                {result.displayName}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Footer Hint */}
                    <div className="text-center pt-2">
                        <p className="text-[11px] text-[#48484A] font-medium leading-relaxed">
                            Accurate timings require your city location.<br/>
                            We never store your exact GPS coordinates.
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default LocationModal;
