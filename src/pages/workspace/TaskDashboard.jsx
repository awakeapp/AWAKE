import { useState, useEffect } from 'react';
import { Clock, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, AlertCircle, X } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import TaskList from '../../components/organisms/workspace/TaskList';
import AddTaskModal from '../../components/molecules/workspace/AddTaskModal';
import { format, addDays, subDays, isBefore, isSameDay, startOfDay } from 'date-fns';
import { useLocation } from 'react-router-dom';
import clsx from 'clsx';

const TaskDashboard = () => {
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

    // Date Logic
    const [selectedDate, setSelectedDate] = useState(() => {
        return location.state?.initialDate ? new Date(location.state.initialDate) : new Date();
    });
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    const isToday = isSameDay(selectedDate, new Date());
    const isPastDate = isBefore(startOfDay(selectedDate), startOfDay(new Date()));
    const isLocked = isDayLocked(selectedDateStr);

    // Filter Tasks
    const currentTasks = tasks.filter(t => t.date === selectedDateStr);

    // Stats
    const totalCurrent = currentTasks.length;
    const completedCurrent = currentTasks.filter(t => t.status === 'completed' || t.isCompleted).length;

    // Filter Pending from Previous Days (Relative to Selected Date)
    // "Carried Over" means tasks that should have been done BEFORE the selected date
    const pendingTasks = tasks.filter(t => {
        return t.status !== 'completed' &&
            !t.isCompleted &&
            t.date &&
            isBefore(startOfDay(new Date(t.date)), startOfDay(selectedDate));
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
            {/* Header Section - Calm & Neutral */}
            <div className="flex flex-col gap-4">
                {/* Header Section Removed (Merged with DateNav) */}

                {/* Date Navigation */}
                {/* Date Navigation - Premium & Functional */}
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-2xl p-2 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute inset-0 bg-indigo-50/30 dark:bg-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                    <button
                        onClick={() => navigateDate('prev')}
                        className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95 z-10"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="flex flex-row items-center gap-1.5 sm:gap-4 relative z-10 cursor-pointer group/picker py-1">
                        {/* Hidden Date Input for Picking */}
                        <input
                            type="date"
                            value={selectedDateStr}
                            onChange={(e) => setSelectedDate(new Date(e.target.value))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                        />

                        <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg group-hover/picker:bg-slate-50 dark:group-hover/picker:bg-slate-800 transition-colors">
                            <CalendarIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500 opacity-60 group-hover/picker:opacity-100 transition-opacity" />
                            {/* Mobile Date (Short) */}
                            <span className={clsx(
                                "text-sm font-bold tracking-tight whitespace-nowrap sm:hidden",
                                isToday ? "text-indigo-900 dark:text-indigo-100" : "text-slate-700 dark:text-slate-200"
                            )}>
                                {format(selectedDate, 'MMM do')}
                            </span>
                            {/* Desktop Date (Full) */}
                            <span className={clsx(
                                "text-sm font-bold tracking-tight whitespace-nowrap hidden sm:block",
                                isToday ? "text-indigo-900 dark:text-indigo-100" : "text-slate-700 dark:text-slate-200"
                            )}>
                                {format(selectedDate, 'MMMM do, yyyy')}
                            </span>
                        </div>

                        {/* Divider */}
                        <div className="w-px h-3 sm:h-4 bg-slate-200 dark:bg-slate-700" />

                        {isToday ? (
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/80 whitespace-nowrap">
                                    Today
                                </span>
                            </div>
                        ) : (
                            <div className='flex items-center gap-2 pointer-events-none'>
                                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider hidden sm:block">
                                    {format(selectedDate, 'EEEE')}
                                </span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation(); // Prevent picker opening if clicking this explicitly
                                        setSelectedDate(new Date());
                                    }}
                                    className="pointer-events-auto text-[10px] font-bold text-indigo-500 hover:text-indigo-600 hover:underline z-30 whitespace-nowrap"
                                >
                                    BACK TO TODAY
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => navigateDate('next')}
                        className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95 z-10"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Quick Add Button */}
            {canAddTask && (
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full py-3 px-4 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-400 dark:text-slate-500 text-sm font-medium hover:border-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add Task via Modal
                </button>
            )}

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
