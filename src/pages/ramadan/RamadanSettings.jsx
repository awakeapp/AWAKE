import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Globe, MapPin, BookOpen, Calendar, ChevronRight, Check, Settings2
} from 'lucide-react';
import { usePrayer } from '../../context/PrayerContext';
import LocationModal from '../../components/ramadan/LocationModal';
import { motion } from 'framer-motion';
import PageLayout from '../../components/layout/PageLayout';
import clsx from 'clsx';

const SelectionCard = ({ icon: Icon, title, options, value, onChange, delay = 0 }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="bg-white dark:bg-[#1C1C1E] border border-slate-100 dark:border-white/5 rounded-[2.5rem] p-6 shadow-sm overflow-hidden"
        >
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-indigo-500/10 rounded-xl">
                    <Icon className="w-5 h-5 text-indigo-500" />
                </div>
                <h3 className="text-[17px] font-black uppercase tracking-tight text-slate-900 dark:text-white">{title}</h3>
            </div>

            <div className="grid grid-cols-2 xs:grid-cols-3 gap-2">
                {options.map((opt) => {
                    const isSelected = value === opt.id;
                    return (
                        <button
                            key={opt.id}
                            onClick={() => onChange(opt.id)}
                            className={clsx(
                                "relative px-3 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 border",
                                isSelected 
                                    ? "bg-indigo-600 text-white border-indigo-500 shadow-xl shadow-indigo-500/20" 
                                    : "bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-[#48484A] border-transparent hover:bg-slate-100 dark:hover:bg-white/10"
                            )}
                        >
                            {opt.name}
                            {isSelected && (
                                <motion.div 
                                    layoutId={`check-${title}`}
                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-[#1C1C1E]"
                                >
                                    <Check className="w-3 h-3 stroke-[4]" />
                                </motion.div>
                            )}
                        </button>
                    );
                })}
            </div>
        </motion.div>
    );
};

const RamadanSettings = () => {
    const navigate = useNavigate();
    const { calculationMethod, madhab, hijriOffset, updateSettings, displayName } = usePrayer();
    
    // Use local state only for the range, other things can be direct or handled with clear feedback
    const [localOffset, setLocalOffset] = useState(hijriOffset ?? 0);
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

    useEffect(() => {
        setLocalOffset(hijriOffset ?? 0);
    }, [hijriOffset]);

    const ALADHAN_METHODS = [
        { id: 'NorthAmerica', name: 'ISNA' },
        { id: 'Karachi', name: 'Karachi' },
        { id: 'MuslimWorldLeague', name: 'MWL' },
        { id: 'UmmAlQura', name: 'Umm Qura' },
        { id: 'Egyptian', name: 'Egyptian' },
        { id: 'Dubai', name: 'Dubai' },
        { id: 'Kuwait', name: 'Kuwait' },
        { id: 'Qatar', name: 'Qatar' },
        { id: 'Singapore', name: 'MUIS' },
        { id: 'Turkey', name: 'Turkey' },
    ];

    const MADHABS = [
        { id: 0, name: 'Standard' },
        { id: 1, name: 'Hanafi' },
    ];

    const handleSettingChange = (key, value) => {
        updateSettings({ [key]: value });
    };

    return (
        <PageLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tightest uppercase italic">Logic</h1>
                        <p className="text-[10px] font-black text-slate-400 dark:text-[#8E8E93] uppercase tracking-[0.2em] mt-0.5">Engine Configuration</p>
                    </div>
                </div>
            }
            showBack
            renderFloating={<LocationModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} />}
        >
            <div className="space-y-6 pb-12">
                
                <SelectionCard 
                    icon={Globe}
                    title="Engine Basis"
                    options={ALADHAN_METHODS}
                    value={calculationMethod}
                    onChange={(val) => handleSettingChange('method', val)}
                    delay={0.1}
                />

                <SelectionCard 
                    icon={BookOpen}
                    title="Madhab Selection"
                    options={MADHABS}
                    value={madhab}
                    onChange={(val) => handleSettingChange('madhab', val)}
                    delay={0.2}
                />

                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white dark:bg-[#1C1C1E] border border-slate-100 dark:border-white/5 rounded-[2.5rem] p-6 shadow-sm overflow-hidden"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                                <Calendar className="w-5 h-5 text-emerald-500" />
                            </div>
                            <h3 className="text-[17px] font-black uppercase tracking-tight text-slate-900 dark:text-white">Hijri Sync</h3>
                        </div>
                        <span className="px-4 py-2 bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-500/20">
                            {localOffset > 0 ? `+${localOffset}` : localOffset} DAYS
                        </span>
                    </div>

                    <input 
                        type="range" 
                        min="-2" max="2" step="1"
                        value={localOffset}
                        onChange={(e) => {
                            const val = Number(e.target.value);
                            setLocalOffset(val);
                            handleSettingChange('hijriOffset', val);
                        }}
                        className="w-full h-3 bg-slate-100 dark:bg-white/5 rounded-full appearance-none cursor-pointer accent-emerald-500 mb-4"
                    />
                    <div className="flex justify-between text-[11px] font-black text-slate-300 dark:text-[#48484A] px-1 uppercase tracking-widest">
                        <span>-2 Days</span>
                        <span>Official</span>
                        <span>+2 Days</span>
                    </div>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    onClick={() => setIsLocationModalOpen(true)}
                    className="group relative bg-[#1C1C1E] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden cursor-pointer"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[60px] -mr-16 -mt-16 group-hover:bg-indigo-500/20 transition-all duration-700" />
                    
                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform duration-500">
                                <MapPin className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-xs font-black text-[#8E8E93] uppercase tracking-[0.2em] leading-none">Primary Beacon</h3>
                                <p className="text-[18px] font-black text-white mt-1.5 tracking-tight group-hover:text-indigo-400 transition-colors">
                                    {displayName || 'Locating...'}
                                </p>
                            </div>
                        </div>
                        <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-[#48484A] group-hover:text-white transition-all">
                            <ChevronRight className="w-5 h-5" />
                        </div>
                    </div>
                </motion.div>

                <div className="pt-10 flex flex-col items-center gap-4 text-center">
                    <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center">
                        <Settings2 className="w-6 h-6 text-slate-300 dark:text-[#48484A]" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 dark:text-[#8E8E93] uppercase tracking-[0.3em]">Version 2.4.0-Cinematic</p>
                        <p className="text-[11px] font-bold text-slate-500 dark:text-[#48484A] mt-1 max-w-[220px] leading-relaxed">
                            Changes are applied instantly across your spiritual network.
                        </p>
                    </div>
                </div>

            </div>
        </PageLayout>
    );
};

export default RamadanSettings;
