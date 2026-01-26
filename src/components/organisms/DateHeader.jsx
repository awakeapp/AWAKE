import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { useRef } from 'react';
import { useDate } from '../../context/DateContext';
import Button from '../atoms/Button';
import { cn } from '../../lib/utils';

import JumpDateModal from './JumpDateModal';
import React from 'react';

const DateHeader = ({ className, showControls = true }) => {
    const { currentDate, formattedDate, isToday, prevDay, nextDay, jumpToToday, setDate, maxDate } = useDate();
    const [isJumpModalOpen, setIsJumpModalOpen] = React.useState(false);

    // Date formatting logic
    const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(currentDate);
    const displayDate = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: currentDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    }).format(currentDate);

    return (
        <div className={cn("mb-8 relative", className)}>
            <JumpDateModal
                isOpen={isJumpModalOpen}
                onClose={() => setIsJumpModalOpen(false)}
            />

            {/* Premium Background Accent */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none" />

            <div className="flex items-center justify-between gap-4 p-4 bg-white/50 dark:bg-slate-900/40 backdrop-blur-sm rounded-[2rem] border border-white/80 dark:border-slate-800/50 shadow-sm">
                <div className="flex-1 min-w-0 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse mt-[9px] shrink-0" />
                    <div className="flex-1 min-w-0">
                        <h2
                            onClick={() => setIsJumpModalOpen(true)}
                            className="text-lg sm:text-xl font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 leading-none cursor-pointer hover:text-indigo-700 transition-all active:scale-95 truncate"
                        >
                            {isToday ? 'TODAY' : dayName}
                        </h2>

                        <div className="relative inline-block group max-w-full">
                            <p
                                onClick={() => setIsJumpModalOpen(true)}
                                className="text-[10px] sm:text-[11px] font-bold text-slate-400/80 dark:text-slate-500/80 cursor-pointer hover:text-indigo-600 transition-colors whitespace-nowrap overflow-hidden text-ellipsis uppercase tracking-[0.2em] leading-none mt-1.5"
                            >
                                {displayDate}
                            </p>
                        </div>
                    </div>
                </div>

                {showControls && (
                    <div className="flex items-center gap-1 p-1 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/50">
                        <button
                            onClick={prevDay}
                            className="p-2 hover:bg-white dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-600 rounded-xl transition-all active:scale-90"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <button
                            onClick={() => {
                                if (isToday) {
                                    setIsJumpModalOpen(true);
                                } else {
                                    jumpToToday();
                                }
                            }}
                            className={cn(
                                "px-3 py-1.5 text-[10px] font-normal uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-sm",
                                isToday
                                    ? "text-slate-500 bg-white/80 dark:bg-slate-700/80 border border-slate-200/50"
                                    : "text-white bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none"
                            )}
                        >
                            {isToday ? 'JUMP' : 'Today'}
                        </button>

                        <button
                            onClick={nextDay}
                            disabled={isToday}
                            className="p-2 hover:bg-white dark:hover:bg-slate-700 text-slate-400 hover:text-indigo-600 rounded-xl transition-all active:scale-90 disabled:opacity-20 disabled:hover:bg-transparent"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DateHeader;
