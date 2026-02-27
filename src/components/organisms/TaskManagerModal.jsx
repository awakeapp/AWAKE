import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Check } from 'lucide-react';
import Button from '../atoms/Button';
import { useData } from '../../context/DataContext';
import { inferIcon, getIconComponent } from '../../utils/iconInference';
import { useScrollLock } from '../../hooks/useScrollLock';
import ConfirmDialog from './ConfirmDialog';

const TaskManagerModal = ({ isOpen, onClose, tasks }) => {
    useScrollLock(isOpen);
    const [localTasks, setLocalTasks] = useState([]);
    const { updateAllTasks } = useData();

    const [showAddRow, setShowAddRow] = useState(false);
    const [newTaskName, setNewTaskName] = useState('');
    const [newTaskTime, setNewTaskTime] = useState('');
    const [newTaskCategory, setNewTaskCategory] = useState('EVE/NIGHT');
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setLocalTasks([...tasks]);
            setShowAddRow(false);
            setNewTaskName('');
            setNewTaskTime('');
            setNewTaskCategory('EVE/NIGHT');
        }
    }, [isOpen, tasks]);

    const handleTaskChange = (id, field, value) => {
        setLocalTasks(prev => prev.map(t => {
            if (t.id !== id) return t;
            const updates = { [field]: value };
            if (field === 'name') {
                const inference = inferIcon(value);
                updates.icon = inference.icon;
            }
            return { ...t, ...updates };
        }));
    };

    const handleDelete = (id) => {
        setLocalTasks(prev => prev.filter(t => t.id !== id));
    };

    const handleConfirmAdd = () => {
        if (!newTaskName.trim()) return;

        const newTask = {
            id: `task_${Date.now()}`,
            name: newTaskName.trim(),
            time: newTaskTime,
            category: newTaskCategory,
            icon: inferIcon(newTaskName.trim()).icon,
            status: 'unchecked'
        };

        setLocalTasks(prev => {
            const updated = [...prev, newTask];
            updated.sort((a, b) => {
                if (!a.time && !b.time) return 0;
                if (!a.time) return 1;
                if (!b.time) return -1;
                const timeA = a.time.split(':').map(Number);
                const timeB = b.time.split(':').map(Number);
                return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
            });
            return updated;
        });

        setNewTaskName('');
        setNewTaskTime('');
        setNewTaskCategory('EVE/NIGHT');
        setShowAddRow(false);
    };

    const handleSave = () => {
        let finalTasks = [...localTasks];

        if (newTaskName.trim()) {
            const pendingTask = {
                id: `task_${Date.now()}_pending`,
                name: newTaskName.trim(),
                time: newTaskTime,
                category: newTaskCategory,
                icon: inferIcon(newTaskName.trim()).icon,
                status: 'unchecked'
            };
            finalTasks.push(pendingTask);
        }

        // Only explicitly remove unnamed tasks, let them keep missing times if they wish
        let validTasks = finalTasks.filter(t => t.name.trim() !== '');

        validTasks.sort((a, b) => {
            if (!a.time && !b.time) return 0;
            if (!a.time) return 1;
            if (!b.time) return -1;
            const timeA = a.time.split(':').map(Number);
            const timeB = b.time.split(':').map(Number);
            return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
        });

        updateAllTasks(validTasks);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-100/20 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="w-full max-w-lg bg-white dark:bg-slate-950 rounded-[2rem] shadow-2xl shadow-slate-200/50 dark:shadow-black/50 overflow-hidden flex flex-col max-h-[75vh] ring-1 ring-slate-100 dark:ring-slate-800"
                >
                    <div className="pt-5 pb-3 px-5 sm:px-6 bg-indigo-600 dark:bg-slate-900 shrink-0 z-10 flex items-center justify-between shadow-sm">
                        <h3 className="text-lg font-normal text-white tracking-wide">
                            Edit Routine
                        </h3>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    setNewTaskName('');
                                    setNewTaskTime('');
                                    setShowAddRow(true);
                                }}
                                className="p-1 text-indigo-100 hover:text-white transition-colors rounded-full hover:bg-white/10"
                                title="Add Task"
                            >
                                <Plus className="w-6 h-6 stroke-[1.5]" />
                            </button>
                            <button
                                onClick={onClose}
                                className="p-1 -mr-1 text-indigo-100 hover:text-white transition-colors rounded-full hover:bg-white/10"
                            >
                                <X className="w-6 h-6 stroke-[1.5]" />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-y-auto px-5 sm:px-6 py-2 flex-1 min-h-0 bg-white dark:bg-slate-950 scrollbar-hide">
                        {localTasks.length === 0 && !showAddRow ? (
                            <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
                                <p className="text-slate-900 font-normal text-lg">No tasks yet</p>
                                <p className="text-slate-500 text-sm mt-1 font-normal">Add your first habit below</p>
                            </div>
                        ) : (
                            localTasks.map((task) => (
                                <motion.div
                                    key={task.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="group flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800/50 last:border-0"
                                >
                                    <div className="shrink-0 z-10 w-24">
                                        <input
                                            type="time"
                                            value={task.time || ''}
                                            onChange={(e) => handleTaskChange(task.id, 'time', e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-900/50 text-[14px] font-medium text-slate-700 dark:text-slate-300 rounded-lg px-2 py-1.5 outline-none border border-slate-200 dark:border-slate-800 focus:border-indigo-500"
                                        />
                                    </div>

                                    <div className="shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                        {(() => {
                                            let IconCmp = getIconComponent(task.icon);
                                            if (!IconCmp) return <Check className="w-4 h-4" />;
                                            return <IconCmp className="w-4 h-4" />;
                                        })()}
                                    </div>

                                    <div className="flex-1 min-w-0 flex flex-col pt-1 gap-0.5">
                                        <input
                                            type="text"
                                            value={task.name}
                                            onChange={(e) => handleTaskChange(task.id, 'name', e.target.value)}
                                            placeholder="Task Name"
                                            maxLength={50}
                                            className="w-full bg-transparent border-none p-0 text-[16px] font-normal text-slate-900 dark:text-slate-50 placeholder:text-slate-300 focus:ring-0 focus:outline-none"
                                        />
                                        <select
                                            value={task.category || 'EVE/NIGHT'}
                                            onChange={(e) => handleTaskChange(task.id, 'category', e.target.value)}
                                            className="bg-transparent text-[9px] font-bold uppercase tracking-wider text-slate-400 focus:outline-none p-0 w-max appearance-none cursor-pointer hover:text-indigo-500"
                                            style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                                        >
                                            <option value="EARLY MORNING">EARLY MORNING</option>
                                            <option value="BEFORE NOON">BEFORE NOON</option>
                                            <option value="AFTER NOON">AFTER NOON</option>
                                            <option value="EVE/NIGHT">EVE/NIGHT</option>
                                        </select>
                                    </div>

                                    <button
                                        onClick={() => setDeleteConfirmId(task.id)}
                                        className="shrink-0 p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                                        aria-label="Delete"
                                    >
                                        <Trash2 className="w-4 h-4 stroke-[1.5]" />
                                    </button>
                                </motion.div>
                            ))
                        )}

                        {showAddRow && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-3 py-2 border-b border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/50 dark:bg-indigo-900/10 -mx-4 px-4 rounded-xl my-1"
                            >
                                <div className="shrink-0 z-10 w-24">
                                    <input
                                        type="time"
                                        value={newTaskTime || ''}
                                        onChange={(e) => setNewTaskTime(e.target.value)}
                                        className="w-full bg-white dark:bg-slate-900 text-[14px] font-medium text-slate-700 dark:text-slate-300 rounded-lg px-2 py-1.5 outline-none border border-indigo-200 dark:border-indigo-800 focus:border-indigo-500 shadow-sm"
                                    />
                                </div>
                                <div className="shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600">
                                    {(() => {
                                        let IconCmp = inferIcon(newTaskName).component;
                                        if (!IconCmp) return <Check className="w-4 h-4" />;
                                        return <IconCmp className="w-4 h-4" />;
                                    })()}
                                </div>
                                <div className="flex-1 min-w-0 flex flex-col pt-1 gap-0.5">
                                    <input
                                        autoFocus
                                        type="text"
                                        value={newTaskName}
                                        onChange={(e) => setNewTaskName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleConfirmAdd();
                                            if (e.key === 'Escape') setShowAddRow(false);
                                        }}
                                        placeholder="Type task name..."
                                        className="w-full bg-transparent border-none p-0 text-[16px] font-normal text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-0 focus:outline-none"
                                    />
                                    <select
                                        value={newTaskCategory}
                                        onChange={(e) => setNewTaskCategory(e.target.value)}
                                        className="bg-transparent text-[9px] font-bold uppercase tracking-wider text-slate-400 focus:outline-none p-0 w-max appearance-none cursor-pointer hover:text-indigo-500"
                                        style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                                    >
                                        <option value="EARLY MORNING">EARLY MORNING</option>
                                        <option value="BEFORE NOON">BEFORE NOON</option>
                                        <option value="AFTER NOON">AFTER NOON</option>
                                        <option value="EVE/NIGHT">EVE/NIGHT</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setShowAddRow(false)}
                                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={handleConfirmAdd}
                                        disabled={!newTaskName.trim()}
                                        className="p-1 text-indigo-600 hover:text-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <Plus className="w-6 h-6" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {!showAddRow && (
                            <div className="pt-2 pb-6">
                                <button
                                    onClick={() => {
                                        setNewTaskName('');
                                        setNewTaskTime('');
                                        setShowAddRow(true);
                                    }}
                                    className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors px-1 group"
                                >
                                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
                                        <Plus className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-normal">Add task</span>
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="p-4 sm:p-6 bg-white dark:bg-slate-950 shrink-0 border-t border-slate-100 dark:border-slate-800">
                        <Button
                            onClick={handleSave}
                            className="w-full py-3.5 text-base font-semibold shadow-lg shadow-indigo-200/50 dark:shadow-indigo-900/50 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl transition-all"
                        >
                            Save Routine
                        </Button>
                    </div>
                </motion.div>
            </div>

            <ConfirmDialog
                isOpen={!!deleteConfirmId}
                onClose={() => setDeleteConfirmId(null)}
                onConfirm={() => {
                    handleDelete(deleteConfirmId);
                }}
                title="Delete Routine Task?"
                message="Are you sure you want to remove this task from your routine?"
                confirmText="Remove"
            />
        </AnimatePresence>
    );
};

export default TaskManagerModal;
