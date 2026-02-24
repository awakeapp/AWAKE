import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe2, Save, MapPin, BookOpen, Calendar, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { usePrayer } from '../../context/PrayerContext';
import LocationModal from '../../components/ramadan/LocationModal';

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
        navigate(-1);
    };

    return (
        <div className="pb-12 pt-2 sm:pt-4 bg-[#F2F2F7] dark:bg-black min-h-screen text-black dark:text-white font-sans">
            <LocationModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} />
            
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
                                            {ALADHAN_METHODS.find(m => m.id === localSettings.method)?.name || 'Select'}
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-[#5C5C5E] shrink-0" />
                                    </div>
                                }
                            />
                            <select
                                value={localSettings.method || ''}
                                onChange={(e) => handleChange('method', Number(e.target.value))}
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
                                value={localSettings.madhab ?? ''}
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
                            <p className="text-[11px] text-slate-400 dark:text-[#8E8E93] mt-3 px-2 leading-relaxed">
                                India follows moon sighting. If Ramadan dates appear incorrect, adjust by +1 or -1 day.
                            </p>
                        </div>
                    </SettingsGroup>

                    {/* Location Group */}
                    <SettingsGroup>
                        <SettingsRow 
                            icon={MapPin} 
                            iconBgClass="bg-red-500"
                            title="Prayer Location" 
                            subtitle={displayName || 'Location not set'}
                            onClick={() => setIsLocationModalOpen(true)}
                            isLast={true}
                        />
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
