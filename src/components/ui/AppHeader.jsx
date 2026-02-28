import React from 'react';
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useNavigate, useLocation } from 'react-router-dom';
import ActionButton from '../atoms/ActionButton';

function cn(...inputs) {
 return twMerge(clsx(inputs));
}

export function AppHeader({ 
    title, 
    leftNode, 
    rightNode, 
    showBack = false, 
    onBack,
    className,
    transparent = false
}) {
    const navigate = useNavigate();

    const handleBack = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (onBack) {
            onBack(e);
            return;
        }

        navigate(-1);
    };

    return (
        <header
            className={cn(
                "fixed top-0 left-0 right-0 z-[100] w-full px-5",
                "flex items-center justify-between gap-4",
                transparent ? "bg-transparent" : "bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50",
                className
            )}
            style={{
                paddingTop: 'env(safe-area-inset-top, 0px)',
                height: 'calc(60px + env(safe-area-inset-top, 0px))'
            }}
        >
            {/* Left Action Area */}
            <div className="flex-1 flex justify-start items-center min-w-0">
                {showBack ? (
                    <ActionButton 
                        variant="back" 
                        onClick={handleBack} 
                        className="-ml-2"
                        size="sm"
                    />
                ) : leftNode ? (
                    leftNode
                ) : (
                    <h1 className="text-[17px] font-black tracking-tightest text-slate-900 dark:text-white uppercase truncate">
                        {title}
                    </h1>
                )}
            </div>

            {/* Center Area (Optional, used if leftNode exists) */}
            {leftNode && (
                <div className="flex-1 flex justify-center text-center truncate">
                    <h1 className="text-[15px] font-bold text-slate-900 dark:text-white uppercase tracking-tight truncate">
                        {title}
                    </h1>
                </div>
            )}

            {/* Right Action Area */}
            <div className="flex-1 flex justify-end items-center gap-3 shrink-0">
                {rightNode}
            </div>
        </header>
    );
}
