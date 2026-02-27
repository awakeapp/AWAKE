import React, { useState, useRef, useEffect } from 'react';
import { usePrayer } from '../../context/PrayerContext';
import { MapPin, Navigation, Search, X, Loader2, Check, Compass } from 'lucide-react';
import { useScrollLock } from '../../hooks/useScrollLock';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

const LocationModal = ({ isOpen, onClose }) => {
    useScrollLock(isOpen);
    const { requestLocation, updateManualLocation, displayName, searchLocation } = usePrayer();
    
    const [detecting, setDetecting] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');
    
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchTimerRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setError(null);
            setSuccessMsg('');
            setSearchQuery('');
            setSearchResults([]);
            setTimeout(() => inputRef.current?.focus(), 400);
        }
    }, [isOpen]);

    const handleDetect = async () => {
        setDetecting(true);
        setError(null);
        setSuccessMsg('');
        try {
            const loc = await requestLocation();
            if (loc?.isFallback) {
                setError("Connection timeout. Signal lost.");
            } else {
                setSuccessMsg('Coordinates Locked');
                setTimeout(() => onClose(), 1000);
            }
        } catch (err) {
            setError("Logic error. Beacon failed.");
        } finally {
            setDetecting(false);
        }
    };

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
        }, 500);
    };

    const performSearch = async (query) => {
        setIsSearching(true);
        try {
            const data = await searchLocation(query);
            setSearchResults(data);
        } catch (err) {
            setError('Search failed. Check network link.');
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectResult = (result) => {
        updateManualLocation(result.lat, result.lng);
        setSuccessMsg(`Nexus set to ${result.city || 'Position'}`);
        setTimeout(() => onClose(), 800);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-xl" 
                        onClick={onClose}
                    />
                    
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-[440px] max-h-[85vh] bg-white dark:bg-[#1C1C1E] rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-2xl flex flex-col overflow-hidden"
                    >
                        <div className="flex items-center justify-between p-8 pb-4 shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                    <Compass className="w-6 h-6 text-indigo-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tightest italic">Qibla Nexus</h2>
                                    <p className="text-[10px] font-black text-slate-400 dark:text-[#8E8E93] uppercase tracking-[0.2em] mt-0.5">Global Sync</p>
                                </div>
                            </div>
                            <button 
                                onClick={onClose}
                                className="w-10 h-10 flex items-center justify-center bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-[#8E8E93] rounded-full active:scale-90 transition-all border border-transparent dark:border-white/5"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 pt-4 space-y-6">
                            <AnimatePresence mode="wait">
                                {error && (
                                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-black uppercase tracking-tight rounded-2xl border border-rose-100 dark:border-rose-950/30">
                                        {error}
                                    </motion.div>
                                )}
                                {successMsg && (
                                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-emerald-500/10 text-emerald-400 text-xs font-black uppercase tracking-widest rounded-2xl border border-emerald-500/20 flex items-center gap-3">
                                        <Check className="w-4 h-4 shrink-0" /> {successMsg}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="relative group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 dark:text-[#48484A] group-focus-within:text-indigo-500 transition-colors" />
                                <input 
                                    ref={inputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    placeholder="Sector scan (City, Country)..."
                                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-slate-900 dark:text-white pl-14 pr-12 py-5 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all text-sm font-bold placeholder:text-slate-300 dark:placeholder:text-[#48484A]"
                                />
                                {isSearching && (
                                    <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400 animate-spin" />
                                )}
                            </div>

                            <button 
                                onClick={handleDetect}
                                disabled={detecting}
                                className="w-full group relative flex items-center justify-center gap-3 bg-indigo-600 dark:bg-white text-white dark:text-black py-5 px-4 rounded-[2rem] transition-all shadow-xl shadow-indigo-500/20 active:scale-[0.98] disabled:opacity-50"
                            >
                                {detecting ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" /> Scanning Sky...</>
                                ) : (
                                    <><Navigation className="w-5 h-5 group-hover:rotate-45 transition-transform" /> Auto-Detect Coordinates</>
                                )}
                            </button>

                            <div className="space-y-4">
                                <AnimatePresence>
                                    {searchResults.length > 0 && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-3"
                                        >
                                            <p className="text-[10px] font-black text-slate-400 dark:text-[#48484A] uppercase tracking-[0.3em] px-2">Identified Hubs</p>
                                            <div className="space-y-2">
                                                {searchResults.map((result, idx) => (
                                                    <button
                                                        key={`${result.lat}-${idx}`}
                                                        onClick={() => handleSelectResult(result)}
                                                        className="w-full text-left px-6 py-5 bg-slate-50 dark:bg-white/5 hover:bg-white/10 dark:hover:bg-white/10 active:scale-[0.99] transition-all rounded-[2rem] flex items-center gap-4 group/item"
                                                    >
                                                        <div className="w-10 h-10 rounded-xl bg-white/10 dark:bg-white/5 flex items-center justify-center shrink-0 group-hover/item:bg-indigo-500 group-hover/item:text-white transition-all">
                                                            <MapPin className="w-5 h-5" />
                                                        </div>
                                                        <div className="min-w-0 pr-4">
                                                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">
                                                                {result.city || result.displayName.split(',')[0]}
                                                            </p>
                                                            <p className="text-[10px] font-bold text-slate-400 dark:text-[#48484A] mt-1 uppercase tracking-widest truncate">
                                                                {result.displayName}
                                                            </p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="text-center pt-8">
                                <p className="text-[10px] font-black text-slate-300 dark:text-[#48484A] uppercase tracking-[0.2em] leading-relaxed">
                                    Privacy Shield Active • End-to-End Celestial Sync
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};


export default LocationModal;
