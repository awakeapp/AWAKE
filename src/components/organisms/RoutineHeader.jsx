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

            <div className="rounded-[1.25rem] overflow-hidden bg-slate-900 dark:bg-slate-900 border border-slate-800 shadow-md">
                {/* Main row */}
                <div className="flex items-center justify-between px-4 py-4 gap-4">
                    {/* Date section */}
                    <div
                        className="flex items-center gap-3 cursor-pointer min-w-0"
                        onClick={() => setIsJumpModalOpen(true)}
                    >
                        <span className={cn(
                            "w-2.5 h-2.5 rounded-full shrink-0",
                            isToday
                                ? "bg-sky-400 shadow-[0_0_8px_3px_rgba(56,189,248,0.25)] animate-pulse"
                                : "bg-slate-600"
                        )} />
                        <div className="min-w-0">
                            <div className="text-base font-bold tracking-wider text-indigo-400 leading-none">
                                {isToday ? t('date.today_caps') : dayName}
                            </div>
                            <div className="text-[11px] font-semibold text-slate-500 tracking-widest mt-2 leading-none uppercase">
                                {displayDate}
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-10 bg-slate-700/50 shrink-0" />

                    {/* Progress section */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between mb-2">
                            <span className="text-xs font-medium text-slate-400">
                                {done} / {total} {t('home.done', 'done')}
                            </span>
                            <span className="text-xs font-bold text-slate-300">
                                {pct}%
                            </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all duration-700 ease-out",
                                    pct === 100
                                        ? "bg-emerald-500"
                                        : pct >= 60
                                            ? "bg-indigo-500"
                                            : "bg-sky-500"
                                )}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            onClick={prevDay}
                            className="w-9 h-9 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-all active:scale-90"
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
                                    ? "text-slate-500 bg-slate-800 border border-slate-700"
                                    : "text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm shadow-indigo-500/20"
                            )}
                        >
                            {isToday ? t('date.jump_caps', 'JUMP') : t('date.today', 'TODAY')}
                        </button>

                        <button
                            onClick={nextDay}
                            disabled={isToday}
                            className="w-9 h-9 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-all active:scale-90 disabled:opacity-20 disabled:cursor-default"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>

                        {/* Edit button (pen icon) */}
                        {!isLocked && onEditClick && (
                            <button
                                onClick={onEditClick}
                                className="w-9 h-9 flex items-center justify-center rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-all ml-1"
                                title="Edit routines"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* "Viewing past date" indicator */}
                {!isToday && (
                    <div className="flex items-center justify-between px-4 py-2 bg-indigo-950/50 border-t border-slate-800/60 text-[10px]">
                        <span className="font-semibold text-indigo-300 tracking-wider">
                            VIEWING {displayDate}
                        </span>
                        <button
                            onClick={jumpToToday}
                            className="text-slate-500 hover:text-indigo-400 transition-colors"
                        >
                            tap TODAY to return →
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default RoutineHeader;
