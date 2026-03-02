import React from 'react';
import { LucideIcon } from 'lucide-react';
import clsx from 'clsx';
import ActionButton from '../atoms/ActionButton';

/**
 * Universal Empty State component
 * 
 * @param {LucideIcon} icon - The icon component to display
 * @param {string} title - The main heading
 * @param {string} subtitle - Optional description text
 * @param {string} actionLabel - Optional label for action button
 * @param {function} onAction - Optional handler for action button
 * @param {string} className - Optional container styling
 */
const EmptyState = ({ 
    icon: Icon, 
    title, 
    subtitle, 
    actionLabel, 
    onAction,
    className 
}) => {
    return (
        <div className={clsx(
            "text-center py-16 px-6 bg-slate-50 dark:bg-slate-800/20 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800/50 flex flex-col items-center justify-center",
            className
        )}>
            {Icon && (
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400 dark:text-slate-500">
                    <Icon className="w-8 h-8" />
                </div>
            )}
            <h3 className="text-base font-black text-slate-800 dark:text-slate-200 tracking-tight mb-2">
                {title}
            </h3>
            {subtitle && (
                <p className="text-sm font-medium text-slate-500 max-w-sm mb-6">
                    {subtitle}
                </p>
            )}
            {actionLabel && onAction && (
                <ActionButton 
                    variant="primary" 
                    onClick={onAction}
                    label={actionLabel}
                    iconOnly={false}
                    className="mt-2"
                />
            )}
        </div>
    );
};

export default EmptyState;
