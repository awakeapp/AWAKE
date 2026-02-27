import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity, Github, Twitter, Globe, Heart } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';

const About = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <PageLayout
            title={t('nav.about_awake')}
            showBack
        >
            <div className="space-y-8">
                {/* Logo & Version */}
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <Activity className="w-10 h-10 text-indigo-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">AWAKE</h1>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">
                            {t('common.version', 'Version')} 1.0.0
                        </p>
                    </div>
                </div>

                {/* Description */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800/80 text-center relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        {t('nav.about_desc')}
                    </p>
                </div>

                {/* Credits */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">
                        Credits
                    </h3>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-1 shadow-sm border border-slate-100 dark:border-slate-800/80 divide-y divide-slate-100 dark:divide-slate-800/60">
                        <div className="px-4 py-4 flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('nav.developed_by', 'Developed By')}</span>
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">CoolCraft Tech</span>
                        </div>
                        <div className="px-4 py-4 flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{t('nav.founded_by', 'Founded By')}</span>
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Mohammad Shabeer E.</span>
                        </div>
                    </div>
                </div>

                <div className="text-center flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 pt-8 pb-4">
                     <Heart className="w-5 h-5 text-rose-500 mb-2 animate-pulse" />
                     <p className="text-xs font-medium">Made with focus and dedication.</p>
                </div>
            </div>
        </PageLayout>
    );
};

export default About;
