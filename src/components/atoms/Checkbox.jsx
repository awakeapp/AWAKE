import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

const Checkbox = ({ checked, onCheckedChange, disabled, className }) => {
    return (
        <button
            type="button"
            role="checkbox"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onCheckedChange(!checked)}
            className={cn(
                "peer h-6 w-6 shrink-0 rounded-md border border-slate-300 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 disabled:cursor-not-allowed disabled:opacity-50 transition-all flex items-center justify-center",
                checked ? "bg-primary-600 border-primary-600 text-white" : "bg-white hover:bg-slate-50",
                className
            )}
        >
            {checked && <Check className="h-4 w-4" />}
        </button>
    );
};

export default Checkbox;
