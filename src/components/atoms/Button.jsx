import React from 'react';
import { cn } from '../../lib/utils';
import awakeLogo from '../../assets/awake_logo_new.png';
import Pressable from './Pressable';

const Button = React.forwardRef(({ 
 children, 
 variant = 'primary', 
 size = 'md', 
 isLoading = false, 
 className = '', 
 disabled, 
 ...props 
}, ref) => {
 // Base styles
 const baseStyles = "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:pointer-events-none";

 const variants = {
 primary: "bg-primary-600 text-white hover:bg-primary-700 shadow-sm",
 secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50",
 ghost: "bg-transparent text-slate-700 hover:bg-slate-100",
 danger: "bg-red-600 text-white hover:bg-red-700",
 outline: "bg-transparent text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
 };

 const sizes = {
 md: "h-10 py-2 px-4",
 sm: "h-9 px-3 rounded-md",
 lg: "h-11 px-8 rounded-md"
 }

 return (
 <Pressable
 ref={ref}
 as="button"
 scaleDown={0.96}
 disabled={disabled || isLoading}
 className={cn(baseStyles, variants[variant], sizes[size], className)}
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
 </Pressable>
 );
});

Button.displayName = 'Button';

export default Button;
