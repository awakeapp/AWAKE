import { useState, useEffect, memo } from 'react';
import { useTasks } from '../../../context/TaskContext';
import { motion, AnimatePresence } from 'framer-motion';
import ToggleSwitch from '../../atoms/ToggleSwitch';
import ThreeStateCheckbox from '../../atoms/ThreeStateCheckbox';
import { inferIcon, getIconComponent } from '../../../utils/iconInference';
import clsx from 'clsx';
import { Clock, ArrowUp, Trash2, Calendar as CalendarIcon, Tag, Info, Edit2 } from 'lucide-react';
import { useSettings } from '../../../context/SettingsContext';
import JumpDateModal from '../../organisms/JumpDateModal';
import { format } from 'date-fns';

const TaskItem = memo(({ task, onUpdateStatus, isLocked, variant = 'default', onReschedule, onDelete, isRoutine = false, onEdit }) => {
    // Safely handle missing name/title
    const displayTitle = task.name || task.title || 'Untitled';

    // Determine Icon: Use stored icon if available, otherwise infer from title
    let IconComponent = task.icon
        ? getIconComponent(task.icon)
        : inferIcon(displayTitle).component;

    if (!IconComponent) {
        IconComponent = Tag;
    }

    // Import TaskContext for global popover management
    const { activePopoverId, setActivePopoverId } = useTasks();
    const { timeFormat } = useSettings();

    // Simplified styling
    const isCompleted = task.status === 'completed' || task.status === 'checked';
    const isCarryOver = variant === 'carry_over';

    const isDatePickerOpen = activePopoverId === task.id;
    const [showInfo, setShowInfo] = useState(false);

    // Handle closing when clicking outside
    useEffect(() => {
        if (!isDatePickerOpen) return;
        // Logic handled by backdrop
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
            initial={false}
            animate={{ opacity: isCompleted ? 0.6 : 1 }}
            transition={{ duration: 0.2 }} // Faster enter/layout
            whileHover={{ y: -2 }}
            className={clsx(
                "group relative flex items-center gap-2.5 sm:gap-3 p-2.5 rounded-2xl border transition-all duration-200", 
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
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent dark:from-indigo-900/5 dark:to-transparent rounded-[1.5rem] -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            )}

            {/* 1. TIME Section - Redesigned for Premium Feel */}
            {!isCarryOver && task.time && (
                <div className="shrink-0 flex flex-col items-center justify-center min-w-[50px] py-1 px-1.5 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-slate-100/50 dark:border-slate-700/50">
                    <span className="text-[14px] font-medium text-slate-800 dark:text-slate-100 tabular-nums leading-none tracking-tight">
                        {(() => {
                            const [h, m] = task.time.split(':').map(Number);
                            if (timeFormat === '24h') {
                                return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                            }
                            const h12 = h % 12 || 12;
                            return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                        })()}
                    </span>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                {/* 2. ICON - Styled with depth */}
                <div className={clsx(
                    "flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-colors duration-200",
                    isCarryOver
                        ? "bg-orange-100 dark:bg-orange-900/30 text-orange-500 shadow-sm"
                        : isCompleted
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-400"
                            : "bg-indigo-50/80 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 shadow-sm"
                )}>
                    <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>

                <div 
                    className="flex flex-col flex-1 min-w-0 cursor-pointer active:opacity-60 transition-opacity"
                    onClick={(e) => {
                        // Prevent edit if clicking on the description info icon (handled by its own button)
                        if (onEdit && !isCarryOver) onEdit(task);
                    }}
                >
                    <div className="flex items-start gap-2 w-full">
                        {task.description && (
                            <div className="relative">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowInfo(!showInfo);
                                    }}
                                    className="flex items-center justify-center p-0.5 mt-0.5 rounded-full text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <Info className="w-3.5 h-3.5" />
                                </button>
                                <AnimatePresence>
                                    {showInfo && (
                                        <>
                                            <div 
                                                className="fixed inset-0 z-[80]" 
                                                onClick={(e) => { e.stopPropagation(); setShowInfo(false); }} 
                                            />
                                            <motion.div
                                                initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="absolute top-full left-0 mt-2 p-3 bg-white dark:bg-slate-800 rounded-[14px] shadow-xl border border-slate-100 dark:border-slate-700 w-56 sm:w-64 z-[90] text-[13px] leading-relaxed text-slate-600 dark:text-slate-300 pointer-events-auto shadow-[0_20px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_48px_rgba(0,0,0,0.55)]"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {task.description}
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                        <span className={clsx(
                            "text-[14px] sm:text-[15px] font-medium tracking-tight transition-colors duration-200 leading-tight whitespace-pre-wrap break-words [overflow-wrap:anywhere] block w-full",
                            isCarryOver
                                ? "text-slate-600 dark:text-slate-400"
                                : isCompleted
                                    ? "text-slate-400 line-through decoration-slate-300/60"
                                    : "text-slate-900 dark:text-slate-50 group-hover:text-indigo-700 dark:group-hover:text-indigo-300"
                        )}>
                            {displayTitle}
                        </span>
                    </div>

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

                    {/* Edit Icon Overlay */}
                    {!isCarryOver && onEdit && (
                        <div className="absolute inset-y-0 right-10 flex items-center pr-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                           <Edit2 className="w-4 h-4 text-slate-300 dark:text-slate-600" />
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
            <div className="flex-shrink-0 flex items-start mt-1 gap-1.5 sm:gap-2 pl-1">
                {/* DATE SELECTOR BUTTON */}
                {!isLocked && !isCompleted && !isRoutine && (
                    <div className="relative">
                        <button
                            onClick={handleToggleDatePicker}
                            className={clsx(
                                "p-1.5 rounded-lg transition-colors duration-150 z-20 relative active:bg-slate-100 dark:active:bg-slate-800",
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
                                        <JumpDateModal
                                            isOpen={isDatePickerOpen}
                                            initialDate={task.date ? new Date(task.date) : null}
                                            onSelect={(date) => {
                                                if (date) {
                                                    const formattedDate = format(date, 'yyyy-MM-dd');
                                                    onReschedule && onReschedule(task.id, formattedDate);
                                                } else {
                                                    onReschedule && onReschedule(task.id, null); // Allow clearing date
                                                }
                                                setActivePopoverId(null);
                                            }}
                                            minDate={new Date()}
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
                            className="p-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-xl transition-colors active:bg-indigo-200 dark:active:bg-indigo-900/60 duration-150"
                            title="Assign to Today"
                        >
                            <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => onDelete && onDelete(task.id)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors active:bg-red-100 dark:active:bg-red-900/40 duration-150"
                            title="Remove"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <div className="px-1 py-1 transition-opacity active:opacity-70 duration-150">
                        {isRoutine ? (
                            <ToggleSwitch
                                status={isCompleted ? 'checked' : task.status || 'unchecked'}
                                onClick={() => onUpdateStatus(task.id)}
                                disabled={isLocked}
                            />
                        ) : (
                            <div className="scale-90 opacity-90 transition-all hover:scale-100 hover:opacity-100">
                                <ThreeStateCheckbox
                                    status={isCompleted ? 'checked' : task.status || 'unchecked'}
                                    onClick={() => onUpdateStatus(task.id)}
                                    disabled={isLocked}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
});

TaskItem.displayName = 'TaskItem';

export default TaskItem;
