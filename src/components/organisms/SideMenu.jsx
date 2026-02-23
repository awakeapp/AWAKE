import { motion, AnimatePresence } from 'framer-motion';
import { X, Home, CheckSquare, Calendar, Settings, Utensils, PieChart, ChevronRight, Heart, Wallet, Activity } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../hooks/useAuthContext';

import { useRef, useState } from 'react';
import { useDate } from '../../context/DateContext';
import JumpDateModal from './JumpDateModal';

import { useTranslation } from 'react-i18next';

const SideMenu = ({ isOpen, onClose }) => {
    const { user } = useAuthContext();
    const navigate = useNavigate();
    const [isJumpModalOpen, setIsJumpModalOpen] = useState(false);
    const { t } = useTranslation();

    const menuItems = [
        { icon: Home, label: t('nav.dashboard', 'Dashboard'), path: '/' },
        { icon: CheckSquare, label: t('nav.daily_routine', 'Daily Routine'), path: '/routine' },
        { icon: Calendar, label: t('nav.history', 'History'), path: '/history' },
        { icon: Settings, label: t('nav.settings', 'Settings'), path: '/settings' },
    ];

    const advancedFeatures = [
        { icon: Utensils, label: t('nav.plan_diet', 'Plan Diet'), path: '/diet-plan', color: 'text-orange-500', bg: 'bg-orange-50' },
        { icon: PieChart, label: t('nav.analytics', 'Analytics'), path: '/analytics', color: 'text-indigo-500', bg: 'bg-indigo-50' },
        { icon: Wallet, label: t('nav.finance', 'Finance'), path: '/finance', color: 'text-emerald-500', bg: 'bg-emerald-50' },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 z-50 w-3/4 max-w-sm bg-white shadow-2xl flex flex-col dark:bg-slate-900 dark:border-l dark:border-slate-800"
                    >
                        <div className="p-5 border-b flex items-center justify-between dark:border-slate-800">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t('common.menu', 'Menu')}</h2>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        {/* Navigation */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            {/* Main Links */}
                            <nav className="space-y-1">
                                {menuItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={onClose}
                                        className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 text-slate-700 font-medium transition-colors dark:text-slate-300 dark:hover:bg-slate-800"
                                    >
                                        <item.icon className="w-5 h-5 text-slate-400" />
                                        {item.label}
                                    </Link>
                                ))}

                                {/* Jump to Date - Custom Modal */}
                                <button
                                    onClick={() => {
                                        setIsJumpModalOpen(true);
                                        // onClose(); // Optional: Close side menu immediately or wait? better wait until date selected or keep overlaid?
                                        // Let's keep side menu open, or close it when Jump is clicked?
                                        // The JumpModal is z-[60], SideMenu is z-50. So JumpModal will be on top.
                                    }}
                                    className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 text-slate-700 font-medium transition-colors w-full text-left dark:text-slate-300 dark:hover:bg-slate-800"
                                >
                                    <Calendar className="w-5 h-5 text-slate-400" />
                                    {t('date.jump_to_date', 'Jump to Date')}
                                </button>

                                {isJumpModalOpen && (
                                    <JumpDateModal
                                        isOpen={isJumpModalOpen}
                                        onClose={() => {
                                            setIsJumpModalOpen(false);
                                            onClose(); // Close menu after date is picked/cancelled
                                        }}
                                    />
                                )}
                            </nav>

                            {/* Advanced Tools */}
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-3">
                                    {t('nav.tools', 'Tools')}
                                </h3>
                                <div className="space-y-2">
                                    {advancedFeatures.map((feat) => (
                                        <Link
                                            key={feat.path}
                                            to={feat.path}
                                            onClick={onClose}
                                            className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${feat.bg} ${feat.color}`}>
                                                    <feat.icon className="w-4 h-4" />
                                                </div>
                                                <span className="font-medium text-slate-700">{feat.label}</span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                            <p className="text-center text-xs text-slate-300 mt-4">
                                Version 1.0.0
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default SideMenu;
