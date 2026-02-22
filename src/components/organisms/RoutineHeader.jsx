import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Edit2 } from 'lucide-react';
import { useDate } from '../../context/DateContext';
import { useData } from '../../context/DataContext';
import { cn } from '../../lib/utils';
import { useTranslation } from 'react-i18next';
import JumpDateModal from './JumpDateModal';

const RoutineHeader = ({ onEditClick, isLocked }) => {
    const { t, i18n } = useTranslation();
    const { currentDate, isToday, prevDay, nextDay, jumpToToday, setDate } = useDate();
    const { dailyData } = useData();
    const [isJumpModalOpen, setIsJumpModalOpen] = useState(false);

    // Date formatting
    const currentLang = i18n.language || 'en-US';
    const dayName = new Intl.DateTimeFormat(currentLang, { weekday: 'short' }).format(currentDate).toUpperCase();
    const displayDate = new Intl.DateTimeFormat(currentLang, { month: 'short', day: 'numeric' }).format(currentDate).toUpperCase();

    // Progress
    const tasks = dailyData?.tasks || [];
    const done = tasks.filter(t => t.status === 'checked').length;
    const total = tasks.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    return (
        <>
            <JumpDateModal isOpen={isJumpModalOpen} onClose={() => setIsJumpModalOpen(false)} />

            <div className="rounded-[1.25rem] overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                {/* Main row */}
                <div className="flex items-center justify-between px-5 py-4 gap-4">
                    {/* Date section */}
                    <div
                        className="flex items-center gap-3 cursor-pointer min-w-0 flex-1 hover:opacity-80 transition-opacity"
                        onClick={() => setIsJumpModalOpen(true)}
                    >
                        <span className={cn(
                            "w-2.5 h-2.5 rounded-full shrink-0",
                            isToday
                                ? "bg-sky-500 dark:bg-sky-400 shadow-[0_0_8px_rgba(14,165,233,0.5)] animate-pulse"
                                : "bg-slate-300 dark:bg-slate-600"
                        )} />
                        <div className="min-w-0">
                            <div className="text-base font-black tracking-wider text-indigo-600 dark:text-indigo-400 leading-none">
                                {isToday ? t('date.today_caps') : dayName}
                            </div>
                            <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-widest mt-2 leading-none uppercase">
                                {displayDate}
                            </div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-1.5 shrink-0">
                        <button
                            onClick={prevDay}
                            className="w-9 h-9 flex items-center justify-center rounded text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-90"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <button
                            onClick={() => {
                                if (isToday) setIsJumpModalOpen(true);
                                else jumpToToday();
                            }}
                            className={cn(
                                "px-3 py-2 text-[10px] font-bold uppercase tracking-[0.15em] rounded transition-all active:scale-95",
                                isToday
                                    ? "text-slate-500 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                                    : "text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm shadow-indigo-500/20"
                            )}
                        >
                            {isToday ? t('date.jump_caps', 'JUMP') : t('date.today', 'TODAY')}
                        </button>

                        <button
                            onClick={nextDay}
                            disabled={isToday}
                            className="w-9 h-9 flex items-center justify-center rounded text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-90 disabled:opacity-20 disabled:cursor-default"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>

                        {/* Edit button (pen icon) */}
                        {!isLocked && onEditClick && (
                            <>
                                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700/50 mx-1 shrink-0" />
                                <button
                                    onClick={onEditClick}
                                    className="w-9 h-9 flex items-center justify-center rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                                    title="Edit routines"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Progress bar (Minimalist full-width layout) */}
                <div className="px-5 pb-5 pt-1">
                    <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 shadow-inner overflow-hidden">
                        <div
                            className={cn(
                                "h-full rounded-full transition-all duration-700 ease-out",
                                pct === 100
                                    ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                                    : pct >= 60
                                        ? "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]"
                                        : "bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.4)]"
                            )}
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                </div>

                {/* "Viewing past date" indicator */}
                {!isToday && (
                    <div className="flex items-center justify-between px-5 py-3 bg-amber-50 dark:bg-amber-950/30 border-t border-amber-100/50 dark:border-amber-900/50 text-[11px]">
                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                             <span className="font-extrabold tracking-wider uppercase">
                                VIEWING PAST DATE: {displayDate}
                             </span>
                        </div>
                        <button
                            onClick={jumpToToday}
                            className="bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg active:scale-95"
                        >
                            RETURN TO TODAY
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default RoutineHeader;
