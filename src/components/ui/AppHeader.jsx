import React from 'react';
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

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
                "fixed top-0 left-0 right-0 z-[100] w-full px-4",
                "flex items-center justify-between",
                transparent ? "bg-transparent" : "bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800",
                className
            )}
            style={{
                paddingTop: 'env(safe-area-inset-top, 0px)',
                height: 'calc(60px + env(safe-area-inset-top, 0px))'
            }}
        >
            {/* Left Action Area: 16px from edge (px-4 handles it) */}
            <div className="flex-1 flex justify-start items-center">
                {showBack ? (
                    <button
                        onClick={handleBack}
                        className="p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300 active:scale-95"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                ) : (
                    leftNode
                )}
            </div>

            {/* Center Title: Exactly Centered */}
            <div className="absolute left-1/2 -translate-x-1/2 flex justify-center text-center max-w-[50%] pointer-events-none">
                <h1 className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {title}
                </h1>
            </div>

            {/* Right Action Area: 16px from edge */}
            <div className="flex-1 flex justify-end items-center gap-2">
                {rightNode}
            </div>
        </header>
    );
}
