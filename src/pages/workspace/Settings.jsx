import { useState } from 'react';
import { ChevronLeft, Lock, Trash2, Sliders, Bell, Layout } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BackButton from '../../components/atoms/BackButton';
import ThreeStateCheckbox from '../../components/atoms/ThreeStateCheckbox';
import { motion } from 'framer-motion';
import { useTasks } from '../../context/TaskContext';

const Settings = () => {
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
        <div className="space-y-6 pb-24">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <BackButton className="bg-transparent hover:bg-slate-100 dark:bg-transparent dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 -ml-2" />
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                    Settings
                </h1>
            </div>

            {/* Task Management Section */}
            <section className="space-y-4">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                    Task Management
                </h2>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">

                    {/* Setting Item */}
                    <div className="p-4 flex items-center justify-between border-b border-slate-50 dark:border-slate-800 last:border-0">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-lg">
                                <Trash2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Auto-delete completed</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Remove completed tasks after 24h</p>
                            </div>
                        </div>
                        <div
                            onClick={() => toggleSetting('autoDeleteCompleted')}
                            className={`w-11 h-6 rounded-full flex items-center px-0.5 cursor-pointer transition-colors ${settings.autoDeleteCompleted ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                        >
                            <motion.div
                                layout
                                className="w-5 h-5 bg-white rounded-full shadow-sm"
                                animate={{ x: settings.autoDeleteCompleted ? 20 : 0 }}
                            />
                        </div>
                    </div>

                    {/* Setting Item */}
                    <div className="p-4 flex items-center justify-between border-b border-slate-50 dark:border-slate-800 last:border-0">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-lg">
                                <Lock className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Confirm Deletion</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Show confirmation before deleting</p>
                            </div>
                        </div>
                        <div
                            onClick={() => toggleSetting('confirmDelete')}
                            className={`w-11 h-6 rounded-full flex items-center px-0.5 cursor-pointer transition-colors ${settings.confirmDelete ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                        >
                            <motion.div
                                layout
                                className="w-5 h-5 bg-white rounded-full shadow-sm"
                                animate={{ x: settings.confirmDelete ? 20 : 0 }}
                            />
                        </div>
                    </div>

                    {/* Setting Item */}
                    <div className="p-4 flex items-center justify-between border-b border-slate-50 dark:border-slate-800 last:border-0">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-lg">
                                <Layout className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Show Completed</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Keep completed tasks visible in list</p>
                            </div>
                        </div>
                        <div
                            onClick={() => toggleSetting('showCompletedInList')}
                            className={`w-11 h-6 rounded-full flex items-center px-0.5 cursor-pointer transition-colors ${settings.showCompletedInList ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                        >
                            <motion.div
                                layout
                                className="w-5 h-5 bg-white rounded-full shadow-sm"
                                animate={{ x: settings.showCompletedInList ? 20 : 0 }}
                            />
                        </div>
                    </div>

                </div>
            </section>

            {/* Defaults Section */}
            <section className="space-y-4">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                    Defaults
                </h2>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden divide-y divide-slate-50 dark:divide-slate-800">
                    <div className="p-4 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Default Priority</h3>
                        <select
                            value={settings.defaultPriority}
                            onChange={(e) => handleChange('defaultPriority', e.target.value)}
                            className="text-sm bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-3 py-1.5 focus:ring-0 text-slate-700 dark:text-slate-200"
                        >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                        </select>
                    </div>
                    <div className="p-4 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Default Duration</h3>
                        <select
                            value={settings.defaultDuration}
                            onChange={(e) => handleChange('defaultDuration', parseInt(e.target.value))}
                            className="text-sm bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-3 py-1.5 focus:ring-0 text-slate-700 dark:text-slate-200"
                        >
                            <option value={15}>15 min</option>
                            <option value={30}>30 min</option>
                            <option value={45}>45 min</option>
                            <option value={60}>1 hour</option>
                        </select>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Settings;
