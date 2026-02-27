import React from 'react';
import { useTranslation } from 'react-i18next';
import { Home, CheckCircle2, IndianRupee, Car, ListTodo } from 'lucide-react';
import { AppBottomNav } from '../ui/AppBottomNav';

const BottomNavigation = () => {
    const { t } = useTranslation();
    const navItems = [
        { icon: Home, label: t('nav.home_nav', 'Home'), path: '/', exact: true },
        { icon: CheckCircle2, label: t('nav.routine_nav', 'Routine'), path: '/routine', exact: false },
        { 
            icon: ListTodo, 
            label: t('nav.todo_nav', 'To-Do'), 
            path: '/workspace', 
            exact: false,
            isPrimary: true // Central Highlight
        },
        { icon: IndianRupee, label: t('nav.finance_nav', 'Finance'), path: '/finance', exact: false },
        { icon: Car, label: t('nav.vehicle_nav', 'Vehicle'), path: '/vehicle', exact: false },
    ];

    return (
        <div className="sm:hidden">
            <AppBottomNav items={navItems} />
        </div>
    );
};

export default BottomNavigation;
