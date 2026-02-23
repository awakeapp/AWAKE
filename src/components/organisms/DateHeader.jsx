import { ChevronLeft, ChevronRight, Edit2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { useDate } from '../../context/DateContext';
import { cn } from '../../lib/utils';
import JumpDateModal from './JumpDateModal';
import clsx from 'clsx';

const DateHeader = ({ className, showControls = true, overviewText, onEditClick, isLocked }) => {
    const { currentDate, formattedDate, isToday, prevDay, nextDay, jumpToToday } = useDate();
    const [isJumpModalOpen, setIsJumpModalOpen] = useState(false);

    // Date formatting logic
    const shortWeekday = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(currentDate);
    const displayDate = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
    }).format(currentDate);

    const handleTodayClick = () => {
        if (!isToday) {
            jumpToToday();
        } else {
            setIsJumpModalOpen(true);
        }
    };

    return (
        <div className={cn("relative flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-2 py-2 shadow-sm transition-all duration-150 h-14", className)}>
            <JumpDateModal
                isOpen={isJumpModalOpen}
                onClose={() => setIsJumpModalOpen(false)}
            />

            {/* Left: Back Arrow */}
            {showControls && (
                <button
                    onClick={prevDay}
                    className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95 flex-shrink-0"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
            )}

            {/* Center block: Date / Today */}
            <div className="flex flex-col items-center justify-center flex-shrink-0 px-2 cursor-pointer group" onClick={handleTodayClick}>
                <h2 className={cn(
                    "text-sm font-bold uppercase tracking-widest leading-none transition-colors",
                    isToday ? "text-indigo-600 dark:text-indigo-400" : "text-slate-700 dark:text-slate-300 group-hover:text-indigo-500"
                )}>
                    {isToday ? 'TODAY' : 'TODAY'}
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1 group-hover:text-indigo-500 transition-colors">
                    {displayDate} • {shortWeekday}
                </p>
            </div>

            {/* Middle Section: Overview Text */}
            <div className="flex-1 flex justify-center items-center min-w-0 px-2">
                {overviewText && (
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full truncate">
                        {overviewText}
                    </span>
                )}
            </div>

            {/* Right side: Edit Icon */}
            {onEditClick && (
                <button
                    onClick={onEditClick}
                    className={clsx(
                        "p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95 flex-shrink-0",
                        isLocked && "hidden"
                    )}
                    aria-label="Edit Routine"
                >
                    <Edit2 className="w-4 h-4 stroke-[2]" />
                </button>
            )}

            {/* Far Right: Forward Arrow */}
            {showControls && (
                <button
                    onClick={nextDay}
                    disabled={isToday}
                    className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95 disabled:opacity-20 disabled:hover:bg-transparent disabled:active:scale-100 flex-shrink-0"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            )}
        </div>
    );
};

export default DateHeader;
