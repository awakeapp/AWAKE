import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

/**
 * Pressable - A premium, highly tactile wrapper for any clickable element.
 * Adds standardized physical spring physics and haptic feedback to all taps.
 * 
 * @param {function} onClick - Click handler.
 * @param {string} className - Additional CSS classes.
 * @param {boolean} disabled - Whether the interaction is disabled.
 * @param {boolean} block - Whether the element should display as a block (full width).
 * @param {number} scaleDown - How much to scale down on tap (default 0.96).
 */
const Pressable = React.forwardRef(({ 
    onClick, 
    className, 
    disabled = false, 
    block = false,
    scaleDown = 0.96,
    as = 'div',
    children,
    ...props
}, ref) => {
    
    // Create the motion component dynamically
    const Component = typeof as === 'string' ? motion[as] : as;
    
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
        <Component
            ref={ref}
            whileTap={!disabled ? { scale: scaleDown, y: 1 } : {}}
            whileHover={!disabled ? { scale: 1.01, y: -0.5 } : {}}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={handleClick}
            className={clsx(
                "cursor-pointer select-none outline-none",
                block ? "block w-full" : "inline-block",
                disabled && "opacity-50 cursor-not-allowed pointer-events-none",
                className
            )}
            {...props}
        >
            {children}
        </Component>
    );
});

export default Pressable;
