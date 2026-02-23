import { useState, useRef, useEffect } from 'react';
import { format, addMonths, subMonths, isSameDay, isSameMonth, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isBefore, startOfDay } from 'date-fns';
import { ChevronUp, ChevronDown, Calendar as CalendarIcon, X, ChevronDown as ChevronDownIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

const DatePicker = ({ selectedDate, onChange, minDate, onClose, className }) => {
    const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate || new Date()));
    const today = new Date();

    const generateDays = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        return eachDayOfInterval({
            start: startDate,
            end: endDate
        });
    };

    const days = generateDays();
    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    const handleDateClick = (day) => {
        if (minDate && isBefore(day, startOfDay(new Date(minDate)))) return;
        onChange(day);
        onClose();
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className={clsx(
                "bg-white dark:bg-slate-900 rounded-2xl shadow-xl ring-1 ring-slate-900/10 dark:ring-slate-800 p-4 w-[280px] select-none font-sans",
                className
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-5 px-1">
                <div className="flex items-center gap-1.5 cursor-pointer group/month transition-colors">
                    <span className="text-[15px] font-bold text-slate-900 dark:text-white group-hover/month:text-indigo-600 transition-colors">
                        {format(currentMonth, 'MMMM, yyyy')}
                    </span>
                    <ChevronDownIcon className="w-3.5 h-3.5 text-slate-400 group-hover/month:text-indigo-500 transition-colors" />
                </div>

                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-0.5 border border-slate-100 dark:border-slate-800">
                    <button
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all active:bg-slate-100 dark:active:bg-slate-600"
                    >
                        <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                    <button
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all active:bg-slate-100 dark:active:bg-slate-600"
                    >
                        <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-y-2 mb-2">
                {weekDays.map(day => (
                    <div key={day} className="text-center text-[10px] font-semibold text-slate-400">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-y-1 gap-x-1">
                {days.map((day, idx) => {
                    const isDisabled = minDate && isBefore(day, startOfDay(new Date(minDate)));
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isTodayDate = isSameDay(day, today);

                    return (
                        <button
                            key={idx}
                            onClick={() => !isDisabled && handleDateClick(day)}
                            disabled={isDisabled}
                            className={clsx(
                                "h-8 w-8 rounded-lg flex items-center justify-center text-xs transition-all relative font-semibold",
                                isDisabled && "opacity-20 cursor-not-allowed",
                                !isDisabled && isSelected && "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 z-10",
                                !isDisabled && !isSelected && isCurrentMonth && "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:rounded-lg",
                                !isDisabled && !isSelected && !isCurrentMonth && "text-slate-300 dark:text-slate-600",
                                isTodayDate && !isSelected && "text-indigo-600 font-bold bg-indigo-50 dark:bg-indigo-900/20",
                            )}
                        >
                            {format(day, 'd')}
                        </button>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                    onClick={() => {
                        onChange(null);
                        onClose();
                    }}
                    className="text-[11px] font-bold text-slate-400 hover:text-red-500 transition-colors px-2 py-1"
                >
                    Clear
                </button>
                <button
                    onClick={() => {
                        const now = new Date();
                        onChange(now);
                        setCurrentMonth(now);
                        onClose();
                    }}
                    className="text-[11px] font-bold text-indigo-600 hover:underline transition-all"
                >
                    Today
                </button>
            </div>
        </motion.div>
    );
};

export default DatePicker;
