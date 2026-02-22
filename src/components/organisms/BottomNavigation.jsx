import React from 'react';
import { useTranslation } from 'react-i18next';
import { Home, CheckCircle2, IndianRupee, Car, ListTodo } from 'lucide-react';
import { AppBottomNav } from '../ui/AppBottomNav';

const BottomNavigation = () => {
    const { t } = useTranslation();

    const navItems = [
        { icon: Home, label: t('nav.home', 'Home'), path: '/', exact: true },
        { icon: CheckCircle2, label: t('nav.routine', 'Routine'), path: '/routine', exact: false },
        { icon: ListTodo, label: t('nav.tasks', 'To-Do'), path: '/workspace', exact: false },
        { icon: IndianRupee, label: t('nav.finance', 'Finance'), path: '/finance', exact: false },
        { icon: Car, label: t('nav.vehicle', 'Vehicle'), path: '/vehicle', exact: false },
    ];

    return (
        <div className="sm:hidden">
            <AppBottomNav items={navItems} />
        </div>
    );
};

export default BottomNavigation;
