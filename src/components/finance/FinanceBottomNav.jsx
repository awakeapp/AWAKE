import React from 'react';
import { Home, Wallet, BookOpen, Clock, MoreHorizontal } from 'lucide-react';
import { AppBottomNav } from '../ui/AppBottomNav';

const FinanceBottomNav = () => {
    const navItems = [
        {
            id: 'home',
            label: 'Home',
            icon: Home,
            path: '/',
            exact: true,
        },
        {
            id: 'debts',
            label: 'Debts',
            icon: BookOpen,
            path: '/finance/debts',
            exact: false,
        },
        {
            id: 'dashboard',
            label: 'Finance',
            icon: Wallet,
            path: '/finance',
            exact: true,
            isPrimary: true, // Central Highlight
        },
        {
            id: 'upcoming',
            label: 'Upcoming',
            icon: Clock,
            path: '/finance/upcoming',
            exact: true,
        },
        {
            id: 'more',
            label: 'More',
            icon: MoreHorizontal,
            path: '/finance/more',
            exact: true,
        }
    ];

    return <AppBottomNav items={navItems} />;
};

export default FinanceBottomNav;
