import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe2, Save, MapPin, BookOpen, Calendar, ChevronRight, HelpCircle, UserPlus, FileText } from 'lucide-react';
import clsx from 'clsx';
import { usePrayer } from '../../context/PrayerContext';
import LocationModal from '../../components/ramadan/LocationModal';

// Shared Group Component matching the "premium" grouped layout
const SettingsGroup = ({ children, className }) => (
    <div className={clsx("mb-5", className)}>
        <div className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden shadow-sm border border-slate-200/50 dark:border-none">
            {children}
        </div>
    </div>
);

// Shared Row Component matching the requested layout
const SettingsRow = ({ icon: Icon, iconBgClass, title, subtitle, right, rightElement, onClick, className, isLast }) => (
    <div 
        onClick={onClick}
        className={clsx(
            "flex items-center min-h-[52px] active:bg-slate-50 dark:active:bg-[#2C2C2E] transition-colors duration-200 cursor-pointer",
            !isLast && "ml-12 border-b border-slate-100 dark:border-[#2C2C2E]",
            className
        )}
    >
        <div className={clsx("flex items-center py-3 flex-1 min-w-0 pr-4", !isLast ? "" : "ml-4")}>
            {Icon && (
                <div className={clsx("w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/50", !isLast ? "-ml-8 mr-4" : "mr-4")}>
                    <Icon strokeWidth={2.5} className="w-5 h-5" />
                </div>
            )}
            <div className="flex-1 min-w-0 flex items-center justify-between">
                <div className="flex flex-col min-w-0">
                    <p className="text-[16px] xl:text-[17px] font-medium text-slate-900 dark:text-white leading-tight truncate">{title}</p>
                    {subtitle && <p className="text-[13px] text-slate-500 dark:text-[#8E8E93] mt-1 truncate">{subtitle}</p>}
                </div>
                
                {rightElement || right ? (
                    <div className="shrink-0 ml-2 flex items-center">
                        {rightElement || right}
                    </div>
                ) : (
                    <ChevronRight className="w-5 h-5 text-slate-300 dark:text-[#5C5C5E] ml-2 shrink-0" />
                )}
            </div>
        </div>
    </div>
);

const RamadanSettings = () => {
    const navigate = useNavigate();
    const { calculationMethod, madhab, hijriOffset, updateSettings, displayName } = usePrayer();
    
    const [localSettings, setLocalSettings] = useState({ 
        method: calculationMethod, 
        madhab: madhab,
        hijriOffset: hijriOffset ?? 0
    });
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

    useEffect(() => {
        setLocalSettings({ method: calculationMethod, madhab: madhab, hijriOffset: hijriOffset ?? 0 });
    }, [calculationMethod, madhab, hijriOffset]);

    const ALADHAN_METHODS = [
        { id: 2, name: 'ISNA' },
        { id: 1, name: 'Karachi' },
        { id: 3, name: 'MWL' },
        { id: 4, name: 'Umm Al-Qura' },
        { id: 5, name: 'Egyptian' },
        { id: 8, name: 'Gulf Region' },
        { id: 11, name: 'MUIS (SG)' },
        { id: 17, name: 'JAKIM (MY)' },
        { id: 20, name: 'Kemenag (ID)' },
    ];

    const MADHABS = [
        { id: 0, name: 'Standard' },
        { id: 1, name: 'Hanafi' },
    ];

    const handleChange = (key, value) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
        updateSettings({ [key]: value });
    };

    const handleSave = async () => {
        // Add a small haptic feedback/delay for premium feel
        setTimeout(() => navigate(-1), 100);
    };

    return (
        <div className="pb-12 pt-4 bg-[#F2F2F7] dark:bg-black min-h-screen text-slate-900 dark:text-white font-sans selection:bg-indigo-500/30">
            <LocationModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} />
            <div className="max-w-screen-md mx-auto px-4">
                
                {/* Header */}
                <div className="flex items-center gap-4 mb-4 mt-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-1 -ml-1 text-slate-900 dark:text-white hover:opacity-70 transition-opacity"
                    >
                        <ArrowLeft className="w-7 h-7" />
                    </button>
                    <h1 className="text-[32px] font-bold tracking-tight text-slate-900 dark:text-white">Settings</h1>
                </div>

                <div className="mt-8">
                    
                    {/* General Group */}
                    <SettingsGroup>
                            <SettingsRow 
                                icon={Globe2} 
                                title="Calculation Method" 
                                right={
                                    <div className="flex items-center bg-slate-100 dark:bg-[#2C2C2E] rounded-lg relative">
                                        <select
                                            value={localSettings.method || ''}
                                            onChange={(e) => handleChange('method', Number(e.target.value))}
                                            className="bg-transparent text-[13px] sm:text-[15px] text-slate-600 dark:text-[#8E8E93] font-medium appearance-none outline-none py-1.5 pl-3 pr-8 cursor-pointer relative z-10"
                                        >
                                            {ALADHAN_METHODS.map(m => (
                                                <option key={m.id} value={m.id} className="text-black bg-white dark:bg-slate-800">{m.name}</option>
                                            ))}
                                        </select>
                                        <ChevronRight className="w-4 h-4 text-slate-400 dark:text-[#5C5C5E] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none z-0" />
                                    </div>
                                }
                            />
                        
                            <SettingsRow 
                                icon={BookOpen} 
                                title="Asr Madhab" 
                                isLast={true}
                                right={
                                    <div className="flex items-center bg-slate-100 dark:bg-[#2C2C2E] rounded-lg relative">
                                        <select
                                            value={localSettings.madhab ?? ''}
                                            onChange={(e) => handleChange('madhab', Number(e.target.value))}
                                            className="bg-transparent text-[13px] sm:text-[15px] text-slate-600 dark:text-[#8E8E93] font-medium appearance-none outline-none py-1.5 pl-3 pr-8 cursor-pointer relative z-10"
                                        >
                                            {MADHABS.map(m => (
                                                <option key={m.id} value={m.id} className="text-black bg-white dark:bg-slate-800">{m.name}</option>
                                            ))}
                                        </select>
                                        <ChevronRight className="w-4 h-4 text-slate-400 dark:text-[#5C5C5E] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none z-0" />
                                    </div>
                                }
                            />
                    </SettingsGroup>

                    {/* Location Group */}
                    <SettingsGroup>
                        <SettingsRow 
                            icon={MapPin} 
                            title="Prayer Location" 
                            subtitle={displayName || 'Select primary location'}
                            onClick={() => setIsLocationModalOpen(true)}
                            isLast={true}
                        />
                    </SettingsGroup>

                    {/* Hijri Adjustment Group */}
                    <SettingsGroup>
                        <div className="p-4 bg-white dark:bg-[#1C1C1E]">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/50">
                                    <Calendar strokeWidth={2.5} className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[16px] font-medium text-slate-900 dark:text-white">Hijri Date Adjustment</p>
                                    <p className="text-[13px] text-slate-500 dark:text-[#8E8E93] mt-0.5">
                                        Offset: <span className="font-semibold text-emerald-500 dark:text-emerald-400">
                                            {localSettings.hijriOffset > 0 ? `+${localSettings.hijriOffset}` : localSettings.hijriOffset} days
                                        </span>
                                    </p>
                                </div>
                            </div>
                            <div className="px-2 pb-1">
                                <input 
                                    type="range" 
                                    min="-2" max="2" step="1"
                                    value={localSettings.hijriOffset}
                                    onChange={(e) => handleChange('hijriOffset', Number(e.target.value))}
                                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                                <div className="flex justify-between text-[11px] font-bold text-[#48484A] mt-2">
                                    {['-2', '-1', '0', '+1', '+2'].map(v => <span key={v}>{v}</span>)}
                                </div>
                            </div>
                        </div>
                    </SettingsGroup>



                </div>

                {/* Build Info Footer */}
                <div className="mt-8 mb-12 flex flex-col items-center gap-6">
                    <button
                        onClick={handleSave}
                        className="w-full max-w-xs py-4 px-6 bg-indigo-600 dark:bg-white text-white dark:text-black active:bg-indigo-700 dark:active:bg-slate-200 rounded-2xl font-bold transition-all shadow-lg active:scale-[0.97]"
                    >
                        Done
                    </button>
                    
                    <div className="text-center space-y-1">
                        <p className="text-[11px] font-bold text-[#48484A] tracking-wider uppercase">
                            HUMI AWAKE v1.2.0 • Build ID: {Math.random().toString(36).substr(2, 5).toUpperCase()}
                        </p>
                        <p className="text-[10px] text-[#48484A]">
                            Calculation updates trigger immediately
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default RamadanSettings;
