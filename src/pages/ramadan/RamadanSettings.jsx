import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Globe, MapPin, BookOpen, Calendar, ChevronRight, ArrowLeft 
} from 'lucide-react';
import { usePrayer } from '../../context/PrayerContext';
import LocationModal from '../../components/ramadan/LocationModal';
import { SettingsList, SettingsSection, SettingsRow } from '../../components/ui/SettingsList';
import PageLayout from '../../components/layout/PageLayout';

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
        { id: 'NorthAmerica', name: 'ISNA' },
        { id: 'Karachi', name: 'Karachi' },
        { id: 'MuslimWorldLeague', name: 'MWL' },
        { id: 'UmmAlQura', name: 'Umm Al-Qura' },
        { id: 'Egyptian', name: 'Egyptian' },
        { id: 'Dubai', name: 'Dubai' },
        { id: 'Kuwait', name: 'Kuwait' },
        { id: 'Qatar', name: 'Qatar' },
        { id: 'Singapore', name: 'MUIS (SG)' },
        { id: 'Tehran', name: 'Tehran' },
        { id: 'Turkey', name: 'Turkey' },
        { id: 'Other', name: 'Other' },
    ];

    const MADHABS = [
        { id: 0, name: 'Standard' },
        { id: 1, name: 'Hanafi' },
    ];

    const handleChange = (key, value) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
        updateSettings({ [key]: value });
    };

    return (
        <PageLayout
            header={
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                        <ArrowLeft className="w-6 h-6 text-slate-900 dark:text-white" />
                    </button>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Ramadan Settings</h1>
                </div>
            }
            renderFloating={<LocationModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} />}
        >
            <SettingsList>
                    <SettingsSection title="Calculation">
                        <SettingsRow 
                            icon={Globe} 
                            title="Calculation Method" 
                            rightElement={
                                <select
                                    value={localSettings.method || ''}
                                    onChange={(e) => handleChange('method', e.target.value)}
                                    className="appearance-none bg-slate-100 dark:bg-slate-800 text-[14px] font-semibold text-slate-700 dark:text-white px-3 py-1.5 rounded-lg outline-none cursor-pointer max-w-[140px]"
                                >
                                    {ALADHAN_METHODS.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            }
                        />
                        <SettingsRow 
                            icon={BookOpen} 
                            title="Asr Madhab" 
                            isLast
                            rightElement={
                                <select
                                    value={localSettings.madhab ?? ''}
                                    onChange={(e) => handleChange('madhab', Number(e.target.value))}
                                    className="appearance-none bg-slate-100 dark:bg-slate-800 text-[14px] font-semibold text-slate-700 dark:text-white px-3 py-1.5 rounded-lg outline-none cursor-pointer max-w-[140px]"
                                >
                                    {MADHABS.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            }
                        />
                    </SettingsSection>

                    <SettingsSection title="Location">
                        <SettingsRow 
                            icon={MapPin} 
                            title="Prayer Location" 
                            subtitle={displayName || 'Select primary location'}
                            onClick={() => setIsLocationModalOpen(true)}
                            isLast
                        />
                    </SettingsSection>

                    <SettingsSection title="Hijri Adjustment">
                        <div className="px-5 py-6">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[14px] text-slate-500 dark:text-slate-400 font-medium">Offset Day</span>
                                <span className="text-[16px] font-bold text-primary-600 dark:text-primary-400">
                                    {localSettings.hijriOffset > 0 ? `+${localSettings.hijriOffset}` : localSettings.hijriOffset} Days
                                </span>
                            </div>
                            <input 
                                type="range" 
                                min="-2" max="2" step="1"
                                value={localSettings.hijriOffset}
                                onChange={(e) => handleChange('hijriOffset', Number(e.target.value))}
                                className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-primary-600"
                            />
                            <div className="flex justify-between text-[11px] font-bold text-slate-400 mt-3 px-1">
                                <span>-2</span>
                                <span>-1</span>
                                <span>0</span>
                                <span>+1</span>
                                <span>+2</span>
                            </div>
                        </div>
                    </SettingsSection>
                </SettingsList>
        </PageLayout>
    );
};

export default RamadanSettings;
