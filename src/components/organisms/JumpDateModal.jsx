import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useDate } from '../../context/DateContext';
import Button from '../atoms/Button';

import { useScrollLock } from '../../hooks/useScrollLock';

const JumpDateModal = ({ isOpen, onClose, initialDate, onSelect, minDate }) => {
    useScrollLock(isOpen);
    const { currentDate, setDate } = useDate();

    // Use provided initialDate or fallback to global currentDate
    const baseDate = initialDate || currentDate;

    // Internal state for the selection before confirming
    const [selectedDate, setSelectedDate] = useState(new Date(baseDate));
    const [view, setView] = useState('day'); // 'day', 'month', 'year'

    // Reset selection when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedDate(new Date(baseDate));
            setView('day');
        }
    }, [isOpen, baseDate]);

    const handleJump = () => {
        if (onSelect) {
            onSelect(selectedDate);
        } else {
            setDate(selectedDate);
        }
        onClose();
    };

    const handleClear = () => {
        if (onSelect) {
            onSelect(null);
        }
        onClose();
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isFuture = (d) => d > today;
    
    // Check if date is before minDate (ignores time)
    const isBeforeMin = (d) => {
        if (!minDate) return false;
        const min = new Date(minDate);
        min.setHours(0, 0, 0, 0);
        return d < min;
    };
    
    // Check if date is disabled (either future if no onSelect/minDate, or strictly before minDate)
    const isDisabledDate = (d) => {
        // If we have an onSelect, it means we are picking a generic date (like a task due date).
        // In this mode, future dates are ALLOWED, but past dates might be restricted by `minDate`.
        if (onSelect) {
            return isBeforeMin(d);
        }
        // If NO onSelect, it means we are jumping global app time. Future is NOT allowed.
        return isFuture(d);
    };

    // --- Calendar Logic ---
    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const generateCalendar = () => {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
        const totalDays = daysInMonth(year, month);
        const startDay = firstDayOfMonth(year, month);

        const days = [];
        // Empty slots
        for (let i = 0; i < startDay; i++) days.push(null);
        // Days
        for (let i = 1; i <= totalDays; i++) days.push(new Date(year, month, i));

        return days;
    };

    const changeMonth = (increment) => {
        const newDate = new Date(selectedDate);
        newDate.setMonth(newDate.getMonth() + increment);
        setSelectedDate(newDate);
    };

    const changeYear = (year) => {
        const newDate = new Date(selectedDate);
        newDate.setFullYear(year);
        // Handle overflow (e.g., Feb 29 -> Feb 28 in non-leap)
        if (newDate.getMonth() !== selectedDate.getMonth()) {
            newDate.setDate(0);
        }
        setSelectedDate(newDate);
        setView('day');
    };

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden dark:bg-slate-900 border dark:border-slate-800"
                    >
                        {/* Header */}
                        <div className="p-4 border-b dark:border-slate-800 flex items-center justify-between">
                            <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-indigo-500" />
                                Jump to Date
                            </h3>
                            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full dark:hover:bg-slate-800 transition-colors">
                                <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-4">
                            {/* Navigation Bar */}
                            <div className="flex items-center justify-between mb-4">
                                <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-slate-100 rounded-lg dark:hover:bg-slate-800">
                                    <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                </button>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setView('month')}
                                        className="font-bold text-slate-800 hover:bg-slate-100 px-2 py-1 rounded-md transition-colors dark:text-white dark:hover:bg-slate-800"
                                    >
                                        {selectedDate.toLocaleString('default', { month: 'long' })}
                                    </button>
                                    <button
                                        onClick={() => setView('year')}
                                        className="font-bold text-slate-800 hover:bg-slate-100 px-2 py-1 rounded-md transition-colors dark:text-white dark:hover:bg-slate-800"
                                    >
                                        {selectedDate.getFullYear()}
                                    </button>
                                </div>

                                <button
                                    onClick={() => changeMonth(1)}
                                    disabled={selectedDate.getMonth() === today.getMonth() && selectedDate.getFullYear() === today.getFullYear()}
                                    className="p-1 hover:bg-slate-100 rounded-lg dark:hover:bg-slate-800 disabled:opacity-30"
                                >
                                    <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                </button>
                            </div>

                            {/* Views */}
                            <div className="h-64 overflow-y-auto">
                                {view === 'day' && (
                                    <>
                                        <div className="grid grid-cols-7 mb-2 text-center text-xs font-bold text-slate-400">
                                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
                                        </div>
                                        <div className="grid grid-cols-7 gap-1">
                                            {generateCalendar().map((date, i) => (
                                                <div key={i} className="aspect-square flex items-center justify-center">
                                                    {date && (
                                                        <button
                                                            onClick={() => setSelectedDate(date)}
                                                            disabled={isDisabledDate(date)}
                                                            className={`
                                                                w-8 h-8 rounded-full text-sm font-medium transition-colors
                                                                ${date.getDate() === selectedDate.getDate() && date.getMonth() === selectedDate.getMonth()
                                                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                                                    : isDisabledDate(date)
                                                                        ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-50'
                                                                        : 'hover:bg-slate-100 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                                                                }
                                                            `}
                                                        >
                                                            {date.getDate()}
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {view === 'month' && (
                                    <div className="grid grid-cols-3 gap-2">
                                        {Array.from({ length: 12 }, (_, i) => new Date(0, i)).map((d, i) => (
                                            <button
                                                key={i}
                                                onClick={() => {
                                                    const newD = new Date(selectedDate);
                                                    newD.setMonth(i);
                                                    setSelectedDate(newD);
                                                    setView('day');
                                                }}
                                                className={`p-2 rounded-lg text-sm font-medium transition-colors ${selectedDate.getMonth() === i ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'hover:bg-slate-50 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                                            >
                                                {d.toLocaleString('default', { month: 'short' })}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {view === 'year' && (
                                    <div className="grid grid-cols-4 gap-2">
                                        {Array.from({ length: 10 }, (_, i) => today.getFullYear() - i).map((year) => (
                                            <button
                                                key={year}
                                                onClick={() => changeYear(year)}
                                                className={`p-2 rounded-lg text-sm font-medium transition-colors ${selectedDate.getFullYear() === year ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'hover:bg-slate-50 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                                            >
                                                {year}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-slate-50 border-t dark:bg-slate-900 dark:border-slate-800 flex justify-between items-center">
                            <div>
                                {onSelect && (
                                    <button
                                        onClick={handleClear}
                                        className="text-sm font-bold text-slate-400 hover:text-red-500 transition-colors px-2 py-1"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" onClick={onClose} className="dark:text-slate-400">Cancel</Button>
                                <Button onClick={handleJump}>{onSelect ? 'Save' : 'Jump'}</Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    // Render nothing if not in browser, else render to document.body
    if (typeof window === 'undefined') return null;
    return createPortal(modalContent, document.body);
};

export default JumpDateModal;
