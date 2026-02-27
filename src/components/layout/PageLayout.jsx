import React from 'react';
import clsx from 'clsx';

const PageLayout = ({
    header,
    children,
    bottomNav,
    bgClass = "bg-slate-50 dark:bg-slate-950",
    headerBgClass = "bg-slate-50/80 dark:bg-slate-950/80",
    headerBorderClass = "border-b border-slate-200/50 dark:border-slate-800/50",
    headerPadClass = "px-4 pt-3 pb-3",
    contentPadClass = "px-4 pt-4 pb-8 flex flex-col gap-6",
    renderFloating
}) => {
    return (
        <div 
            className={clsx("min-h-screen flex flex-col relative", bgClass)}
            style={bottomNav ? { paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)' } : {}}
        >
            {/* 1. Unified Sticky Header */}
            {header && (
                <header 
                    className={clsx(
                        "sticky top-0 z-30 w-full backdrop-blur-xl",
                        headerBgClass,
                        headerBorderClass
                    )}
                    style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
                >
                    <div className={headerPadClass}>
                        {header}
                    </div>
                </header>
            )}

            {/* 2. Unified Content Area: strict 16px (pt-4) padding-top */}
            <main className={clsx("flex-1 w-full max-w-screen-md mx-auto relative", contentPadClass)}>
                {children}
            </main>

            {/* Bottom Component */}
            {typeof bottomNav === 'boolean' ? null : bottomNav}

            {/* Floating components */}
            {renderFloating}
        </div>
    );
};

export default PageLayout;
