import React from 'react';
import ErrorDisplay from './molecules/ErrorDisplay';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
                    <ErrorDisplay
                        isFullPage={true}
                        title="Something went wrong"
                        message="We encountered an unexpected issue. Please try refreshing the page."
                        onRetry={() => window.location.reload()}
                    />
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
