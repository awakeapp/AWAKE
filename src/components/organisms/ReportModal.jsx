import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Check, Loader2, ChevronLeft, FileText } from 'lucide-react';
import clsx from 'clsx';
import { getReportData, generateUserReportPDF } from '../../utils/reportUtils';
import { useAuthContext } from '../../hooks/useAuthContext';

const REPORT_RANGES = [
    { key: 'weekly', label: 'Last 7 Days' },
    { key: 'monthly', label: 'Last 30 Days' },
    { key: 'custom', label: 'Custom Range' },
];

const ReportModal = ({ isOpen, onClose, onSuccess }) => {
    const { user } = useAuthContext();
    const [selectedRange, setSelectedRange] = useState(null);
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [stats, setStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(false);

    // Lock background scroll
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Load stats on open
    useEffect(() => {
        if (isOpen && user?.uid) {
            setLoadingStats(true);
            getReportData(user.uid).then(data => {
                setStats(data);
                setLoadingStats(false);
            }).catch(() => setLoadingStats(false));
        }
    }, [isOpen, user?.uid]);

    const resetState = () => {
        setSelectedRange(null);
        setCustomStart('');
        setCustomEnd('');
        setIsGenerating(false);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const canGenerate = !!selectedRange && (selectedRange !== 'custom' || (customStart && customEnd));

    const handleGenerate = async () => {
        if (!canGenerate || isGenerating || !user || !stats) return;
        setIsGenerating(true);

        try {
            await generateUserReportPDF(user, stats);
            onSuccess?.('Performance report downloaded successfully!');
            setTimeout(() => {
                handleClose();
            }, 300);
        } catch (err) {
            console.error('[ReportModal]', err);
            onSuccess?.(err.message || 'Report generation failed.', true);
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isOpen) return null;

    const summaryParts = [];
    if (stats) {
        summaryParts.push(`${stats.totalDays} active days`);
        summaryParts.push(`${stats.perfectDays} perfect days`);
        summaryParts.push(`${stats.averageScore}% avg score`);
    }

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex flex-col">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/40"
                    onClick={handleClose}
                />

                {/* Modal */}
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    className="relative flex flex-col h-full bg-[#F2F2F7] dark:bg-black z-10 safe-top"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-[#1C1C1E] border-b border-slate-200 dark:border-[#2C2C2E]">
                        <button
                            onClick={handleClose}
                            className="p-2 -ml-2 rounded-full active:bg-slate-100 dark:active:bg-[#2C2C2E] transition-colors"
                        >
                            <X className="w-5 h-5 text-black dark:text-white" />
                        </button>
                        <h2 className="text-[17px] font-semibold text-black dark:text-white">Performance Report</h2>
                        <div className="w-9" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-4 pb-32">
                        <div className="pt-5">
                            <h3 className="text-xs font-semibold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest px-2 mb-3">Select Period</h3>
                            <div className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden border border-slate-200 dark:border-[#2C2C2E]">
                                {REPORT_RANGES.map(({ key, label }, i) => (
                                    <div
                                        key={key}
                                        onClick={() => setSelectedRange(key)}
                                        className={clsx(
                                            "flex items-center justify-between min-h-[48px] px-4 cursor-pointer active:bg-slate-100 dark:active:bg-[#2C2C2E] transition-colors duration-75",
                                            i < REPORT_RANGES.length - 1 && "border-b border-slate-100 dark:border-[#2C2C2E]",
                                            selectedRange === key && "bg-emerald-50/50 dark:bg-emerald-900/10"
                                        )}
                                    >
                                        <p className="text-[16px] text-black dark:text-white leading-tight font-medium py-2.5">{label}</p>
                                        <div className={clsx(
                                            "w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all",
                                            selectedRange === key
                                                ? "border-emerald-500 bg-emerald-500"
                                                : "border-slate-300 dark:border-[#5C5C5E]"
                                        )}>
                                            {selectedRange === key && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Custom date pickers */}
                            {selectedRange === 'custom' && (
                                <div className="mt-4 bg-white dark:bg-[#1C1C1E] rounded-xl border border-slate-200 dark:border-[#2C2C2E] p-4 space-y-3">
                                    <div>
                                        <label className="text-[13px] font-medium text-slate-500 dark:text-[#8E8E93] mb-1 block">Start Date</label>
                                        <input
                                            type="date"
                                            value={customStart}
                                            onChange={(e) => setCustomStart(e.target.value)}
                                            className="w-full bg-[#F2F2F7] dark:bg-black border-none rounded-lg px-4 py-3 text-[16px] font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-black dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[13px] font-medium text-slate-500 dark:text-[#8E8E93] mb-1 block">End Date</label>
                                        <input
                                            type="date"
                                            value={customEnd}
                                            onChange={(e) => setCustomEnd(e.target.value)}
                                            className="w-full bg-[#F2F2F7] dark:bg-black border-none rounded-lg px-4 py-3 text-[16px] font-medium outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-black dark:text-white"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Stats summary */}
                        {stats && (
                            <div className="mt-6 px-2">
                                <p className="text-[13px] text-slate-500 dark:text-[#8E8E93] leading-relaxed">
                                    Your report includes <span className="font-semibold text-black dark:text-white">{stats.totalDays} active days</span>,{' '}
                                    <span className="font-semibold text-black dark:text-white">{stats.perfectDays} perfect days</span>,{' '}
                                    and an average score of <span className="font-semibold text-black dark:text-white">{stats.averageScore}%</span>.
                                </p>
                            </div>
                        )}

                        {loadingStats && (
                            <div className="mt-6 flex items-center gap-2 px-2">
                                <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                                <p className="text-[13px] text-slate-400">Loading report data...</p>
                            </div>
                        )}
                    </div>

                    {/* Bottom CTA */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 bg-gradient-to-t from-[#F2F2F7] dark:from-black via-[#F2F2F7]/95 dark:via-black/95 to-transparent pt-8">
                        <button
                            onClick={handleGenerate}
                            disabled={!canGenerate || isGenerating || loadingStats}
                            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white text-[16px] font-semibold rounded-xl transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Generating PDF...
                                </>
                            ) : (
                                <>
                                    <FileText className="w-5 h-5" />
                                    Download Report
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};

export default ReportModal;
