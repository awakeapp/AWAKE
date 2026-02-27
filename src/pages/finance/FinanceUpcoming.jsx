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
            <header className="fixed top-0 left-0 right-0 z-30 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl px-6 pt-4 pb-4">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Upcoming</h1>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Subscriptions & recurring bills</p>
            </header>

            {/* Content */}
            <div className="px-6 flex-1 pt-24">
                <UpcomingPayments />
            </div>

            <FinanceBottomNav />
        </div>
    );
};

export default FinanceUpcoming;
