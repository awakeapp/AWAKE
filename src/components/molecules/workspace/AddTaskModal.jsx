import { useState, useEffect } from 'react';
import { X, Clock, Calendar as CalendarIcon, Tag, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { format } from 'date-fns';
import DatePicker from '../../atoms/DatePicker';

const AddTaskModal = ({ isOpen, onClose, onAdd, initialDate }) => {
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('Work');
    const [priority, setPriority] = useState('Medium');
    const [startTime, setStartTime] = useState('09:00');
    const [date, setDate] = useState(initialDate);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Reset form when opening
    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setCategory('Work');
            setPriority('Medium');
            setStartTime('09:00');
            setDate(initialDate || new Date().toISOString().split('T')[0]);
        }
    }, [isOpen, initialDate]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        onAdd(title, {
            category,
            priority,
            time: startTime,
            date
        });
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 transition-opacity"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl ring-1 ring-slate-900/5 pointer-events-auto overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                                <h2 className="text-lg font-bold text-slate-800 dark:text-white">New Task</h2>
                                <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Body */}
                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                        What needs to be done?
                                    </label>
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="e.g., Review Q3 Operations"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full text-base bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white placeholder-slate-400"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Category */}
                                    <div className="space-y-2">
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            Category
                                        </label>
                                        <select
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500/20"
                                        >
                                            <option value="Work">Work</option>
                                            <option value="Health">Health</option>
                                            <option value="Personal">Personal</option>
                                        </select>
                                    </div>

                                    {/* Priority */}
                                    <div className="space-y-2">
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            Priority
                                        </label>
                                        <select
                                            value={priority}
                                            onChange={(e) => setPriority(e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500/20"
                                        >
                                            <option value="Low">Low</option>
                                            <option value="Medium">Medium</option>
                                            <option value="High">High</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Start Time */}
                                    <div className="space-y-2">
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            Start Time
                                        </label>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                type="time"
                                                value={startTime}
                                                onChange={(e) => setStartTime(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500/20"
                                            />
                                        </div>
                                    </div>

                                    {/* Date */}
                                    <div className="space-y-2 relative">
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                            Date
                                        </label>
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => setShowDatePicker(!showDatePicker)}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500/20 text-left flex items-center"
                                            >
                                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <span>{date ? format(new Date(date), 'MMM do, yyyy') : 'Select date'}</span>
                                            </button>

                                            <AnimatePresence>
                                                {showDatePicker && (
                                                    <>
                                                        {/* Responsive Backdrop */}
                                                        <div
                                                            className="fixed inset-0 z-[60] bg-slate-900/20 backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-none"
                                                            onClick={() => setShowDatePicker(false)}
                                                        />

                                                        {/* Positioning Container */}
                                                        <div className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none sm:absolute sm:inset-auto sm:top-full sm:left-0 sm:mt-2 sm:w-full">
                                                            <div className="pointer-events-auto">
                                                                <DatePicker
                                                                    selectedDate={date ? new Date(date) : new Date()}
                                                                    onChange={(newDate) => {
                                                                        setDate(newDate.toISOString().split('T')[0]);
                                                                        setShowDatePicker(false);
                                                                    }}
                                                                    minDate={new Date().toISOString().split('T')[0]}
                                                                    onClose={() => setShowDatePicker(false)}
                                                                />
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="pt-4 mt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!title.trim()}
                                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:shadow-none transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        Create Task
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default AddTaskModal;
