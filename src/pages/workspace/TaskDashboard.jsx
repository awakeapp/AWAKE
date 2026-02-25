import { useState, useEffect, useRef, useMemo } from 'react';
import { Clock, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, AlertCircle, X, MoreHorizontal, ArrowUpDown, ListTodo, Layout, Settings, Edit2 } from 'lucide-react';
import { useTasks } from '../../context/TaskContext';
import TaskList from '../../components/organisms/workspace/TaskList';
import AddTaskModal from '../../components/molecules/workspace/AddTaskModal';
import EditTaskModal from '../../components/molecules/workspace/EditTaskModal';
import TaskSettingsModal from '../../components/molecules/workspace/TaskSettingsModal';
import { format, addDays, subDays, isBefore, isSameDay, startOfDay } from 'date-fns';
import { useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import DateHeader from '../../components/organisms/DateHeader';

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

 // Edit Task State
 const [isEditModalOpen, setIsEditModalOpen] = useState(false);
 const [editingTask, setEditingTask] = useState(null);

 // Sorting State
 const [sortMode, setSortMode] = useState(() => {
 return localStorage.getItem('awake_task_sort') || 'default';
 });

 const handleSortChange = (mode) => {
 setSortMode(mode);
 localStorage.setItem('awake_task_sort', mode);
 };

 // Filter & Sort Tasks
 const currentTasks = useMemo(() => {
 const filtered = tasks.filter(taskItem => taskItem.date === selectedDateStr);
 let sorted = [...filtered];

 switch (sortMode) {
 case 'category':
 sorted.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
 break;
 case 'priority':
 const pOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
 sorted.sort((a, b) => (pOrder[a.priority] || 4) - (pOrder[b.priority] || 4));
 break;
 case 'date':
 sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
 break;
 case 'time':
 sorted.sort((a, b) => {
 if (!a.time) return 1;
 if (!b.time) return -1;
 return a.time.localeCompare(b.time);
 });
 break;
 case 'default':
 default:
 // Default is handled by backend order or createdAt if we want to ensure it
 sorted.sort((a, b) => b.createdAt - a.createdAt);
 break;
 }
 return sorted;
 }, [tasks, selectedDateStr, sortMode]);

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
 <div className="pb-24 h-full relative" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 92px)' }}>
 {/* ── FIXED TODO HEADER BAR ── */}
 <div 
 className="fixed top-0 left-0 right-0 z-40 bg-slate-50/90 dark:bg-[#020617]/90 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 transition-all duration-300"
 style={{
 paddingTop: 'calc(env(safe-area-inset-top) + 4px)',
 paddingBottom: '8px'
 }}
 >
 <div className="max-w-md mx-auto w-full px-4">
 <DateHeader 
 allowFuture={true}
 dateStateOverride={{
 currentDate: selectedDate,
 isToday,
 prevDay: () => navigateDate('prev'),
 nextDay: () => navigateDate('next'),
 jumpToToday: (d) => setSelectedDate(d || new Date())
 }}
 rightNode={
 <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 pl-1">
 {/* Add Task Button */}
 {canAddTask && (
 <button
 onClick={() => setIsModalOpen(true)}
 className="flex flex-col items-center justify-center p-1 sm:p-2 text-indigo-600 dark:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all group"
 >
 <Plus className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.5]" />
 <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mt-0.5 group-hover:text-indigo-700">Add Task</span>
 </button>
 )}
 
 {/* More Menu */}
 <div className="relative shrink-0" ref={menuRef}>
 <button
 onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
 className={clsx(
 "flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 transition-all ",
 menuOpen && "bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white"
 )}
 >
 <MoreHorizontal className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
 </button>

 {/* Dropdown */}
 <div
 className={clsx(
 "absolute top-[calc(100%+8px)] right-0 bg-white dark:bg-[#16202f] border border-slate-200 dark:border-white/[0.09] rounded-[20px] p-2.5 flex flex-col gap-1 min-w-[260px] shadow-2xl dark:shadow-[0_24px_54px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.03)] z-[200] origin-top-right transition-all duration-200",
 menuOpen
 ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
 : "opacity-0 scale-[0.96] -translate-y-1.5 pointer-events-none"
 )}
 >
 <div className="font-mono text-[11px] text-slate-400 dark:text-white/20 tracking-[0.1em] uppercase px-3.5 pt-2 pb-1.5 flex items-center h-4">Actions</div>
 <button
 onClick={() => {
 const modes = ['default', 'category', 'priority', 'time'];
 const nextMode = modes[(modes.indexOf(sortMode) + 1) % modes.length];
 handleSortChange(nextMode);
 }}
 className="flex items-center gap-3 px-3.5 py-3 rounded-[12px] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-600 dark:text-white/60 hover:text-indigo-600 dark:hover:text-white transition-colors text-left w-full text-[15px] font-semibold"
 >
 <div className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center shrink-0 bg-indigo-500/10 dark:bg-indigo-400/10">
 <ArrowUpDown className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
 </div>
 <div className="flex-1 flex justify-between items-center pr-1">
 <span>Sort</span>
 <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">{sortMode}</span>
 </div>
 </button>
 <div className="h-px bg-slate-100 dark:bg-white/[0.06] mx-2 my-1" />
 
 {/* View Section */}
 <div className="font-mono text-[11px] text-slate-400 dark:text-white/20 tracking-[0.1em] uppercase px-3.5 pt-2 pb-1.5 flex items-center h-4">View</div>
 <button
 onClick={() => { navigate('/workspace/filter/all'); setMenuOpen(false); }}
 className="flex items-center gap-3 px-3.5 py-3 rounded-[12px] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-600 dark:text-white/60 hover:text-indigo-600 dark:hover:text-white transition-colors text-left w-full text-[15px] font-semibold"
 >
 <div className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center shrink-0 bg-sky-500/10 dark:bg-sky-400/10">
 <ListTodo className="w-4 h-4 text-sky-500 dark:text-sky-400" />
 </div>
 Active Tasks
 </button>
 <button
 onClick={() => { navigate('/workspace/calendar'); setMenuOpen(false); }}
 className="flex items-center gap-3 px-3.5 py-3 rounded-[12px] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-600 dark:text-white/60 hover:text-indigo-600 dark:hover:text-white transition-colors text-left w-full text-[15px] font-semibold"
 >
 <div className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center shrink-0 bg-blue-500/10 dark:bg-blue-400/10">
 <CalendarIcon className="w-4 h-4 text-blue-500 dark:text-blue-400" />
 </div>
 Calendar View
 </button>
 <button
 onClick={() => { navigate('/workspace/overview'); setMenuOpen(false); }}
 className="flex items-center gap-3 px-3.5 py-3 rounded-[12px] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-600 dark:text-white/60 hover:text-indigo-600 dark:hover:text-white transition-colors text-left w-full text-[15px] font-semibold"
 >
 <div className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center shrink-0 bg-purple-500/10 dark:bg-purple-400/10">
 <Layout className="w-4 h-4 text-purple-500 dark:text-purple-400" />
 </div>
 Weekly Overview
 </button>
 <button
 onClick={() => { navigate('/workspace/filter/recent'); setMenuOpen(false); }}
 className="flex items-center gap-3 px-3.5 py-3 rounded-[12px] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-600 dark:text-white/60 hover:text-indigo-600 dark:hover:text-white transition-colors text-left w-full text-[15px] font-semibold"
 >
 <div className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center shrink-0 bg-emerald-500/10 dark:bg-emerald-400/10">
 <Clock className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
 </div>
 Recent Tasks
 </button>
 
 <div className="h-px bg-slate-100 dark:bg-white/[0.06] mx-2 my-1" />
 
 {/* Options Section */}
 <div className="font-mono text-[11px] text-slate-400 dark:text-white/20 tracking-[0.1em] uppercase px-3.5 pt-2 pb-1.5 flex items-center h-4">Options</div>
 <button
 onClick={() => { setIsSettingsOpen(true); setMenuOpen(false); }}
 className="flex items-center gap-3 px-3.5 py-3 rounded-[12px] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-600 dark:text-white/60 hover:text-indigo-600 dark:hover:text-white transition-colors text-left w-full text-[15px] font-semibold"
 >
 <div className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center shrink-0 bg-slate-500/10 dark:bg-slate-400/10">
 <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400" />
 </div>
 Task Settings
 </button>
 </div>
 </div>
 </div>
 }
 />
 </div>
 </div>

 {/* Task Lists */}
 <div className="space-y-6 max-w-md mx-auto w-full px-4">
 {/* 1. Current Day Tasks */}
 <section>
 {currentTasks.length > 0 ? (
 <TaskList
 tasks={currentTasks}
 onToggle={toggleTask}
 onDelete={deleteTask}
 onUpdate={updateTask}
 onEdit={(task) => {
 setEditingTask(task);
 setIsEditModalOpen(true);
 }}
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
 onEdit={(task) => {
 setEditingTask(task);
 setIsEditModalOpen(true);
 }}
 isLocked={false}
 onReschedule={handleReschedule}
 isVariant="carry_over"
 />
 </div>
 </section>
 )}
 </div>

 {/* Modals */}
 <AddTaskModal
 isOpen={isModalOpen}
 onClose={() => setIsModalOpen(false)}
 onAdd={handleAddTask}
 initialDate={selectedDateStr}
 />

 <EditTaskModal
 isOpen={isEditModalOpen}
 onClose={() => {
 setIsEditModalOpen(false);
 setEditingTask(null);
 }}
 task={editingTask}
 />

 <TaskSettingsModal 
 isOpen={isSettingsOpen} 
 onClose={() => setIsSettingsOpen(false)} 
 />
 </div>
 );
};

export default TaskDashboard;
