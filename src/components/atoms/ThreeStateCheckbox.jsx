import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import clsx from 'clsx';

const ThreeStateCheckbox = ({ status, onClick, disabled }) => {
    // Styles for each state
    const styles = {
        unchecked: "bg-slate-100 border-slate-300 text-transparent hover:bg-slate-200",
        checked: "bg-emerald-500 border-emerald-500 text-white shadow-emerald-200",
        missed: "bg-red-500 border-red-500 text-white shadow-red-200"
    };

    const icons = {
        unchecked: null,
        checked: <Check strokeWidth={3} size={14} />,
        missed: <X strokeWidth={3} size={14} />
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={clsx(
                "w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all duration-200 shadow-sm",
                styles[status],
                disabled && "opacity-50 cursor-not-allowed",
                !disabled && "hover:scale-105 active:scale-95"
            )}
        >
            <motion.div
                key={status} // Logic for animation key
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.2 }}
            >
                {icons[status]}
            </motion.div>
        </button>
    );
};

export default ThreeStateCheckbox;
