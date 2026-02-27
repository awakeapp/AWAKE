import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';

const ComingSoon = () => {
    const navigate = useNavigate();

    return (
        <PageLayout
            title="Feature"
            showBack
        >
            <div className="flex flex-col items-center justify-center p-6 min-h-[60vh]">
                <div className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-[#2C2C2E] rounded-2xl p-8 max-w-sm w-full text-center shadow-sm dark:shadow-none mb-8">
                    <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Clock className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h1 className="text-2xl font-bold mb-3 tracking-tight">Coming Soon</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-[15px] leading-relaxed">
                        We're working hard to bring this feature to you. Check back later for updates.
                    </p>
                    <button
                        onClick={() => navigate(-1)}
                        className="mt-8 px-6 py-3 bg-slate-100 dark:bg-[#2C2C2E] hover:bg-slate-200 dark:hover:bg-[#3A3A3C] text-slate-800 dark:text-white rounded-xl font-semibold transition-colors w-full flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Go Back
                    </button>
                </div>
            </div>
        </PageLayout>
    );
};

export default ComingSoon;
