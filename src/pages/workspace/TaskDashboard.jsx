import { useState, useEffect, useRef } from 'react';
import { Clock, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, AlertCircle, X, MoreHorizontal, ArrowUpDown, ListTodo, Layout, Settings, Edit2 } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import TaskList from '../../components/organisms/workspace/TaskList';
import AddTaskModal from '../../components/molecules/workspace/AddTaskModal';
import { format, addDays, subDays, isBefore, isSameDay, startOfDay } from 'date-fns';
import { useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next'; // Added i18n support

const TaskDashboard = () => {
    const { t: translate } = useTranslation(); // Enable translations
    const {
        tasks,
        addTask,
        toggleTask,
        deleteTask,
        updateTask,
        isDayLocked,
        currentDateStr,
        rescheduleTask
    } = useTasks();

    const location = useLocation();
    const navigate = useNavigate();

    // Dropdown State
    const [menuOpen, setMenuOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const menuRef = useRef(null);

    // Close menu on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        if (menuOpen) document.addEventListener('click', handleClick, true);
        return () => document.removeEventListener('click', handleClick, true);
    }, [menuOpen]);

    // Date Logic
    const [selectedDate, setSelectedDate] = useState(() => {
        return location.state?.initialDate ? new Date(location.state.initialDate) : new Date();
    });
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    const isToday = isSameDay(selectedDate, new Date());
    const isPastDate = isBefore(startOfDay(selectedDate), startOfDay(new Date()));
    const isLocked = isDayLocked(selectedDateStr);

    // Filter Tasks
    const currentTasks = tasks.filter(taskItem => taskItem.date === selectedDateStr);

    // Stats
    const totalCurrent = currentTasks.length;
    const completedCurrent = currentTasks.filter(taskItem => taskItem.status === 'completed' || taskItem.isCompleted).length;

    // Filter Pending from Previous Days (Relative to Selected Date)
    // "Carried Over" means tasks that should have been done BEFORE the selected date
    const pendingTasks = tasks.filter(taskItem => {
        return taskItem.status !== 'completed' &&
            !taskItem.isCompleted &&
            taskItem.date &&
            isBefore(startOfDay(new Date(taskItem.date)), startOfDay(selectedDate));
    });

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleAddTask = async (title, options) => {
        try {
            await addTask(title, {
                ...options,
                date: options.date || selectedDateStr // Use modal date or fallback to selected
            });
            setIsModalOpen(false);
        } catch (error) {
            console.error("Failed to add task from dashboard:", error);
            // detailed error handled in context, but we keep modal open so user doesn't lose data
            alert(`Failed to add task: ${error.message}`);
        }
    };

    const navigateDate = (direction) => {
        if (direction === 'prev') setSelectedDate(d => subDays(d, 1));
        if (direction === 'next') setSelectedDate(d => addDays(d, 1));
    };

    const handleReschedule = (taskId, newDateStr = 'today') => {
        const targetDate = newDateStr === 'today' ? selectedDateStr : newDateStr;
        rescheduleTask(taskId, targetDate);
    };

    // Derived State for Action Button
    // If we are viewing future/today, allow adding. If locked past, no adding.
    const canAddTask = !isLocked && !isPastDate;

    // Picker State
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    return (
        <div className="space-y-6 pb-24 h-full relative">
            {/* ── TODO HEADER BAR ── */}
            <div className="rounded-2xl overflow-visible bg-white dark:bg-gradient-to-br dark:from-[#141b27] dark:to-[#111827] border border-slate-200 dark:border-white/[0.07] shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative mt-2 shrink-0 transition-colors">
                {/* Top highlight line (dark mode only) */}
                <div className="absolute top-0 left-0 right-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-sky-400/25 to-transparent hidden dark:block" />

                <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3">
                    {/* ‹ Prev */}
                    <button
                        onClick={() => navigateDate('prev')}
                        className="w-[44px] h-[44px] rounded-[12px] border border-slate-200 dark:border-white/[0.07] bg-slate-50 dark:bg-white/[0.04] text-slate-500 dark:text-white/40 flex items-center justify-center shrink-0 hover:bg-slate-100 dark:hover:bg-white/[0.09] hover:text-slate-700 dark:hover:text-white/80 active:bg-slate-200 dark:active:bg-white/[0.15] transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    {/* ── Date Center ── */}
                    <div
                        className="flex-1 flex items-center justify-center gap-2 min-w-0 cursor-pointer relative group/picker"
                    >
                        {/* Hidden Date Input for Picking */}
                        <input
                            type="date"
                            value={selectedDateStr}
                            onChange={(e) => setSelectedDate(new Date(e.target.value))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                        />
                        <CalendarIcon className="w-5 h-5 text-indigo-500 dark:text-sky-400 shrink-0" />
                        <span className="text-base font-bold text-slate-800 dark:text-white/90 tracking-wide whitespace-nowrap">
                            {format(selectedDate, 'MMM do')}
                        </span>
                        <div className="w-px h-5 bg-slate-200 dark:bg-white/[0.12] shrink-0" />
                        {isToday ? (
                            <div className="flex items-center gap-1.5 z-10 pointer-events-none">
                                <div className="w-2 h-2 bg-indigo-500 dark:bg-sky-400 rounded-full shadow-[0_0_8px_2px_rgba(99,102,241,0.2)] dark:shadow-[0_0_8px_2px_rgba(56,189,248,0.2)] animate-pulse" />
                                <span className="font-mono text-xs font-bold tracking-[0.07em] text-indigo-600 dark:text-sky-400 whitespace-nowrap">
                                    TODAY
                                </span>
                            </div>
                        ) : (
                            <button
                                onClick={(e) => { e.stopPropagation(); setSelectedDate(new Date()); }}
                                className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-400/[0.08] border border-indigo-100 dark:border-indigo-400/20 hover:bg-indigo-100 dark:hover:bg-indigo-400/[0.15] transition-all z-30"
                            >
                                <div className="w-2 h-2 bg-indigo-500 dark:bg-indigo-400 rounded-full" />
                                <span className="font-mono text-xs font-bold tracking-[0.07em] text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                                    TODAY ↩
                                </span>
                            </button>
                        )}
                    </div>

                    {/* › Next */}
                    <button
                        onClick={() => navigateDate('next')}
                        className="w-[44px] h-[44px] rounded-[12px] border border-slate-200 dark:border-white/[0.07] bg-slate-50 dark:bg-white/[0.04] text-slate-500 dark:text-white/40 flex items-center justify-center shrink-0 hover:bg-slate-100 dark:hover:bg-white/[0.09] hover:text-slate-700 dark:hover:text-white/80 active:bg-slate-200 dark:active:bg-white/[0.15] transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>

                    {/* Vertical Divider */}
                    <div className="w-px h-[36px] bg-slate-200 dark:bg-white/[0.07] shrink-0 hidden md:block" />

                    {/* ＋ ADD TASK & MORE OPTIONS */}
                    <div className="flex items-center gap-2 shrink-0">
                        {canAddTask ? (
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="flex flex-col items-center justify-center h-[44px] w-[60px] rounded-[12px] border border-dashed border-indigo-200 dark:border-sky-400/25 bg-indigo-50/50 dark:bg-sky-400/[0.05] text-indigo-600 dark:text-sky-400/80 hover:bg-indigo-50 dark:hover:bg-sky-400/[0.12] hover:border-indigo-300 dark:hover:border-sky-400/50 hover:text-indigo-700 dark:focus:border-solid hover:border-solid active:bg-indigo-100 dark:active:bg-sky-400/20 transition-colors"
                            >
                                <Plus className="w-4 h-4 mb-0.5" />
                                <span className="font-mono text-[9px] font-bold tracking-[0.05em] uppercase">Task</span>
                            </button>
                        ) : (
                            <div className="w-[60px]" />
                        )}

                        {/* ··· More Menu */}
                        <div className="relative shrink-0" ref={menuRef}>
                            <button
                                onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                                className={clsx(
                                    "flex flex-col items-center justify-center h-[44px] w-[60px] rounded-[12px] border border-slate-200 dark:border-white/[0.07] bg-slate-50 dark:bg-white/[0.04] text-slate-500 dark:text-white/60 hover:bg-slate-100 dark:hover:bg-white/[0.09] hover:text-slate-700 dark:hover:text-white/90 active:bg-slate-200 dark:active:bg-white/[0.15] transition-colors",
                                    menuOpen && "bg-slate-200 dark:bg-white/[0.09] text-slate-800 dark:text-white/90 border-slate-300 dark:border-white/[0.15]"
                                )}
                            >
                                <MoreHorizontal className="w-4 h-4 mb-0.5" />
                                <span className="font-mono text-[9px] font-bold tracking-[0.05em] uppercase">More</span>
                            </button>

                            {/* Dropdown */}
                            <div
                                className={clsx(
                                    "absolute top-[calc(100%+8px)] right-0 bg-white dark:bg-[#16202f] border border-slate-200 dark:border-white/[0.09] rounded-[14px] p-1.5 flex flex-col gap-0.5 min-w-[180px] shadow-xl dark:shadow-[0_20px_48px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.03)] z-[200] origin-top-right transition-all duration-200",
                                    menuOpen
                                        ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                                        : "opacity-0 scale-[0.96] -translate-y-1.5 pointer-events-none"
                                )}
                            >
                                {/* Tasks Section */}
                                <div className="font-mono text-[9px] text-slate-400 dark:text-white/20 tracking-[0.1em] uppercase px-2.5 pt-1.5 pb-1">{translate('home.tasks', 'Tasks')}</div>
                                <button
                                    onClick={() => { setMenuOpen(false); /* future edit */ }}
                                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-[9px] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-600 dark:text-white/60 hover:text-indigo-600 dark:hover:text-white transition-colors text-left w-full text-[12px] font-semibold"
                                >
                                    <div className="w-[22px] h-[22px] rounded-[7px] flex items-center justify-center shrink-0 bg-amber-400/10">
                                        <Edit2 className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                                    </div>
                                    Edit Tasks
                                </button>
                                <button
                                    onClick={() => { setMenuOpen(false); /* future sort */ }}
                                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-[9px] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-600 dark:text-white/60 hover:text-indigo-600 dark:hover:text-white transition-colors text-left w-full text-[12px] font-semibold"
                                >
                                    <div className="w-[22px] h-[22px] rounded-[7px] flex items-center justify-center shrink-0 bg-indigo-500/10 dark:bg-indigo-400/10">
                                        <ArrowUpDown className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                                    </div>
                                    Sort
                                </button>
                                
                                <div className="h-px bg-slate-100 dark:bg-white/[0.06] mx-1.5 my-1" />
                                
                                {/* View Section */}
                                <div className="font-mono text-[9px] text-slate-400 dark:text-white/20 tracking-[0.1em] uppercase px-2.5 pt-1.5 pb-1">View</div>
                                <button
                                    onClick={() => { navigate('/workspace/filter/all'); setMenuOpen(false); }}
                                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-[9px] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-600 dark:text-white/60 hover:text-indigo-600 dark:hover:text-white transition-colors text-left w-full text-[12px] font-semibold"
                                >
                                    <div className="w-[22px] h-[22px] rounded-[7px] flex items-center justify-center shrink-0 bg-sky-500/10 dark:bg-sky-400/10">
                                        <ListTodo className="w-3 h-3 text-sky-500 dark:text-sky-400" />
                                    </div>
                                    Active Tasks
                                </button>
                                <button
                                    onClick={() => { navigate('/workspace/calendar'); setMenuOpen(false); }}
                                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-[9px] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-600 dark:text-white/60 hover:text-indigo-600 dark:hover:text-white transition-colors text-left w-full text-[12px] font-semibold"
                                >
                                    <div className="w-[22px] h-[22px] rounded-[7px] flex items-center justify-center shrink-0 bg-blue-500/10 dark:bg-blue-400/10">
                                        <CalendarIcon className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                                    </div>
                                    Calendar View
                                </button>
                                <button
                                    onClick={() => { navigate('/workspace/overview'); setMenuOpen(false); }}
                                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-[9px] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-600 dark:text-white/60 hover:text-indigo-600 dark:hover:text-white transition-colors text-left w-full text-[12px] font-semibold"
                                >
                                    <div className="w-[22px] h-[22px] rounded-[7px] flex items-center justify-center shrink-0 bg-purple-500/10 dark:bg-purple-400/10">
                                        <Layout className="w-3 h-3 text-purple-500 dark:text-purple-400" />
                                    </div>
                                    Weekly Overview
                                </button>
                                <button
                                    onClick={() => { navigate('/workspace/recent'); setMenuOpen(false); }}
                                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-[9px] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-600 dark:text-white/60 hover:text-indigo-600 dark:hover:text-white transition-colors text-left w-full text-[12px] font-semibold"
                                >
                                    <div className="w-[22px] h-[22px] rounded-[7px] flex items-center justify-center shrink-0 bg-emerald-500/10 dark:bg-emerald-400/10">
                                        <Clock className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                                    </div>
                                    Recent Tasks
                                </button>
                                
                                <div className="h-px bg-slate-100 dark:bg-white/[0.06] mx-1.5 my-1" />
                                
                                {/* Options Section */}
                                <div className="font-mono text-[9px] text-slate-400 dark:text-white/20 tracking-[0.1em] uppercase px-2.5 pt-1.5 pb-1">Options</div>
                                <button
                                    onClick={() => { setIsSettingsOpen(true); setMenuOpen(false); }}
                                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-[9px] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-600 dark:text-white/60 hover:text-indigo-600 dark:hover:text-white transition-colors text-left w-full text-[12px] font-semibold"
                                >
                                    <div className="w-[22px] h-[22px] rounded-[7px] flex items-center justify-center shrink-0 bg-slate-500/10 dark:bg-slate-400/10">
                                        <Settings className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                                    </div>
                                    Task Settings
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Past-day ribbon ── */}
                {!isToday && (
                    <div className="flex items-center justify-between px-5 py-2.5 bg-slate-50 dark:bg-indigo-950/40 border-t border-slate-100 dark:border-white/[0.05] text-[11px] rounded-b-2xl">
                        <span className="font-mono font-bold text-slate-500 dark:text-indigo-300/80 tracking-[0.06em]">
                            VIEWING {format(selectedDate, 'MMMM do, yyyy').toUpperCase()}
                        </span>
                        <button
                            onClick={() => setSelectedDate(new Date())}
                            className="font-mono font-bold text-indigo-500 dark:text-white/40 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors tracking-wide uppercase"
                        >
                            tap TODAY to return →
                        </button>
                    </div>
                )}
            </div>

            {/* Task Lists */}
            <div className="space-y-8">
                {/* 1. Current Day Tasks */}
                <section>
                    {currentTasks.length > 0 ? (
                        <TaskList
                            tasks={currentTasks}
                            onToggle={toggleTask}
                            onDelete={deleteTask}
                            onUpdate={updateTask}
                            isLocked={isLocked}
                            onReschedule={handleReschedule}
                        />
                    ) : (
                        <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                            <CalendarIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                No tasks scheduled for {isToday ? 'today' : 'this day'}.
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                Add tasks only if they support your routine.
                            </p>
                        </div>
                    )}
                </section>

                {/* 2. Carry Over Section (Pending relative to Selected Date) - Moved to Bottom */}
                {pendingTasks.length > 0 && (
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                Carried Over Tasks
                            </h3>
                            <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
                        </div>
                        <div className="opacity-80">
                            <TaskList
                                tasks={pendingTasks}
                                onToggle={toggleTask}
                                onDelete={deleteTask}
                                onUpdate={updateTask}
                                isLocked={false}
                                onReschedule={handleReschedule}
                                isVariant="carry_over"
                            />
                        </div>
                    </section>
                )}
            </div>

            {/* Modal */}
            <AddTaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onAdd={handleAddTask}
                initialDate={selectedDateStr}
            />
        </div>
    );
};

export default TaskDashboard;
