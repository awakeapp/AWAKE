import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react';

const ErrorDisplay = ({
    title = "Something went wrong",
    message = "An unexpected error occurred. Please try again.",
    onRetry,
    isFullPage = false,
    type = 'general' // 'general', 'network', 'auth'
}) => {

    const getIcon = () => {
        if (type === 'network') return WifiOff;
        return AlertCircle;
    };

    const isAuth = type === 'auth';
    const Icon = getIcon();

    // Styles
    const containerClasses = isAuth
        ? "bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20"
        : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800";

    const iconContainerFullPage = isAuth
        ? "bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400"
        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400";

    const iconColor = isAuth
        ? "text-red-500 dark:text-red-400"
        : "text-slate-500 dark:text-slate-400";

    const titleColor = isAuth
        ? "text-red-900 dark:text-red-200"
        : "text-slate-900 dark:text-slate-200";

    const messageColor = isAuth
        ? "text-red-700 dark:text-red-300/80"
        : "text-slate-600 dark:text-slate-400";

    const buttonClasses = "mt-3 text-xs font-medium flex items-center gap-1.5 transition-colors " + (isAuth
        ? "text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100"
        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200");

    if (isFullPage) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in-up">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${iconContainerFullPage}`}>
                    <Icon className="w-8 h-8" />
                </div>
                <h2 className={`text-xl font-bold mb-2 ${isAuth ? 'text-red-800 dark:text-red-100' : 'text-slate-800 dark:text-slate-100'}`}>
                    {title}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 max-w-md mb-8 leading-relaxed">
                    {message}
                </p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-medium hover:opacity-90 transition-opacity active:scale-95"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span>Try Again</span>
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className={`p-4 rounded-xl border flex gap-4 animate-fade-in-up ${containerClasses}`}>
            <div className="flex-shrink-0 mt-0.5">
                <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <div className="flex-1">
                <h3 className={`text-sm font-semibold mb-0.5 ${titleColor}`}>
                    {title}
                </h3>
                <p className={`text-sm leading-relaxed ${messageColor}`}>
                    {message}
                </p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className={buttonClasses}
                    >
                        <RefreshCw className="w-3 h-3" />
                        <span>Retry</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default ErrorDisplay;
