import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { useAuthContext } from '../hooks/useAuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { User, Moon, Sun, Clock, ChevronRight, Download, ShieldCheck, HelpCircle, UserPlus, FileText, ArrowLeft, Monitor } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';


// Shared Row Component matching iOS style
const SettingsRow = ({ icon: Icon, title, subtitle, right, onClick, className, isLast, iconBgClass }) => (
 <div 
 onClick={onClick}
 className={clsx(
 "flex items-center min-h-[44px] sm:min-h-[50px] bg-white dark:bg-[#1C1C1E] active:bg-slate-100 dark:active:bg-[#2C2C2E] transition-colors duration-75 ml-4 pr-4",
 !isLast && "border-b border-slate-200 dark:border-[#38383A]",
 onClick && "cursor-pointer",
 className
 )}
 >
 <div className="flex items-center gap-3.5 py-2.5 flex-1 min-w-0">
 {Icon && (
 <div className="w-[30px] h-[30px] rounded-lg shrink-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
 <Icon strokeWidth={2} className="w-[18px] h-[18px]" />
 </div>
 )}
 <div className="flex-1 min-w-0 flex items-center justify-between">
 <p className="text-[16px] xl:text-[17px] text-black dark:text-white leading-tight truncate">{title}</p>
 {subtitle && <p className="text-[15px] xl:text-[16px] text-slate-500 dark:text-[#8E8E93] ml-2 truncate">{subtitle}</p>}
 </div>
 </div>
 {right ? (
 <div className="shrink-0 ml-2 flex items-center">
 {right}
 </div>
 ) : onClick ? (
 <ChevronRight className="w-5 h-5 text-slate-300 dark:text-[#5C5C5E] ml-2 shrink-0 relative top-[1px]" />
 ) : null}
 </div>
);

// Shared Group Component
const SettingsGroup = ({ children, className }) => (
 <div className={clsx("mb-6 sm:mb-8", className)}>
 <div className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden shadow-sm dark:shadow-none sm:border sm:border-slate-200 sm:dark:border-[#2C2C2E]">
 {children}
 </div>
 </div>
);

const Settings = () => {
 const { user } = useAuthContext();
 const { themePreference, setThemePreference } = useTheme();
 const { appSettings, updateSetting } = useSettings();
 const { t, i18n } = useTranslation();
 const navigate = useNavigate();

 return (
 <div className="pb-12 bg-[#F2F2F7] dark:bg-black min-h-screen text-black dark:text-white font-sans">
 {/* Fixed Sticky Header */}
 <div 
 className="fixed top-0 left-0 right-0 z-40 bg-[#F2F2F7]/80 dark:bg-black/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10 transition-all duration-300"
 style={{ paddingTop: 'env(safe-area-inset-top)' }}
 >
 <div className="max-w-screen-md mx-auto px-4 h-14 flex items-center gap-3">
 <button
 onClick={() => navigate(-1)}
 className="p-2 bg-transparent hover:bg-black/5 dark:bg-transparent dark:hover:bg-white/10 rounded-full transition-colors text-black dark:text-white lg:hidden -ml-2 focus:outline-none"
 >
 <ArrowLeft className="w-6 h-6" />
 </button>
 <h1 className="text-xl font-bold tracking-tight text-black dark:text-white">{t('nav.settings', 'Settings')}</h1>
 </div>
 </div>

 <div 
 className="max-w-screen-md mx-auto px-4 sm:px-4"
 style={{ paddingTop: 'calc(56px + env(safe-area-inset-top) + 20px)' }}
 >

 <div className="px-0 sm:px-0">
 


 {/* Preferences Group */}
 <SettingsGroup>
 <SettingsRow 
 icon={FileText} 
 iconBgClass="bg-red-500"
 title={t('settings.language', 'Language')} 
 right={
 <div className="relative">
 <select
 value={appSettings.language?.split('-')[0] || 'en'}
 onChange={(e) => updateSetting('language', e.target.value)}
 className="appearance-none bg-slate-100 dark:bg-[#2C2C2E] text-slate-700 dark:text-[#E5E5EA] text-[14px] font-medium rounded-lg px-3 py-1.5 focus:outline-none pr-8 cursor-pointer"
 >
 <option value="en">English</option>
 <option value="ar">العربية</option>
 <option value="kn">ಕನ್ನಡ</option>
 <option value="ml">മലയാളം</option>
 </select>
 <ChevronRight className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
 </div>
 }
 />
 <SettingsRow 
 icon={Clock} 
 iconBgClass="bg-blue-500"
 title="Time Format" 
 isLast
 right={
 <div className="relative">
 <select
 value={appSettings.timeFormat || '12h'}
 onChange={(e) => updateSetting('timeFormat', e.target.value)}
 className="appearance-none bg-slate-100 dark:bg-[#2C2C2E] text-slate-700 dark:text-[#E5E5EA] text-[14px] font-medium rounded-lg px-3 py-1.5 focus:outline-none pr-8 cursor-pointer"
 >
 <option value="12h">12-hour</option>
 <option value="24h">24-hour</option>
 </select>
 <ChevronRight className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
 </div>
 }
 />
 </SettingsGroup>

 {/* Appearance Group (iOS Toggle style) */}
 <SettingsGroup>
 <SettingsRow 
 icon={themePreference === 'dark' ? Moon : (themePreference === 'light' ? Sun : Monitor)} 
 iconBgClass={themePreference === 'light' ? "bg-amber-400" : "bg-slate-800 dark:bg-slate-700"}
 title="Theme" 
 isLast
 right={
 <div className="relative">
 <select
 value={themePreference || 'system'}
 onChange={(e) => setThemePreference(e.target.value)}
 className="appearance-none bg-slate-100 dark:bg-[#2C2C2E] text-slate-700 dark:text-[#E5E5EA] text-[14px] font-medium rounded-lg px-3 py-1.5 focus:outline-none pr-8 cursor-pointer"
 >
 <option value="light">Light</option>
 <option value="dark">Dark</option>
 <option value="system">System</option>
 </select>
 <ChevronRight className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none rotate-90" />
 </div>
 }
 />
 </SettingsGroup>

 {/* Support Group */}
 <SettingsGroup>
 <SettingsRow 
 icon={HelpCircle} 
 iconBgClass="bg-indigo-500"
 title="Help and feedback" 
 onClick={() => navigate('/coming-soon?feature=Help')}
 />
 <SettingsRow 
 icon={UserPlus} 
 iconBgClass="bg-[#34C759]"
 title="Invite a friend" 
 onClick={() => navigate('/coming-soon?feature=Invite')}
 />
 <SettingsRow 
 icon={FileText} 
 iconBgClass="bg-red-500"
 title="Feedback" 
 onClick={() => navigate('/coming-soon?feature=Feedback')}
 />
 </SettingsGroup>

 </div>

 <p className="text-center text-[12px] text-slate-400 dark:text-[#8E8E93] mt-8 mb-4 tracking-wide font-medium">
 HUMI AWAKE v1.2.0 • Build ID: 88AF2
 </p>
 </div>
 </div>
 );
};

export default Settings;
