import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useThemeColor } from '../../hooks/useThemeColor';
import UpcomingPayments from './UpcomingPayments';
import FinanceBottomNav from '../../components/finance/FinanceBottomNav';

const FinanceUpcoming = () => {
    const { isDark } = useTheme();
    useThemeColor(isDark ? '#0f172a' : '#f8fafc');

    return (
        <div
            className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col pt-[env(safe-area-inset-top)]"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 20px) + 5rem)' }}
        >
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-30 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/30 dark:border-slate-800/30" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
                <div className="px-6 py-4">
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Upcoming</h1>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">Subscriptions & recurring bills</p>
                </div>
            </header>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 72px)' }}>
                <div className="px-6 pt-4">
                    <UpcomingPayments />
                </div>
            </div>

            <FinanceBottomNav />
        </div>
    );
};

export default FinanceUpcoming;
