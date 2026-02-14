import { memo } from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

const Card = memo(({ className, children, ...props }) => {
    return (
        <motion.div
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={cn(
                "rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm transition-shadow duration-200 hover:shadow-md",
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    );
});

Card.displayName = 'Card';

const CardHeader = memo(({ className, ...props }) => (
    <div
        className={cn("flex flex-col space-y-1.5 p-6", className)}
        {...props}
    />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = memo(({ className, ...props }) => (
    <h3
        className={cn("font-semibold leading-none tracking-tight", className)}
        {...props}
    />
));
CardTitle.displayName = 'CardTitle';

const CardContent = memo(({ className, ...props }) => (
    <div className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = 'CardContent';

export { Card, CardHeader, CardTitle, CardContent };
