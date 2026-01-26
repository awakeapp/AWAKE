import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Edit2, Check } from 'lucide-react';
import Button from '../atoms/Button';
import { useData } from '../../context/DataContext';


const TaskManagerModal = ({ isOpen, onClose, tasks }) => {
    // Local state for editing
    const [localTasks, setLocalTasks] = useState([]);
    const { updateAllTasks } = useData();

    const [showAddRow, setShowAddRow] = useState(false);
    const [newTaskName, setNewTaskName] = useState('');
    const [newTaskTime, setNewTaskTime] = useState('');

    // Sync local state when modal opens
    useEffect(() => {
        if (isOpen) {
            setLocalTasks([...tasks]);
            setShowAddRow(false);
            setNewTaskName('');
            setNewTaskTime('');
        }
    }, [isOpen, tasks]);

    const handleTaskChange = (id, field, value) => {
        setLocalTasks(prev => prev.map(t =>
            t.id === id ? { ...t, [field]: value } : t
        ));
    };

    const handleDelete = (id) => {
        setLocalTasks(prev => prev.filter(t => t.id !== id));
    };

    const handleConfirmAdd = () => {
        if (!newTaskName.trim() || !newTaskTime) return;

        const newTask = {
            id: `task_${Date.now()}`,
            name: newTaskName.trim(),
            time: newTaskTime,
            icon: '✨',
            status: 'unchecked'
        };

        setLocalTasks(prev => {
            const updated = [...prev, newTask];
            updated.sort((a, b) => {
                if (!a.time || !b.time) return 0;
                const timeA = a.time.split(':').map(Number);
                const timeB = b.time.split(':').map(Number);
                return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
            });
            return updated;
        });

        setNewTaskName('');
        setNewTaskTime('');
        setShowAddRow(false);
    };

    const handleSave = () => {
        // Validation: remove empty tasks
        const validTasks = localTasks.filter(t => t.name.trim() !== '' && t.time !== '');

        // Final Sort just in case edited times changed order
        validTasks.sort((a, b) => {
            if (!a.time || !b.time) return 0;
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
                    transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                    className="w-full max-w-lg bg-white dark:bg-slate-950 rounded-[2rem] shadow-2xl shadow-slate-200/50 dark:shadow-black/50 overflow-hidden flex flex-col max-h-[75vh] ring-1 ring-slate-100 dark:ring-slate-800"
                >
                    {/* Header */}
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

                    {/* Task List */}
                    <div className="overflow-y-auto px-5 sm:px-6 py-2 flex-1 min-h-0 bg-white dark:bg-slate-950 scrollbar-hide">
                        {localTasks.length === 0 && !showAddRow ? (
                            <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
                                <p className="text-slate-900 font-normal text-lg">No tasks yet</p>
                                <p className="text-slate-500 text-sm mt-1 font-normal">Add your first habit below</p>
                            </div>
                        ) : (
                            localTasks.map((task, index) => (
                                <motion.div
                                    key={task.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="group flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800/50 last:border-0"
                                >
                                    {/* Time Display (Inline) */}
                                    <div className="shrink-0 z-10">
                                        <TimeInput
                                            value={task.time}
                                            onChange={(val) => handleTaskChange(task.id, 'time', val)}
                                        />
                                    </div>

                                    {/* Task Content */}
                                    <div className="flex-1 min-w-0">
                                        <input
                                            type="text"
                                            value={task.name}
                                            onChange={(e) => handleTaskChange(task.id, 'name', e.target.value)}
                                            placeholder="Task Name"
                                            maxLength={50}
                                            className="w-full bg-transparent border-none p-0 text-[16px] font-normal text-slate-900 dark:text-slate-50 placeholder:text-slate-300 focus:ring-0 focus:outline-none"
                                        />
                                    </div>

                                    {/* Delete Action (Always visible on mobile, subtle) */}
                                    <button
                                        onClick={() => handleDelete(task.id)}
                                        className="shrink-0 p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                                        aria-label="Delete"
                                    >
                                        <Trash2 className="w-4 h-4 stroke-[1.5]" />
                                    </button>
                                </motion.div>
                            ))
                        )}

                        {/* Inline Add Row */}
                        {showAddRow && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-3 py-2 border-b border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/50 dark:bg-indigo-900/10 -mx-4 px-4 rounded-xl my-1"
                            >
                                <div className="shrink-0 z-10">
                                    <TimeInput
                                        value={newTaskTime}
                                        onChange={setNewTaskTime}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
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
                                        disabled={!newTaskName.trim() || !newTaskTime}
                                        className="p-1 text-indigo-600 hover:text-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <Plus className="w-6 h-6" />
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Add Button Trigger */}
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

                    {/* Footer - Sticky */}
                    <div className="p-4 sm:p-6 bg-white dark:bg-slate-950 shrink-0 border-t border-slate-100 dark:border-slate-800">
                        <Button
                            onClick={handleSave}
                            className="w-full py-3.5 text-base font-semibold shadow-lg shadow-indigo-200/50 dark:shadow-indigo-900/50 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl hover:scale-[1.01] active:scale-[0.99] transition-all"
                        >
                            Save Routine
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

// Simplified Single-Line Time Input
const TimeInput = ({ value, onChange }) => {
    const parseTime = (timeStr) => {
        if (!timeStr || typeof timeStr !== 'string') return { h: '12', m: '00', p: 'AM' };
        const [h, m] = timeStr.split(':').map(Number);
        const p = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return {
            h: String(h12).padStart(2, '0'),
            m: String(m).padStart(2, '0'),
            p
        };
    };

    const parsed = parseTime(value);
    const [hourInput, setHourInput] = useState(parsed.h);
    const [minuteInput, setMinuteInput] = useState(parsed.m);

    // Sync local state when parent value changes
    useEffect(() => {
        const newParsed = parseTime(value);
        setHourInput(newParsed.h);
        setMinuteInput(newParsed.m);
    }, [value]);

    const commitTime = () => {
        let h = parseInt(hourInput) || 12;
        h = Math.max(1, Math.min(12, h));

        let m = parseInt(minuteInput) || 0;
        m = Math.max(0, Math.min(59, m));

        // Convert to 24h
        if (parsed.p === 'PM' && h !== 12) h += 12;
        if (parsed.p === 'AM' && h === 12) h = 0;

        const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        onChange(timeStr);

        // Update display to formatted values
        setHourInput(String(Math.max(1, Math.min(12, parseInt(hourInput) || 12))).padStart(2, '0'));
        setMinuteInput(String(Math.max(0, Math.min(59, parseInt(minuteInput) || 0))).padStart(2, '0'));
    };

    const toggleAmPm = () => {
        let h = parseInt(hourInput) || 12;
        h = Math.max(1, Math.min(12, h));
        let m = parseInt(minuteInput) || 0;
        m = Math.max(0, Math.min(59, m));

        const newP = parsed.p === 'AM' ? 'PM' : 'AM';

        if (newP === 'PM' && h !== 12) h += 12;
        if (newP === 'AM' && h === 12) h = 0;

        const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        onChange(timeStr);
    };

    return (
        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900/50 rounded-lg px-2.5 py-1.5">
            <input
                type="text"
                value={hourInput}
                onChange={(e) => setHourInput(e.target.value.replace(/\D/g, '').slice(0, 2))}
                onBlur={commitTime}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') commitTime();
                }}
                onFocus={(e) => e.target.select()}
                className="bg-transparent text-[15px] font-medium text-slate-900 dark:text-slate-100 outline-none text-center w-[24px] p-0 tabular-nums"
                placeholder="12"
            />
            <span className="text-slate-400 dark:text-slate-500 text-sm font-medium select-none">:</span>
            <input
                type="text"
                value={minuteInput}
                onChange={(e) => setMinuteInput(e.target.value.replace(/\D/g, '').slice(0, 2))}
                onBlur={commitTime}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') commitTime();
                }}
                onFocus={(e) => e.target.select()}
                className="bg-transparent text-[15px] font-medium text-slate-900 dark:text-slate-100 outline-none text-center w-[24px] p-0 tabular-nums"
                placeholder="00"
            />

            <button
                onClick={toggleAmPm}
                className="ml-0.5 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
                {parsed.p}
            </button>
        </div>
    );
};
export default TaskManagerModal;
