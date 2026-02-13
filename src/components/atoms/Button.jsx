import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';
import awakeLogo from '../../assets/awake_logo_new.png';

const Button = ({ children, variant = 'primary', className, isLoading, disabled, ...props }) => {
    const baseStyles = "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-white";

    const variants = {
        primary: "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-600 shadow-sm",
        secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-slate-500",
        ghost: "bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-500",
        danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-600",
    };

    const sizes = {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md"
    }

    return (
        <motion.button
            whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
            whileTap={{ scale: disabled || isLoading ? 1 : 0.95 }}
            className={cn(baseStyles, variants[variant], sizes.default, className)}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <div className="flex items-center gap-2">
                    <img
                        src={awakeLogo}
                        alt="Loading..."
                        className={cn(
                            "h-5 w-auto animate-pulse",
                            (variant === 'primary' || variant === 'danger') && "brightness-0 invert"
                        )}
                    />
                    <span className="opacity-70">Processing...</span>
                </div>
            ) : (
                children
            )}
        </motion.button>
    );
};

export default Button;
