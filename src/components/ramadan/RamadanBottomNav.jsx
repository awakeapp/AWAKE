import React from 'react';
import { useLocation } from 'react-router-dom';
import { Home, Moon, Heart, BarChart2, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AppBottomNav } from '../ui/AppBottomNav';

const RamadanBottomNav = () => {
    const { pathname } = useLocation();
    const { t } = useTranslation();

    const navItems = [
        { 
            icon: Home, 
            label: 'AWAKE', 
            path: '/', 
            exact: true 
        },
        { 
            icon: Heart, 
            label: 'Dhikr', 
            path: '/ramadan/dhikr', 
            exact: false 
        },
        { 
            icon: Moon, 
            label: 'Ramadan', 
            path: '/ramadan', 
            exact: true,
            isPrimary: true // Central Highlighted Button
        },
        { 
            icon: BarChart2, 
            label: 'Stats', 
            path: '/ramadan/stats', 
            exact: false 
        },
        { 
            icon: Settings, 
            label: 'Settings', 
            path: '/ramadan/settings', 
            exact: false 
        }
    ];

    return <AppBottomNav items={navItems} />;
};

export default RamadanBottomNav;
