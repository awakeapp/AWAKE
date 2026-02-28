import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, History, PieChart, Settings as SettingsIcon, Info, Utensils, 
    ChevronRight, CalendarDays 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../hooks/useAuthContext';
import { TRANSITION_FAST } from '../../styles/tokens';
import { useState } from 'react';
import JumpDateModal from './JumpDateModal';
import { useTranslation } from 'react-i18next';
import { useScrollLock } from '../../hooks/useScrollLock';
import { SettingsList, SettingsSection, SettingsRow } from '../ui/SettingsList';

const SideMenu = ({ isOpen, onClose }) => {
    useScrollLock(isOpen);
    const { user } = useAuthContext();
    const navigate = useNavigate();
    const [isJumpModalOpen, setIsJumpModalOpen] = useState(false);
    const { t } = useTranslation();

    const menuItems = [
        { icon: History,      label: t('nav.history', 'Order History'), path: '/history'   },
        { icon: PieChart,     label: t('nav.insights', 'Insights'),     path: '/analytics' },
        { icon: SettingsIcon, label: t('nav.settings', 'Settings'),     path: '/settings'  },
        { icon: Info,         label: t('nav.about', 'About Awake'),     path: '/about'     },
    ];

    const toolItems = [
        { icon: Utensils, label: t('nav.diet_planner', 'Diet Planner'), path: '/diet' },
    ];

    const handleNavigate = (path) => {
        onClose();
        navigate(path);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={TRANSITION_FAST}
                        className="fixed inset-y-0 right-0 z-[110] w-[85%] max-w-[340px] bg-slate-50 dark:bg-black shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div 
                            className="px-5 flex items-center justify-between border-b border-slate-200/50 dark:border-white/5"
                            style={{ 
                                paddingTop: 'env(safe-area-inset-top, 0px)',
                                height: 'calc(60px + env(safe-area-inset-top, 0px))'
                            }}
                        >
                            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                {t('common.menu', 'Menu')}
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 active:scale-90 transition-all"
                            >
                                <X className="w-5 h-5" strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Menu Content */}
                        <div className="flex-1 overflow-y-auto">
                            <SettingsList className="px-3">
                                <SettingsSection title="General">
                                    {menuItems.map((item, idx) => (
                                        <SettingsRow 
                                            key={item.path}
                                            icon={item.icon}
                                            title={item.label}
                                            onClick={() => handleNavigate(item.path)}
                                            isLast={idx === menuItems.length - 1}
                                        />
                                    ))}
                                </SettingsSection>

                                <SettingsSection title="Tools">
                                    <SettingsRow 
                                        icon={CalendarDays}
                                        title={t('date.jump_to_date', 'Jump to Date')}
                                        onClick={() => setIsJumpModalOpen(true)}
                                    />
                                    {toolItems.map((item, idx) => (
                                        <SettingsRow 
                                            key={item.path}
                                            icon={item.icon}
                                            title={item.label}
                                            onClick={() => handleNavigate(item.path)}
                                            isLast={idx === toolItems.length - 1}
                                        />
                                    ))}
                                </SettingsSection>
                            </SettingsList>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-slate-200/50 dark:border-white/5 text-center">
                            <p className="text-[11px] font-bold tracking-widest text-slate-400 dark:text-slate-600 uppercase">
                                HUMI AWAKE v1.2.0
                            </p>
                        </div>
                    </motion.div>
                </>
            )}

            {isJumpModalOpen && (
                <JumpDateModal
                    isOpen={isJumpModalOpen}
                    onClose={() => {
                        setIsJumpModalOpen(false);
                        onClose();
                    }}
                />
            )}
        </AnimatePresence>
    );
};

export default SideMenu;
