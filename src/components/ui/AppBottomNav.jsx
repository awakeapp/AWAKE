import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import Pressable from '../atoms/Pressable';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function AppBottomNav({ items = [], className }) {
    const location = useLocation();
    const navigate = useNavigate();

    return (
        <nav
            className={cn(
                "fixed bottom-0 left-0 right-0 z-40 w-full",
                "bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl",
                "border-t border-slate-200/50 dark:border-slate-800/50",
                "pb-[env(safe-area-inset-bottom)]",
                className
            )}
        >
            <div className="flex h-[64px] items-center justify-around px-2 relative">
                {items.map((item, index) => {
                    const isActive = item.isActive !== undefined 
                        ? item.isActive 
                        : item.exact
                            ? location.pathname === item.path
                            : location.pathname.startsWith(item.path);

                    const Icon = item.icon;
                    const isPrimary = item.isPrimary;
                    
                    const handleClick = () => {
                        if (item.onClick) {
                            item.onClick();
                        } else if (item.path) {
                            navigate(item.path);
                        }
                    };

                    if (isPrimary) {
                        return (
                            <div key={item.path || item.id || index} className="relative -mt-8 flex items-center justify-center">
                                <Pressable
                                    onClick={handleClick}
                                    scaleDown={0.92}
                                    className={cn(
                                        "w-14 h-14 rounded-[22px] flex items-center justify-center shadow-xl transition-all duration-300",
                                        isActive 
                                            ? "bg-primary-600 text-white shadow-primary-500/30" 
                                            : "bg-slate-900 dark:bg-primary-600 text-white shadow-slate-900/20"
                                    )}
                                >
                                    <Icon className="w-7 h-7 stroke-[2.5px]" />
                                </Pressable>
                                {item.label && (
                                    <span className={cn(
                                        "absolute -bottom-6 text-[10px] font-bold tracking-tight whitespace-nowrap",
                                        isActive ? "text-primary-600 dark:text-primary-500" : "text-slate-400 dark:text-slate-500"
                                    )}>
                                        {item.label}
                                    </span>
                                )}
                            </div>
                        );
                    }

                    return (
                        <Pressable
                            key={item.path || item.id || index}
                            onClick={handleClick}
                            scaleDown={0.94}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full gap-0.5 tap-highlight-transparent group",
                                isActive
                                    ? "text-primary-600 dark:text-primary-500"
                                    : "text-slate-400 dark:text-slate-500"
                            )}
                        >
                            <div className="flex items-center justify-center relative">
                                <Icon className={cn(
                                    "w-6 h-6 transition-all duration-200", 
                                    isActive ? "stroke-[2.5px] scale-110" : "stroke-[1.75px]"
                                )} />
                            </div>
                            <span className="text-[10px] font-medium tracking-tight">
                                {item.label}
                            </span>
                            {/* Dot indicator */}
                            <div className={cn(
                                "h-[3px] w-[3px] rounded-full bg-primary-600 dark:bg-primary-500 mt-0.5 transition-all duration-200",
                                isActive ? "opacity-100 scale-100" : "opacity-0 scale-0"
                            )} />
                        </Pressable>
                    );
                })}
            </div>
        </nav>
    );
}
