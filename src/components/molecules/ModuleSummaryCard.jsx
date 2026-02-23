import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import clsx from 'clsx';

const ModuleSummaryCard = ({
    title,
    icon: Icon,
    data,
    onClick,
    colorClass = "text-indigo-500",
    bgClass = "bg-indigo-50 dark:bg-indigo-900/20"
}) => {
    return (
        <div
            onClick={onClick}
            className="group relative overflow-hidden bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm cursor-pointer transition-all hover:shadow-md"
        >
            {/* Background Decor */}
            <div className={clsx("absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 rounded-full opacity-10 blur-2xl pointer-events-none", bgClass.replace('/20', ''))} />

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={clsx("w-10 h-10 rounded-2xl flex items-center justify-center", bgClass, colorClass)}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className="p-1.5 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-300 group-hover:text-slate-500 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                </div>
            </div>

            <div className="relative z-10">
                <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-1">{title}</h3>

                <div className="space-y-1">
                    {data.primary && (
                        <div className="text-xl font-semibold text-slate-800 dark:text-white tracking-tight">
                            {data.primary}
                        </div>
                    )}
                    {data.secondary && (
                        <div className="text-xs font-medium text-slate-500 truncate">
                            {data.secondary}
                        </div>
                    )}
                    {data.tertiary && (
                        <div className="text-xs font-medium text-slate-400 mt-2 flex items-center gap-1.5">
                            {data.indicator && (
                                <span className={clsx("w-1.5 h-1.5 rounded-full", data.indicatorColor || "bg-slate-300")} />
                            )}
                            {data.tertiary}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModuleSummaryCard;
