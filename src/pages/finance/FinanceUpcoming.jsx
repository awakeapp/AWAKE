import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useThemeColor } from '../../hooks/useThemeColor';
import UpcomingPayments from './UpcomingPayments';
import FinanceBottomNav from '../../components/finance/FinanceBottomNav';
import PageLayout from '../../components/layout/PageLayout';

const FinanceUpcoming = () => {
    const { isDark } = useTheme();
    useThemeColor(isDark ? '#0f172a' : '#f8fafc');

    return (
        <PageLayout
            bottomNav={<FinanceBottomNav />}
            header={
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Upcoming</h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Subscriptions & bills</p>
                </div>
            }
        >
            <div>
                <UpcomingPayments />
            </div>
        </PageLayout>
    );
};

export default FinanceUpcoming;
