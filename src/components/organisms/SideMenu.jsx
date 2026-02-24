import { motion, AnimatePresence } from 'framer-motion';
import { X, History, PieChart, Settings, Info, Utensils, ChevronRight, CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../hooks/useAuthContext';
import { TRANSITION_FAST } from '../../styles/tokens';
import { useState } from 'react';
import JumpDateModal from './JumpDateModal';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

// Pure button row — no Link wrapper that could race with navigation
const MenuRow = ({ item, isLast, onTap }) => (
    <button
        onClick={onTap}
        // touch-action: manipulation removes 300ms iOS tap delay in PWA/WebView
        style={{ touchAction: 'manipulation' }}
        className={clsx(
            "w-full text-left border-none outline-none bg-transparent",
            "flex items-center min-h-[50px] sm:min-h-[54px] active:bg-slate-100 dark:active:bg-[#2C2C2E] transition-colors duration-75 ml-4 pr-4",
            !isLast && "border-b border-slate-200 dark:border-[#38383A]"
        )}
    >
        <div className="flex items-center gap-3.5 py-2.5 flex-1 min-w-0">
            <div className="w-[30px] h-[30px] rounded-lg shrink-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                <item.icon strokeWidth={2} className="w-[18px] h-[18px]" />
            </div>
            <span className="text-[16px] xl:text-[17px] text-black dark:text-white leading-tight font-medium truncate">{item.label}</span>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-300 dark:text-[#5C5C5E] shrink-0 ml-2 relative top-[1px]" />
    </button>
);

const SideMenu = ({ isOpen, onClose }) => {
    const { user } = useAuthContext();
    const navigate = useNavigate();
    const [isJumpModalOpen, setIsJumpModalOpen] = useState(false);
    const { t } = useTranslation();

    const menuItems = [
        { icon: History,  label: t('nav.history', 'Order History'), path: '/history'   },
        { icon: PieChart, label: t('nav.insights', 'Insights'),     path: '/analytics' },
        { icon: Settings, label: t('nav.settings', 'Settings'),     path: '/settings'  },
        { icon: Info,     label: t('nav.about', 'About Awake'),     path: '/about'     },
    ];

    const toolItems = [
        { icon: Utensils, label: t('nav.diet_planner', 'Diet Planner'), path: '/diet' },
    ];

    // Navigate then close — avoids Link's own click-to-navigate overhead and race conditions
    const handleNavigate = (path) => {
        onClose();
        navigate(path);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop — z-[59]: strictly BELOW the drawer so taps never get intercepted here */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[59] bg-black/40 backdrop-blur-sm"
                    />

                    {/* Drawer — z-[60]: strictly ABOVE backdrop, clicks always land inside here */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={TRANSITION_FAST}
                        className="fixed inset-y-0 right-0 z-[60] w-[85%] max-w-sm bg-[#F2F2F7] dark:bg-black shadow-2xl flex flex-col font-sans"
                    >
                        {/* Header */}
                        <div className="p-4 pt-6 flex items-center justify-between mt-2">
                            <h2 className="text-[22px] font-bold tracking-tight text-black dark:text-white ml-2">{t('common.menu', 'Menu')}</h2>
                            <button
                                onClick={onClose}
                                style={{ touchAction: 'manipulation' }}
                                className="p-2 bg-slate-200 dark:bg-[#2C2C2E] rounded-full text-slate-500 dark:text-[#8E8E93] active:bg-slate-300 dark:active:bg-[#3C3C3E] transition-colors duration-75 mr-1"
                            >
                                <X className="w-5 h-5" strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Navigation Body */}
                        <div className="flex-1 overflow-y-auto p-4 pt-2 space-y-6">

                            {/* Main Links Group */}
                            <div className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden shadow-sm dark:shadow-none border border-slate-200 dark:border-[#2C2C2E]">
                                {menuItems.map((item, idx) => (
                                    <MenuRow
                                        key={item.path}
                                        item={item}
                                        onTap={() => handleNavigate(item.path)}
                                        isLast={idx === menuItems.length - 1}
                                    />
                                ))}
                            </div>

                            {/* Calendar / Jump Date Group */}
                            <div className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden shadow-sm dark:shadow-none border border-slate-200 dark:border-[#2C2C2E]">
                                <MenuRow
                                    item={{ icon: CalendarDays, label: t('date.jump_to_date', 'Jump to Date') }}
                                    onTap={() => setIsJumpModalOpen(true)}
                                    isLast
                                />
                                {isJumpModalOpen && (
                                    <JumpDateModal
                                        isOpen={isJumpModalOpen}
                                        onClose={() => {
                                            setIsJumpModalOpen(false);
                                            onClose();
                                        }}
                                    />
                                )}
                            </div>
                

                            {/* Tools Group */}
                            <div>
                                <h3 className="text-[13px] font-medium text-slate-500 dark:text-[#8E8E93] uppercase tracking-wider mb-2 px-4">
                                    {t('nav.tools', 'Tools')}
                                </h3>
                                <div className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden shadow-sm dark:shadow-none border border-slate-200 dark:border-[#2C2C2E]">
                                    {toolItems.map((item, idx) => (
                                        <MenuRow
                                            key={item.path}
                                            item={item}
                                            onTap={() => handleNavigate(item.path)}
                                            isLast={idx === toolItems.length - 1}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 pb-8">
                            <p className="text-center text-[12px] font-medium tracking-wide text-slate-400 dark:text-[#5C5C5E]">
                                HUMI AWAKE v1.2.0
                            </p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default SideMenu;
