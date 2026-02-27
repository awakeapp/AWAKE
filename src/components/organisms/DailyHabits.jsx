import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2, Edit2, Check, CheckCircle } from 'lucide-react';
import { AppCard as Card, AppCardContent } from '../ui/AppCard';
import clsx from 'clsx';
import { useData } from '../../context/DataContext';
import { getIconComponent } from '../../utils/iconInference';
import HabitManagerDialog from './HabitManagerDialog'; // Forced update v3
import { DeleteConfirmationModal } from '../ui/DeleteConfirmationModal';

const HabitToggle = ({ id, icon, label, value, onChange, onDelete, disabled, isEditing }) => {
    // Dynamic Icon Resolution
    const Icon = getIconComponent(icon);

    return (
        <div className="flex items-center justify-between py-3.5 border-b border-slate-50 dark:border-slate-800/50 last:border-0 group">
            <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center shrink-0 text-slate-500 dark:text-slate-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 group-hover:text-indigo-600 transition-colors">
                    <Icon className="w-4.5 h-4.5" />
                </div>
                <span className="font-normal text-[15px] text-slate-700 dark:text-slate-300 truncate">{label}</span>
            </div>

            <div className="flex items-center gap-3">
                <AnimatePresence mode="wait">
                    {isEditing ? (
                        <motion.button
                            key="delete"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={onDelete}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-full transition-colors"
                            title="Delete habit"
                        >
                            <Trash2 className="w-4.5 h-4.5" />
                        </motion.button>
                    ) : (
                        <motion.div
                            key="toggle"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-full w-[120px] ring-1 ring-slate-200/50 dark:ring-slate-800"
                        >
                            <button
                                onClick={() => onChange(false)}
                                disabled={disabled}
                                className={clsx(
                                    "flex-1 px-3 py-1.5 text-[11px] font-bold rounded-full transition-all duration-200",
                                    !value
                                        ? "bg-emerald-500 text-white shadow-sm"
                                        : "text-slate-400 dark:text-slate-500 hover:text-slate-600"
                                )}
                            >
                                NO
                            </button>
                            <button
                                onClick={() => onChange(true)}
                                disabled={disabled}
                                className={clsx(
                                    "flex-1 px-3 py-1.5 text-[11px] font-bold rounded-full transition-all duration-200",
                                    value
                                        ? "bg-rose-500 text-white shadow-sm"
                                        : "text-slate-400 dark:text-slate-500 hover:text-slate-600"
                                )}
                            >
                                YES
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

const NumericHabitInput = ({ id, icon, label, value, unit, onChange, onDelete, disabled, isEditing }) => {
    // Dynamic Icon Resolution
    const Icon = getIconComponent(icon);

    const getColorClass = (h) => {
        if (unit === 'hrs') {
            if (h <= 2) return "text-emerald-500 dark:text-emerald-400";
            if (h <= 4) return "text-amber-500 dark:text-amber-400";
            return "text-rose-500 dark:text-rose-400";
        }
        return "text-indigo-500 dark:text-indigo-400"; // Neutral for minutes
    };

    return (
        <div className="flex items-center justify-between py-3.5 border-b border-slate-50 dark:border-slate-800/50 last:border-0 group">
            <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center shrink-0 text-slate-500 dark:text-slate-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 group-hover:text-indigo-600 transition-colors">
                    <Icon className="w-4.5 h-4.5" />
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="font-normal text-[15px] text-slate-700 dark:text-slate-300 truncate">{label}</span>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{unit === 'hrs' ? 'Hours' : 'Minutes'}</span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <AnimatePresence mode="wait">
                    {isEditing ? (
                        <motion.button
                            key="delete"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={onDelete}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-full transition-colors"
                            title="Delete habit"
                        >
                            <Trash2 className="w-4.5 h-4.5" />
                        </motion.button>
                    ) : (
                        <motion.div
                            key="input"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative flex items-center gap-2"
                        >
                            <input
                                type="number"
                                min="0"
                                max={unit === 'hrs' ? 24 : 1440}
                                step={unit === 'hrs' ? 0.5 : 1}
                                value={value || 0}
                                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                                disabled={disabled}
                                className={clsx(
                                    "w-20 px-3 py-1.5 text-center font-bold text-sm bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all",
                                    getColorClass(value)
                                )}
                            />
                            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-600 w-8">{unit === 'hrs' ? 'hr' : 'min'}</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

const DailyHabits = ({ habits, onUpdateHabit, isLocked }) => {
    const { addHabit, deleteHabit } = useData();
    const [isEditing, setIsEditing] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    const handleAdd = (name, type, unit, icon) => {
        addHabit(name, type, unit, icon);
    };

    return (
        <section className="mb-6">
            <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                    {!isLocked && (
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className={clsx(
                                "p-1 rounded-full transition-colors",
                                isEditing ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-indigo-600"
                            )}
                            title={isEditing ? "Finish Editing" : "Manage Habits"}
                        >
                            {isEditing ? <Check className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
                        </button>
                    )}
                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] dark:text-slate-500">
                        Daily Habits
                    </h3>
                </div>
                {!isLocked && (
                    <button
                        onClick={() => {
                            setShowModal(true);
                            setIsEditing(false);
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                        title="Add Habit"
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                )}
            </div>

            <Card className="border-none shadow-premium dark:bg-slate-950 overflow-visible">
                <AppCardContent className="p-4 sm:p-5">

                    <div className="space-y-1">
                        {habits.map((habit) => (
                            habit.type === 'number' ? (
                                <NumericHabitInput
                                    key={habit.id}
                                    id={habit.id}
                                    icon={habit.icon}
                                    label={habit.label}
                                    value={habit.value}
                                    unit={habit.unit}
                                    onChange={(val) => onUpdateHabit(habit.id, val)}
                                    onDelete={() => setDeleteConfirmId(habit.id)}
                                    disabled={isLocked}
                                    isEditing={isEditing}
                                />
                            ) : (
                                <HabitToggle
                                    key={habit.id}
                                    id={habit.id}
                                    icon={habit.icon}
                                    label={habit.label}
                                    value={habit.value}
                                    onChange={(val) => onUpdateHabit(habit.id, val)}
                                    onDelete={() => setDeleteConfirmId(habit.id)}
                                    disabled={isLocked}
                                    isEditing={isEditing}
                                />
                            )
                        ))}

                        {habits.length === 0 && (
                            <div className="py-8 text-center bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-800">
                                <span className="block text-slate-400 text-xs mb-2">No habits tracked yet</span>
                                <button
                                    onClick={() => {
                                        setShowModal(true);
                                        setIsEditing(false);
                                    }}
                                    className="text-indigo-500 font-semibold text-xs hover:underline"
                                >
                                    + Add New Habit
                                </button>
                            </div>
                        )}
                    </div>
                </AppCardContent>
            </Card>

            <HabitManagerDialog
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onAdd={handleAdd}
            />

            <DeleteConfirmationModal
                isOpen={!!deleteConfirmId}
                onClose={() => setDeleteConfirmId(null)}
                onConfirm={() => {
                    deleteHabit(deleteConfirmId);
                    setDeleteConfirmId(null);
                }}
                title="Delete Habit?"
                message="Are you sure you want to delete this habit? It will be removed from your tracking options."
            />
        </section>
    );
};

export default DailyHabits;
