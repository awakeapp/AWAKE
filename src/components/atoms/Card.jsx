import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

const Card = ({ className, children, ...props }) => {
    return (
        <motion.div
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 300 }}
            className={cn(
                "rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm",
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    );
};

const CardHeader = ({ className, ...props }) => (
    <div
        className={cn("flex flex-col space-y-1.5 p-6", className)}
        {...props}
    />
);

const CardTitle = ({ className, ...props }) => (
    <h3
        className={cn("font-semibold leading-none tracking-tight", className)}
        {...props}
    />
);

const CardContent = ({ className, ...props }) => (
    <div className={cn("p-6 pt-0", className)} {...props} />
);

export { Card, CardHeader, CardTitle, CardContent };
