import { ChevronLeft, ChevronRight, Edit2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { useDate } from '../../context/DateContext';
import { cn } from '../../lib/utils';
import JumpDateModal from './JumpDateModal';
import clsx from 'clsx';

const DateHeader = ({ className, showControls = true, overviewText, onEditClick, isLocked }) => {
    const { currentDate, isToday, prevDay, nextDay, jumpToToday } = useDate();
    const [isJumpModalOpen, setIsJumpModalOpen] = useState(false);

    // Date formatting logic
    const shortWeekday = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(currentDate);
    const displayDate = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
    }).format(currentDate);

    return (
        <div className={cn("relative flex items-center justify-between transition-all duration-150 min-h-[64px] py-1 gap-2", className)}>
            <JumpDateModal
                isOpen={isJumpModalOpen}
                onClose={() => setIsJumpModalOpen(false)}
            />

            {/* Left Block: Blinking Dot & Left-Aligned Date */}
            <div 
                className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer group hover:opacity-80 transition-opacity" 
                onClick={() => setIsJumpModalOpen(true)}
            >
                <div className={cn(
                    "w-2.5 h-2.5 rounded-full flex-shrink-0 flex items-center justify-center transition-all",
                    isToday 
                        ? "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)] animate-pulse" 
                        : "bg-slate-300 dark:bg-slate-600"
                )} />
                <div className="flex flex-col items-start min-w-0 overflow-hidden w-full">
                    <span className={cn(
                        "text-base sm:text-lg font-extrabold uppercase tracking-wide leading-none transition-colors truncate w-full",
                        isToday ? "text-indigo-600 dark:text-indigo-400" : "text-slate-800 dark:text-slate-100 group-hover:text-indigo-500"
                    )}>
                        {isToday ? 'TODAY' : shortWeekday}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1 leading-none truncate w-full block">
                        {displayDate}
                    </span>
                </div>
            </div>

            {/* Right Block: Counter, Go to Today, Controls, Edit */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                {/* Counter / Overview Text */}
                {overviewText && (
                    <div className="flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold tracking-wide px-2.5 py-1.5 rounded-xl min-w-[2.5rem] sm:min-w-[3rem]">
                        {overviewText}
                    </div>
                )}

                {/* Explicit Go to Today Button */}
                {!isToday && (
                    <button
                        onClick={jumpToToday}
                        className="flex items-center justify-center bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 sm:px-3 py-1.5 rounded-xl transition-colors active:scale-95 flex-shrink-0"
                    >
                        Today
                    </button>
                )}

                {/* Date Controls (Grouped arrows) */}
                {showControls && (
                    <div className="flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-0.5 flex-shrink-0">
                        <button
                            onClick={prevDay}
                            className="p-1 sm:p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all active:scale-95"
                        >
                            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button
                            onClick={nextDay}
                            disabled={isToday}
                            className="p-1 sm:p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>
                )}

                {/* Edit Button */}
                {onEditClick && !isLocked && (
                    <button
                        onClick={onEditClick}
                        className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 transition-all active:scale-95 flex-shrink-0"
                        aria-label="Edit Routine"
                    >
                        <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2]" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default DateHeader;
