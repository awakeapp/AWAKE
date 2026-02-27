import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Trash2, Lock, Layout, Sliders, ArrowLeft, ArrowUpDown, Clock
} from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import { SettingsList, SettingsSection, SettingsRow } from '../../components/ui/SettingsList';
import { AppToggle } from '../../components/ui/AppToggle';
import PageLayout from '../../components/layout/PageLayout';

const WorkspaceSettings = () => {
    const navigate = useNavigate();
    const { settings, updateSettings } = useTasks();

    const toggleSetting = (key) => {
        updateSettings({
            [key]: !settings[key]
        });
    };

    const handleChange = (key, value) => {
        updateSettings({ [key]: value });
    };

    return (
        <PageLayout
            header={
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                        <ArrowLeft className="w-6 h-6 text-slate-900 dark:text-white" />
                    </button>
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Workspace Settings</h1>
                </div>
            }
        >
            <SettingsList>
                    <SettingsSection title="Task Management">
                        <SettingsRow 
                            icon={Trash2}
                            title="Auto-delete completed"
                            subtitle="Remove completed tasks after 24h"
                            rightElement={
                                <AppToggle 
                                    checked={settings.autoDeleteCompleted}
                                    onChange={() => toggleSetting('autoDeleteCompleted')}
                                />
                            }
                        />
                        <SettingsRow 
                            icon={Lock}
                            title="Confirm Deletion"
                            subtitle="Show confirmation before deleting"
                            rightElement={
                                <AppToggle 
                                    checked={settings.confirmDelete}
                                    onChange={() => toggleSetting('confirmDelete')}
                                />
                            }
                        />
                        <SettingsRow 
                            icon={Layout}
                            title="Show Completed"
                            subtitle="Keep completed tasks visible in list"
                            isLast
                            rightElement={
                                <AppToggle 
                                    checked={settings.showCompletedInList}
                                    onChange={() => toggleSetting('showCompletedInList')}
                                />
                            }
                        />
                    </SettingsSection>

                    <SettingsSection title="Defaults">
                        <SettingsRow 
                            icon={ArrowUpDown}
                            title="Default Priority"
                            rightElement={
                                <select
                                    value={settings.defaultPriority}
                                    onChange={e => handleChange('defaultPriority', e.target.value)}
                                    className="appearance-none bg-slate-100 dark:bg-slate-800 text-[14px] font-semibold text-slate-700 dark:text-white px-3 py-1.5 rounded-lg outline-none cursor-pointer max-w-[120px]"
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                            }
                        />
                        <SettingsRow 
                            icon={Clock}
                            title="Default Duration"
                            isLast
                            rightElement={
                                <select
                                    value={settings.defaultDuration}
                                    onChange={e => handleChange('defaultDuration', parseInt(e.target.value))}
                                    className="appearance-none bg-slate-100 dark:bg-slate-800 text-[14px] font-semibold text-slate-700 dark:text-white px-3 py-1.5 rounded-lg outline-none cursor-pointer"
                                >
                                    <option value={15}>15 min</option>
                                    <option value={30}>30 min</option>
                                    <option value={45}>45 min</option>
                                    <option value={60}>1 hour</option>
                                </select>
                            }
                        />
                    </SettingsSection>

                    <p className="text-center text-[11px] text-slate-400 dark:text-slate-600 mt-8 font-bold tracking-widest uppercase">
                        AWAKE Workspace Scoped Settings
                    </p>
                </SettingsList>
        </PageLayout>
    );
};

export default WorkspaceSettings;
