import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const BackButton = ({ fallback = '/AWAKE/', className = '', onClick }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleBack = (e) => {
        // Prevent event bubbling or double firing
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (onClick) {
            onClick(e);
            return;
        }

        // Checking if we have a real history stack to go back to.
        // In SPAs/PWAs, if a user opens a link directly, history.length is often 1 or 2.
        // Also, if location.key is 'default', this is the first entry in this browsing context.
        const canGoBack = window.history.length > 2 && location.key !== 'default';

        if (canGoBack) {
            navigate(-1);
        } else {
            // No history to back into, route to fallback (default: home)
            navigate(fallback, { replace: true });
        }
    };

    return (
        <button
            onClick={handleBack}
            className={`p-2 bg-white/10 hover:bg-white/20 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors flex-shrink-0 ${className}`}
            style={{ touchAction: 'manipulation' }}
            aria-label="Go back"
        >
            <ArrowLeft className="w-5 h-5" />
        </button>
    );
};

export default BackButton;
