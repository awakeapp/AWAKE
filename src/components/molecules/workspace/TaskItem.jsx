import { useState, useEffect } from 'react';
import { useTasks } from '../../../context/TaskContext';
import { motion, AnimatePresence } from 'framer-motion';
import ThreeStateCheckbox from '../../atoms/ThreeStateCheckbox';
import { getIconForTask } from '../../../utils/TaskIcons';
import clsx from 'clsx';
import { Clock, ArrowUp, Trash2, Calendar as CalendarIcon, Tag } from 'lucide-react';
import DatePicker from '../../atoms/DatePicker';
import { format } from 'date-fns';

const TaskItem = ({ task, onUpdateStatus, isLocked, variant = 'default', onReschedule, onDelete, isRoutine = false }) => {
    // Safely handle missing name/title
    const displayTitle = task.name || task.title || 'Untitled';
    const IconComponent = getIconForTask(displayTitle);

    // Import TaskContext for global popover management
    const { activePopoverId, setActivePopoverId } = useTasks();

    // Simplified styling
    const isCompleted = task.status === 'completed' || task.status === 'checked';
    const isCarryOver = variant === 'carry_over';

    const isDatePickerOpen = activePopoverId === task.id;

    // Handle closing when clicking outside
    useEffect(() => {
        if (!isDatePickerOpen) return;

        const handleClickOutside = (event) => {
            // Close if clicking anywhere, the DatePicker stops propagation so this only fires 
            // if clicking outside the picker content (captured by the backdrop logic or ensuring popover handles itself)
            // Ideally we just check if the click target is NOT inside this specific container
            // But for simplicity, we rely on the DatePicker's own backdrop or just use a window listener that checks ID
            // Here, we'll keep it simple: if clicking outside, we close.
            // But wait, the date picker button itself triggers this.
            // Let's use a simpler approach: The DatePicker component renders a backdrop wrapper.
            // We just need to ensure toggling works.
        };

        // We actually don't need a complex listener if we use a transparent fixed backdrop like before, 
        // BUT the user said "sometimes overlapping". 
        // The issue is likely z-index in a stack context (framer motion).
        // By setting z-index high ONLY when active, we fix the overlap.
    }, [isDatePickerOpen]);

    const handleToggleDatePicker = (e) => {
        e.stopPropagation();
        if (isDatePickerOpen) {
            setActivePopoverId(null);
        } else {
            setActivePopoverId(task.id);
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isCompleted ? 0.6 : 1, y: 0 }}
            whileHover={{ y: -2 }}
            className={clsx(
                "group relative flex items-center gap-3 sm:gap-5 p-3 sm:p-4 rounded-[1.5rem] border transition-all duration-300",
                isCarryOver
                    ? "bg-orange-50/40 dark:bg-orange-950/20 border-orange-100/50 dark:border-orange-900/30"
                    : isCompleted
                        ? "bg-slate-50/50 dark:bg-slate-900/30 border-transparent shadow-none"
                        : "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-slate-100 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] hover:border-indigo-100/50 dark:hover:border-indigo-900/30",
                // CRITICAL FIX: Z-Index boost when active to preventing clipping/overlap by subsequent siblings
                isDatePickerOpen ? "z-50" : "z-0"
            )}
        >
            {/* Background Accent Glow (Subtle) */}
            {!isCompleted && !isCarryOver && (
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent dark:from-indigo-900/5 dark:to-transparent rounded-[1.5rem] -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}

            {/* 1. TIME Section - Redesigned for Premium Feel */}
            {!isCarryOver && task.time && (
                <div className="shrink-0 flex flex-col items-center justify-center min-w-[62px] sm:min-w-[70px] py-1.5 px-2 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-slate-100/50 dark:border-slate-700/50">
                    <span className="text-[17px] sm:text-[19px] font-thin text-slate-800 dark:text-slate-100 tabular-nums leading-none tracking-tight">
                        {(() => {
                            const [h, m] = task.time.split(':').map(Number);
                            const h12 = h % 12 || 12;
                            return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                        })()}
                    </span>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex items-center gap-2.5 sm:gap-4 flex-1 min-w-0">
                {/* 2. ICON - Styled with depth */}
                <div className={clsx(
                    "flex-shrink-0 w-9 h-9 sm:w-11 sm:h-11 rounded-[1.1rem] flex items-center justify-center transition-all duration-300",
                    isCarryOver
                        ? "bg-orange-100 dark:bg-orange-900/30 text-orange-500 shadow-sm"
                        : isCompleted
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-400"
                            : "bg-indigo-50/80 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 shadow-sm group-hover:scale-110"
                )}>
                    <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:rotate-12" />
                </div>

                <div className="flex flex-col min-w-0 flex-1">
                    <span className={clsx(
                        "text-[14px] sm:text-[16px] font-normal tracking-tight transition-colors duration-300",
                        isCarryOver
                            ? "text-slate-600 dark:text-slate-400"
                            : isCompleted
                                ? "text-slate-400 line-through decoration-slate-300/60"
                                : "text-slate-900 dark:text-slate-50 group-hover:text-indigo-700 dark:group-hover:text-indigo-300"
                    )}>
                        {displayTitle}
                    </span>

                    {/* PRIORITY & CATEGORY DISPLAY */}
                    {!isCarryOver && (
                        <div className="flex items-center gap-2 mt-0.5 overflow-hidden">
                            {task.priority && (
                                <span className={clsx(
                                    "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md",
                                    task.priority === 'High' ? "bg-red-50 text-red-500 dark:bg-red-900/20" :
                                        task.priority === 'Medium' ? "bg-amber-50 text-amber-500 dark:bg-amber-900/20" :
                                            "bg-blue-50 text-blue-500 dark:bg-blue-900/20"
                                )}>
                                    {task.priority}
                                </span>
                            )}
                            {task.category && !isRoutine && (
                                <div className="flex items-center gap-1 opacity-60">
                                    <Tag className="w-2.5 h-2.5" />
                                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate">
                                        {task.category}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {isCarryOver && (
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-orange-500/80 font-bold uppercase tracking-wider">
                                ROLLOVER • {task.date}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* 4. ACTIONS */}
            <div className="flex-shrink-0 flex items-center gap-1.5 sm:gap-2 pl-1">
                {/* DATE SELECTOR BUTTON */}
                {!isLocked && !isCompleted && !isRoutine && (
                    <div className="relative">
                        <button
                            onClick={handleToggleDatePicker}
                            className={clsx(
                                "p-1.5 rounded-lg transition-colors z-20 relative",
                                isDatePickerOpen ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20" : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                            )}
                            title="Reschedule Task"
                        >
                            <CalendarIcon className="w-4 h-4" />
                        </button>

                        <AnimatePresence>
                            {isDatePickerOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-[60] bg-transparent"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActivePopoverId(null);
                                        }}
                                    />
                                    <div className="absolute top-full right-0 mt-2 z-[70]">
                                        <DatePicker
                                            selectedDate={task.date ? new Date(task.date) : new Date()}
                                            onChange={(newDate) => {
                                                if (newDate) {
                                                    const formattedDate = format(newDate, 'yyyy-MM-dd');
                                                    onReschedule && onReschedule(task.id, formattedDate);
                                                }
                                                setActivePopoverId(null);
                                            }}
                                            minDate={new Date().toISOString().split('T')[0]}
                                            onClose={() => setActivePopoverId(null)}
                                        />
                                    </div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {isCarryOver ? (
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => onReschedule && onReschedule(task.id, 'today')}
                            className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-xl transition-all active:scale-90"
                            title="Assign to Today"
                        >
                            <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onDelete && onDelete(task.id)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all active:scale-90"
                            title="Remove"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="scale-110 sm:scale-125 transition-transform hover:scale-[1.2] active:scale-95 px-1">
                        <ThreeStateCheckbox
                            status={isCompleted ? 'checked' : task.status || 'unchecked'}
                            onClick={() => onUpdateStatus(task.id)}
                            disabled={isLocked}
                        />
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default TaskItem;
