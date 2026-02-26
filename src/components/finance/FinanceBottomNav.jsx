import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Wallet, BookOpen, Clock } from 'lucide-react';
import { clsx } from 'clsx';

const NAV_ITEMS = [
    {
        id: 'home',
        label: 'Home',
        icon: Home,
        path: '/',
        exact: true,
    },
    {
        id: 'dashboard',
        label: 'Finance',
        icon: Wallet,
        path: '/finance',
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
        id: 'upcoming',
        label: 'Upcoming',
        icon: Clock,
        path: '/finance/upcoming',
        exact: true,
    },
];

const FinanceBottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <div className="flex h-[60px] items-center justify-around px-2">
                {NAV_ITEMS.map((item) => {
                    const isActive = item.exact
                        ? location.pathname === item.path
                        : location.pathname.startsWith(item.path);

                    const Icon = item.icon;

                    return (
                        <button
                            key={item.id}
                            onClick={() => navigate(item.path)}
                            className={clsx(
                                'flex flex-col items-center justify-center w-full h-full gap-0.5 transition-colors duration-150',
                                isActive
                                    ? 'text-indigo-600 dark:text-indigo-400'
                                    : 'text-slate-400 dark:text-slate-500'
                            )}
                        >
                            <Icon
                                className={clsx(
                                    'w-[22px] h-[22px]',
                                    isActive ? 'stroke-[2.5px]' : 'stroke-[1.75px]'
                                )}
                            />
                            <span
                                className={clsx(
                                    'text-[9px] font-bold tracking-tight',
                                    isActive
                                        ? 'text-indigo-600 dark:text-indigo-400'
                                        : 'text-slate-400 dark:text-slate-500'
                                )}
                            >
                                {item.label}
                            </span>
                            {/* Active dot */}
                            <div
                                className={clsx(
                                    'h-[3px] w-[3px] rounded-full bg-indigo-600 dark:bg-indigo-400 transition-opacity duration-150',
                                    isActive ? 'opacity-100' : 'opacity-0'
                                )}
                            />
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default FinanceBottomNav;
