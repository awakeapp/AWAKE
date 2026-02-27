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
        <UpcomingPayments />
    );
};

export default FinanceUpcoming;
