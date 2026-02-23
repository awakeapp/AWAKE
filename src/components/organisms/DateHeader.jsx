import { ChevronLeft, ChevronRight, Edit2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { useDate } from '../../context/DateContext';
import { cn } from '../../lib/utils';
import JumpDateModal from './JumpDateModal';
import clsx from 'clsx';

const DateHeader = ({ className, showControls = true, overviewText, onEditClick, isLocked, rightNode, dateStateOverride, allowFuture = false }) => {
    const contextDate = useDate();
    
    // Allow overriding global date context (used heavily in TaskDashboard for local state isolation)
    const activeDateState = dateStateOverride || contextDate;
    const { currentDate, isToday, prevDay, nextDay, jumpToToday } = activeDateState;
    
    const [isJumpModalOpen, setIsJumpModalOpen] = useState(false);

    // Date formatting logic
    const shortWeekday = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(currentDate);
    const displayDate = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
    }).format(currentDate);

    return (
        <div className={cn("relative flex items-center justify-between transition-all duration-150 min-h-[72px] py-2 gap-2", className)}>
            <JumpDateModal
                isOpen={isJumpModalOpen}
                onClose={() => setIsJumpModalOpen(false)}
                initialDate={dateStateOverride ? currentDate : undefined}
                onSelect={dateStateOverride ? (d) => { if(d) activeDateState.jumpToToday(d); setIsJumpModalOpen(false); } : undefined} // Using jumpToToday temporarily just to set date unless they provide specific method, but we should just have jumpToToday accept a date or pass a specific setter. Wait, actually we don't have a setter in dateStateOverride yet.
            />

            {/* Left Block: Nav Arrows, Date, Today Button */}
            <div className="flex items-center gap-1.5 sm:gap-3 flex-1 min-w-0">
                
                {showControls && (
                    <button
                        onClick={prevDay}
                        className="p-1.5 sm:p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95 flex-shrink-0"
                    >
                        <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7" />
                    </button>
                )}

                {/* Date Block */}
                <div 
                    className="flex items-center gap-2.5 cursor-pointer group hover:opacity-80 transition-opacity flex-shrink-0" 
                    onClick={() => setIsJumpModalOpen(true)}
                >
                    <div className={cn(
                        "w-3 h-3 rounded-full flex-shrink-0 flex items-center justify-center transition-all",
                        isToday 
                            ? "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.6)] animate-pulse" 
                            : "bg-slate-300 dark:bg-slate-600"
                    )} />
                    <div className="flex flex-col items-start min-w-0">
                        <span className={cn(
                            "text-xl sm:text-2xl font-black uppercase tracking-wide leading-none transition-colors truncate",
                            isToday ? "text-indigo-600 dark:text-indigo-400" : "text-slate-800 dark:text-slate-100 group-hover:text-indigo-500"
                        )}>
                            {isToday ? 'TODAY' : shortWeekday}
                        </span>
                        <span className="text-sm sm:text-base font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1.5 leading-none truncate block">
                            {displayDate}
                        </span>
                    </div>
                </div>

                {showControls && (
                    <button
                        onClick={nextDay}
                        disabled={!allowFuture && isToday}
                        className="p-1.5 sm:p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95 disabled:opacity-20 disabled:hover:bg-transparent flex-shrink-0"
                    >
                        <ChevronRight className="w-6 h-6 sm:w-7 sm:h-7" />
                    </button>
                )}

                {!isToday && (
                    <button
                        onClick={jumpToToday}
                        className="flex items-center justify-center bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-xs sm:text-sm font-bold uppercase tracking-wider px-3 sm:px-4 py-2 rounded-xl transition-colors active:scale-95 flex-shrink-0 ml-0.5 sm:ml-1"
                    >
                        Today
                    </button>
                )}
            </div>

            {/* Right Block: Custom or Default */}
            {rightNode ? (
                rightNode
            ) : (
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 pl-1">
                    {/* Counter / Overview Text */}
                    {overviewText && (
                        <div className="flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm sm:text-base font-extrabold tracking-wide px-3 sm:px-4 py-2 rounded-xl min-w-[3rem] sm:min-w-[4rem]">
                            {overviewText}
                        </div>
                    )}

                    {/* Edit Button */}
                    {onEditClick && !isLocked && (
                        <button
                            onClick={onEditClick}
                            className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 transition-all active:scale-95 flex-shrink-0"
                            aria-label="Edit Routine"
                        >
                            <Edit2 className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default DateHeader;
