import { X, Check, Trash2, Settings, SlidersHorizontal, AlertTriangle, LayoutList, ListTodo, Calendar, Layout, Clock, ChevronRight, ArrowLeft } from 'lucide-react';
import { useTasks } from '../../../context/TaskContext';
import { AppButton } from '@/components/ui/AppButton';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TaskSettingsModal = ({ isOpen, onClose }) => {
    const { settings, updateSettings, clearAllTasks } = useTasks();
    const [view, setView] = useState('main'); // 'main' | 'settings'
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleClose = () => {
        setView('main');
        onClose();
    };

    const handleToggle = (key) => {
        updateSettings({ [key]: !settings[key] });
    };

    const handleChange = (key, value) => {
        updateSettings({ [key]: value });
    };

    const handleClearTasks = async () => {
        if (window.confirm("Are you sure you want to permanently delete ALL tasks? This action cannot be undone.")) {
            setIsClearing(true);
            try {
                await clearAllTasks();
                onClose();
            } catch (error) {
                console.error("Failed to clear tasks", error);
                alert("Failed to clear tasks.");
            } finally {
                setIsClearing(false);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={handleClose} />
            
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t sm:rounded-3xl shadow-md relative z-10 overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 sm:zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
                <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                        {view === 'settings' ? (
                            <button onClick={() => setView('main')} className="p-1 -ml-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors mr-1 cursor-pointer">
                                <ArrowLeft className="w-5 h-5 text-slate-500" />
                            </button>
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                <SlidersHorizontal className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                            </div>
                        )}
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            {view === 'settings' ? 'Task Settings' : 'More Options'}
                        </h2>
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <div className="p-0 overflow-y-auto space-y-6 flex-1 py-4">
                    
                    {view === 'main' ? (
                        <div className="px-4 space-y-2">
                            <button onClick={() => { navigate('/workspace/filter/all'); handleClose(); }} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded flex items-center justify-between border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm">
                                <div className="flex items-center gap-3">
                                    <ListTodo className="w-5 h-5 text-indigo-500" />
                                    <span className="font-bold text-slate-700 dark:text-slate-200">Active Tasks</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-300" />
                            </button>
                            
                            <button onClick={() => { navigate('/workspace/calendar'); handleClose(); }} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded flex items-center justify-between border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm">
                                <div className="flex items-center gap-3">
                                    <Calendar className="w-5 h-5 text-blue-500" />
                                    <span className="font-bold text-slate-700 dark:text-slate-200">Calendar View</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-300" />
                            </button>
                            
                            <button onClick={() => { navigate('/workspace/overview'); handleClose(); }} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded flex items-center justify-between border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm">
                                <div className="flex items-center gap-3">
                                    <Layout className="w-5 h-5 text-purple-500" />
                                    <span className="font-bold text-slate-700 dark:text-slate-200">Weekly Overview</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-300" />
                            </button>
                            
                            <button onClick={() => { navigate('/workspace/recent'); handleClose(); }} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded flex items-center justify-between border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm">
                                <div className="flex items-center gap-3">
                                    <Clock className="w-5 h-5 text-emerald-500" />
                                    <span className="font-bold text-slate-700 dark:text-slate-200">Recent Tasks</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-300" />
                            </button>

                            <div className="h-4"></div>

                            <button onClick={() => setView('settings')} className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded flex items-center justify-between border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm">
                                <div className="flex items-center gap-3">
                                    <Settings className="w-5 h-5 text-slate-500" />
                                    <span className="font-bold text-slate-700 dark:text-slate-200">Task Settings</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-300" />
                            </button>
                        </div>
                    ) : (
                        <div className="px-6 space-y-8">
                            {/* Behavior */}
                            <section className="space-y-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <Settings className="w-3 h-3" />
                                    Behavior Settings
                                </h3>
                                <div className="bg-slate-50 dark:bg-slate-800/50 rounded p-2 space-y-1">
                                    <div className="flex items-center justify-between p-3">
                                        <div>
                                            <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">Auto-delete Completed</p>
                                            <p className="text-xs text-slate-400 font-medium mt-px">Remove finished tasks after 24h</p>
                                        </div>
                                        <button 
                                            onClick={() => handleToggle('autoDeleteCompleted')}
                                            className={`w-12 h-6 rounded-full transition-colors relative shadow-md ${settings.autoDeleteCompleted ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                                        >
                                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${settings.autoDeleteCompleted ? 'translate-x-6' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                    
                                    <hr className="border-slate-200 dark:border-slate-800 mx-3" />

                                    <div className="flex items-center justify-between p-3">
                                        <div>
                                            <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">Confirm Deletion</p>
                                            <p className="text-xs text-slate-400 font-medium mt-px">Ask before deleting a task item</p>
                                        </div>
                                        <button 
                                            onClick={() => handleToggle('confirmDelete')}
                                            className={`w-12 h-6 rounded-full transition-colors relative shadow-md ${settings.confirmDelete ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                                        >
                                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${settings.confirmDelete ? 'translate-x-6' : 'translate-x-0'}`} />
                                        </button>
                                    </div>

                                    <hr className="border-slate-200 dark:border-slate-800 mx-3" />

                                    <div className="flex items-center justify-between p-3">
                                        <div>
                                            <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">Show Completed List</p>
                                            <p className="text-xs text-slate-400 font-medium mt-px">Keep finished tasks visible</p>
                                        </div>
                                        <button 
                                            onClick={() => handleToggle('showCompletedInList')}
                                            className={`w-12 h-6 rounded-full transition-colors relative shadow-md ${settings.showCompletedInList ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                                        >
                                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${settings.showCompletedInList ? 'translate-x-6' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                </div>
                            </section>
                            
                            {/* Defaults */}
                            <section className="space-y-4 pb-4">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Default Values</h3>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded border border-slate-100 dark:border-slate-800">
                                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Task Priority</label>
                                        <select 
                                            value={settings.defaultPriority}
                                            onChange={(e) => handleChange('defaultPriority', e.target.value)}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option>Low</option>
                                            <option>Medium</option>
                                            <option>High</option>
                                        </select>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded border border-slate-100 dark:border-slate-800">
                                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Duration (min)</label>
                                        <input 
                                            type="number"
                                            value={settings.defaultDuration}
                                            onChange={(e) => handleChange('defaultDuration', Number(e.target.value))}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded p-2 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}
                </div>
                
                <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
                    <AppButton onClick={onClose} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded py-4 font-bold active:scale-[0.98] transition-all">
                        Done
                    </AppButton>
                </div>
            </div>
        </div>
    );
};

export default TaskSettingsModal;
