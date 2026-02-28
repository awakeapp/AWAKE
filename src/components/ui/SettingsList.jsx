import React from 'react';
import { ChevronRight } from 'lucide-react';
import Pressable from '../atoms/Pressable';
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export const SettingsSection = ({ title, children, className }) => (
    <div className={cn("mb-6 sm:mb-8", className)}>
        {title && (
            <h3 className="px-4 mb-2 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                {title}
            </h3>
        )}
        <div className="bg-white dark:bg-[#1C1C1E] overflow-hidden rounded-2xl shadow-sm border border-slate-200/50 dark:border-white/5">
            {children}
        </div>
    </div>
);

export const SettingsRow = ({ 
    icon: Icon, 
    title, 
    subtitle, 
    rightElement, 
    onClick, 
    isDanger = false, 
    isLast = false,
    className 
}) => {
    const Wrapper = onClick ? Pressable : 'div';
    
    return (
        <Wrapper 
            onClick={onClick}
            block
            scaleDown={0.98}
            className={cn(
                "group flex items-center min-h-[56px] transition-all duration-200",
                onClick ? "cursor-pointer active:bg-slate-50 dark:active:bg-[#2C2C2E]" : "",
                className
            )}
        >
            <div className={cn(
                "flex items-center flex-1 min-w-0 py-3 pr-4 ml-4",
                !isLast && "border-b border-slate-100 dark:border-white/5"
            )}>
                {Icon && (
                    <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mr-4 transition-colors",
                        isDanger 
                            ? "bg-rose-500/10 text-rose-500" 
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
                    )}>
                        <Icon strokeWidth={2.2} className="w-6 h-6" />
                    </div>
                )}
                
                <div className="flex-1 min-w-0 flex items-center justify-between">
                    <div className="flex flex-col min-w-0">
                        <span className={cn(
                            "text-[16px] font-semibold leading-tight truncate",
                            isDanger ? "text-rose-500" : "text-slate-900 dark:text-white"
                        )}>
                            {title}
                        </span>
                        {subtitle && (
                            <span className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                                {subtitle}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center shrink-0 ml-4">
                        {rightElement}
                        {onClick && !rightElement && (
                            <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 transition-transform group-active:translate-x-0.5" />
                        )}
                    </div>
                </div>
            </div>
        </Wrapper>
    );
};

export const SettingsList = ({ children, className }) => (
    <div className={cn("py-4 sm:py-6", className)}>
        {children}
    </div>
);
