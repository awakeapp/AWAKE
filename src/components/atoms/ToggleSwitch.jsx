import { motion } from 'framer-motion';
import clsx from 'clsx';

const ToggleSwitch = ({ status, onClick, disabled }) => {
    // status: 'unchecked' | 'checked' | 'completed' | 'missed' | 'pending'
    
    // In Routine, keep the toggle but remove the red state entirely. 
    // Use only blue for active and neutral grey for inactive.
    const isCompleted = status === 'checked' || status === 'completed';
    
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={clsx(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                isCompleted ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-700",
                disabled && "opacity-50 cursor-not-allowed"
            )}
        >
            <span
                className={clsx(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    isCompleted ? "translate-x-5" : "translate-x-0"
                )}
            />
        </button>
    );
};

export default ToggleSwitch;
