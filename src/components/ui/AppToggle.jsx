import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import Pressable from '../atoms/Pressable';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export const AppToggle = ({ checked, onChange, disabled = false }) => {
    return (
        <Pressable
            as="button"
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => !disabled && onChange(!checked)}
            scaleDown={0.9}
            className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none",
                checked ? "bg-primary-600" : "bg-slate-200 dark:bg-slate-700",
                disabled && "opacity-50 cursor-not-allowed"
            )}
        >
            <span
                className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                    checked ? "translate-x-5" : "translate-x-0"
                )}
            />
        </Pressable>
    );
};
