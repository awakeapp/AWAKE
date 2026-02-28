import React from 'react';
import { motion } from 'framer-motion';
import { 
    ChevronLeft, 
    X, 
    Check, 
    Trash2, 
    Undo2, 
    Save, 
    ArrowLeft, 
    ArrowRight,
    ChevronRight
} from 'lucide-react';
import clsx from 'clsx';

/**
 * ActionButton - A premium, standardized action button for back, exit, save, delete, and undo.
 * 
 * @param {string} variant - One of: 'back', 'exit', 'save', 'delete', 'undo', 'next', 'prev'.
 * @param {function} onClick - Click handler.
 * @param {string} className - Additional CSS classes.
 * @param {boolean} disabled - Whether the button is disabled.
 * @param {string} label - Optional text label (usually hidden for icon-only buttons).
 */
const ActionButton = ({ 
    variant = 'back', 
    onClick, 
    className, 
    disabled = false, 
    label,
    iconOnly = true,
    size = 'md',
    fullWidth = false,
    children
}) => {
    
    const getIcon = () => {
        const iconSize = size === 'sm' ? "w-5 h-5" : "w-6 h-6";
        switch (variant) {
            case 'back': 
            case 'prev': return <ChevronLeft className={iconSize} />;
            case 'forward':
            case 'next': return <ChevronRight className={iconSize} />;
            case 'exit': return <X className={iconSize} />;
            case 'save': return <Check className={iconSize} />;
            case 'submit': return <ArrowRight className={iconSize} />;
            case 'delete': return <Trash2 className={iconSize} />;
            case 'undo': return <Undo2 className={iconSize} />;
            case 'arrow-left': return <ArrowLeft className={iconSize} />;
            case 'arrow-right': return <ArrowRight className={iconSize} />;
            default: return <ChevronLeft className={iconSize} />;
        }
    };

    const getVariantStyles = () => {
        switch (variant) {
            case 'delete':
                return "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 shadow-sm shadow-rose-500/10 active:shadow-none";
            case 'save':
                return "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 shadow-sm shadow-emerald-500/10 active:shadow-none";
            case 'primary':
                return "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white/90 shadow-md shadow-slate-900/20 dark:shadow-white/20 active:shadow-none";
            case 'ghost':
                return "bg-transparent text-slate-700 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10";
            default:
                return "bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200/50 dark:border-white/5 shadow-sm active:shadow-none";
        }
    };

    const sizeStyles = {
        sm: "p-2 rounded-[14px]",
        md: "p-3 rounded-[18px]",
        lg: "p-4 rounded-[22px]"
    };

    const handleClick = (e) => {
        if (disabled) return;
        // Premium haptic feedback pattern
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(10);
        }
        if (onClick) {
            onClick(e);
        }
    };

    return (
        <motion.button
            whileTap={!disabled ? { scale: 0.96, y: 1 } : {}}
            whileHover={!disabled ? { scale: 1.02, y: -1 } : {}}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={handleClick}
            disabled={disabled}
            className={clsx(
                "flex items-center justify-center transition-colors duration-200 outline-none select-none px-4",
                getVariantStyles(),
                sizeStyles[size],
                fullWidth ? "w-full" : "w-fit",
                disabled && "opacity-40 cursor-not-allowed contrast-50 saturate-50",
                className
            )}
            title={label || variant}
            aria-label={label || variant}
        >
            {children || (
                <>
                    {getIcon()}
                    {!iconOnly && label && (
                        <span className={clsx(
                            "font-bold uppercase tracking-widest ml-2",
                            size === 'sm' ? "text-[8px]" : "text-[10px]"
                        )}>
                            {label}
                        </span>
                    )}
                </>
            )}
        </motion.button>
    );
};

export default ActionButton;
