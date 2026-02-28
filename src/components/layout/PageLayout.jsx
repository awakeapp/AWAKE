import React from 'react';
import clsx from 'clsx';
import { AppHeader } from '../ui/AppHeader';

const PageLayout = ({
    // Header Props
    header, // Custom header node (replaces title system if provided)
    title,
    leftNode,
    rightNode,
    showBack = false,
    onBack,
    
    // Page Props
    children,
    bottomNav,
    bgClass = "bg-white dark:bg-slate-950",
    contentPadClass = "px-4 pb-8 pt-1 flex flex-col gap-5",
    renderFloating
}) => {
    // Header height is 60px
    const hasHeader = header || title;

    return (
        <div 
            className={clsx("min-h-screen flex flex-col relative w-full", bgClass)}
            style={bottomNav ? { paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5.5rem)' } : {}}
        >
            {/* 1. Standardized Fixed Header */}
            {hasHeader && (
                header ? (
                    <header 
                        className="fixed top-0 left-0 right-0 z-[100] w-full bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800"
                        style={{ 
                            paddingTop: 'env(safe-area-inset-top, 0px)',
                            height: 'calc(60px + env(safe-area-inset-top, 0px))'
                        }}
                    >
                        <div className="w-full h-full flex items-center px-4">
                            {header}
                        </div>
                    </header>
                ) : (
                    <AppHeader 
                        title={title}
                        leftNode={leftNode}
                        rightNode={rightNode}
                        showBack={showBack}
                        onBack={onBack}
                    />
                )
            )}

            {/* 2. Content Area: handles top spacing for fixed header */}
            <main 
                className={clsx("flex-1 w-full relative [&>*:first-child]:mt-0", contentPadClass)}
                style={{
                    paddingTop: hasHeader 
                        ? 'calc(60px + env(safe-area-inset-top, 0px))' // 60px header exactly
                        : 'calc(0px + env(safe-area-inset-top, 0px))' // No header
                }}
            >
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
