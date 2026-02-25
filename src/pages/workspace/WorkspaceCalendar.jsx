import { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Circle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useTasks } from '../../context/TaskContext';

const WorkspaceCalendar = () => {
 const navigate = useNavigate();
 const { tasks } = useTasks();
 const [currentMonth, setCurrentMonth] = useState(new Date());

 const onDateClick = (day) => {
 navigate('/workspace', { state: { initialDate: day } });
 };

 const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
 const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

 const monthStart = startOfMonth(currentMonth);
 const monthEnd = endOfMonth(monthStart);
 const startDate = startOfWeek(monthStart);
 const endDate = endOfWeek(monthEnd);

 const dateFormat = "d";
 const days = [];
 const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

 const dayList = eachDayOfInterval({
 start: startDate,
 end: endDate
 });

 // Helper to get task status color for a day
 const getDayStatus = (day) => {
 const dateStr = format(day, 'yyyy-MM-dd');
 const dayTasks = tasks.filter(t => t.date === dateStr);
 if (dayTasks.length === 0) return null;

 const allCompleted = dayTasks.every(t => t.status === 'completed' || t.isCompleted);
 if (allCompleted) return 'bg-emerald-500';

 // Check for missed? Or just show pending indication
 return 'bg-indigo-500';
 };

 return (
 <div className="space-y-6 max-w-md mx-auto w-full px-4">
 {/* Header */}
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-3">
 <button
 onClick={() => navigate(-1)}
 className="p-2 bg-transparent hover:bg-slate-100 dark:bg-transparent dark:hover:bg-slate-800 rounded-full transition-colors text-slate-700 dark:text-slate-300 -ml-2 focus:outline-none"
 >
 <ArrowLeft className="w-6 h-6" />
 </button>
 <h2 className="text-2xl font-bold text-slate-900 dark:text-white capitalize leading-tight">
 {format(currentMonth, 'MMMM yyyy')}
 </h2>
 </div>
 <div className="flex items-center gap-2">
 <button onClick={prevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
 <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
 </button>
 <button onClick={nextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
 <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
 </button>
 </div>
 </div>

 {/* Calendar Grid */}
 <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
 {/* Week Days */}
 <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
 {weekDays.map(day => (
 <div key={day} className="py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
 {day}
 </div>
 ))}
 </div>

 {/* Days */}
 <div className="grid grid-cols-7">
 {dayList.map((day, i) => {
 const isSelectedMonth = isSameMonth(day, monthStart);
 const isToday = isSameDay(day, new Date());
 const statusColor = getDayStatus(day);

 return (
 <div
 key={day.toString()}
 className={`
 min-h-[80px] border-b border-r border-slate-100 dark:border-slate-800 p-2 relative cursor-pointer transition-colors
 ${!isSelectedMonth ? 'bg-slate-50/50 dark:bg-slate-900/50 text-slate-400' : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'}
 ${i % 7 === 6 ? 'border-r-0' : ''}
 `}
 onClick={() => onDateClick(day)}
 >
 <span className={`
 text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
 ${isToday ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-700 dark:text-slate-300'}
 `}>
 {format(day, dateFormat)}
 </span>

 {/* Dots for tasks */}
 {statusColor && (
 <div className="absolute bottom-2 right-2 flex justify-end">
 <div className={`w-2 h-2 rounded-full ${statusColor}`} />
 </div>
 )}
 </div>
 );
 })}
 </div>
 </div>
 </div>
 );
};

export default WorkspaceCalendar;
