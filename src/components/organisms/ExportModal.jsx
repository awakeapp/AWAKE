import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ClipboardList, CheckSquare, Wallet, Car, Check, Loader2, ChevronLeft } from 'lucide-react';
import clsx from 'clsx';
import { useData } from '../../context/DataContext';
import { useTasks } from '../../context/TaskContext';
import { useFinance } from '../../context/FinanceContext';
import { useVehicle } from '../../context/VehicleContext';
import {
    exportRoutineData,
    exportTodoData,
    exportFinanceData,
} from '../../utils/exportUtils';
import { useScrollLock } from '../../hooks/useScrollLock';

const MODULES = [
    { key: 'routine', label: 'Routine', description: 'Daily routine task history', icon: ClipboardList },
    { key: 'tasks', label: 'Tasks', description: 'Active & completed tasks', icon: CheckSquare },
    { key: 'finance', label: 'Finance', description: 'Transactions & accounts', icon: Wallet },
    { key: 'vehicle', label: 'Vehicle', description: 'Service & fuel records', icon: Car },
];

const DATE_RANGES = [
    { key: 'today', label: 'Today' },
    { key: '7days', label: 'Last 7 Days' },
    { key: '30days', label: 'Last 30 Days' },
    { key: 'thisMonth', label: 'This Month' },
    { key: 'lastMonth', label: 'Last Month' },
    { key: 'custom', label: 'Custom Range' },
];

function getDateRange(key, customStart, customEnd) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let start, end;

    switch (key) {
        case 'today':
            start = end = today;
            break;
        case '7days':
            end = today;
            start = new Date(today);
            start.setDate(start.getDate() - 6);
            break;
        case '30days':
            end = today;
            start = new Date(today);
            start.setDate(start.getDate() - 29);
            break;
        case 'thisMonth':
            start = new Date(today.getFullYear(), today.getMonth(), 1);
            end = today;
            break;
        case 'lastMonth':
            start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            end = new Date(today.getFullYear(), today.getMonth(), 0);
            break;
        case 'custom':
            start = customStart ? new Date(customStart) : today;
            end = customEnd ? new Date(customEnd) : today;
            break;
        default:
            start = end = today;
    }
    return { start, end };
}

const ExportModal = ({ isOpen, onClose, onSuccess }) => {
    const { getAllHistory } = useData();
    const { tasks } = useTasks();
    const { transactions, categories, accounts } = useFinance();
    const { serviceRecords, vehicles } = useVehicle();

    const [selectedModule, setSelectedModule] = useState(null);
    const [selectedRange, setSelectedRange] = useState(null);
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [format, setFormat] = useState('csv');
    const [completedOnly, setCompletedOnly] = useState(false);
    const [includeNotes, setIncludeNotes] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [step, setStep] = useState(1);

    // Lock background scroll
    useScrollLock(isOpen);

    const resetState = () => {
        setSelectedModule(null);
        setSelectedRange(null);
        setCustomStart('');
        setCustomEnd('');
        setFormat('csv');
        setCompletedOnly(false);
        setIncludeNotes(true);
        setIsExporting(false);
        setStep(1);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const canProceedStep1 = !!selectedModule;
    const canProceedStep2 = !!selectedRange && (selectedRange !== 'custom' || (customStart && customEnd));
    const canExport = canProceedStep1 && canProceedStep2;

    const handleExport = async () => {
        if (!canExport || isExporting) return;
        setIsExporting(true);

        try {
            // For now, export the data using existing export functions
            switch (selectedModule) {
                case 'routine': await exportRoutineData(getAllHistory, format); break;
                case 'tasks': exportTodoData(tasks, format); break;
                case 'finance': exportFinanceData(transactions, categories, accounts, format); break;
                case 'vehicle': exportVehicleData(serviceRecords, vehicles, format); break;
            }
            onSuccess?.(`${MODULES.find(m => m.key === selectedModule)?.label} data exported successfully!`);
            setTimeout(() => {
                handleClose();
            }, 300);
        } catch (err) {
            console.error('[ExportModal]', err);
            onSuccess?.(err.message || 'Export failed.', true);
        } finally {
            setIsExporting(false);
        }
    };

    if (!isOpen) return null;

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
                            onClick={step > 1 ? () => setStep(s => s - 1) : handleClose}
                            className="p-2 -ml-2 rounded-full active:bg-slate-100 dark:active:bg-[#2C2C2E] transition-colors"
                        >
                            {step > 1 ? (
                                <ChevronLeft className="w-5 h-5 text-black dark:text-white" />
                            ) : (
                                <X className="w-5 h-5 text-black dark:text-white" />
                            )}
                        </button>
                        <h2 className="text-[17px] font-semibold text-black dark:text-white">Export Data</h2>
                        <div className="w-9" />
                    </div>

                    {/* Steps indicator */}
                    <div className="flex items-center gap-2 px-6 pt-4 pb-2">
                        {[1, 2, 3].map(s => (
                            <div key={s} className="flex items-center gap-2 flex-1">
                                <div className={clsx(
                                    "h-1 rounded-full flex-1 transition-all duration-300",
                                    s <= step ? "bg-emerald-500" : "bg-slate-200 dark:bg-[#2C2C2E]"
                                )} />
                            </div>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-4 pb-32">
                        {/* STEP 1: Module Selection */}
                        {step === 1 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="pt-4"
                            >
                                <h3 className="text-xs font-semibold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest px-2 mb-3">Select Module</h3>
                                <div className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden border border-slate-200 dark:border-[#2C2C2E]">
                                    {MODULES.map(({ key, label, description, icon: Icon }, i) => (
                                        <div
                                            key={key}
                                            onClick={() => setSelectedModule(key)}
                                            className={clsx(
                                                "flex items-center min-h-[56px] px-4 cursor-pointer active:bg-slate-100 dark:active:bg-[#2C2C2E] transition-colors duration-75",
                                                i < MODULES.length - 1 && "border-b border-slate-100 dark:border-[#2C2C2E]",
                                                selectedModule === key && "bg-emerald-50/50 dark:bg-emerald-900/10"
                                            )}
                                        >
                                            <div className="w-[30px] h-[30px] rounded-lg shrink-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 mr-3.5">
                                                <Icon strokeWidth={2} className="w-[18px] h-[18px]" />
                                            </div>
                                            <div className="flex-1 min-w-0 py-2.5">
                                                <p className="text-[16px] text-black dark:text-white leading-tight font-medium">{label}</p>
                                                <p className="text-[13px] text-slate-500 dark:text-[#8E8E93] mt-0.5">{description}</p>
                                            </div>
                                            <div className={clsx(
                                                "w-5 h-5 rounded-full border-2 shrink-0 ml-3 flex items-center justify-center transition-all",
                                                selectedModule === key
                                                    ? "border-emerald-500 bg-emerald-500"
                                                    : "border-slate-300 dark:border-[#5C5C5E]"
                                            )}>
                                                {selectedModule === key && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 2: Date Range */}
                        {step === 2 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="pt-4"
                            >
                                <h3 className="text-xs font-semibold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest px-2 mb-3">Select Date Range</h3>
                                <div className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden border border-slate-200 dark:border-[#2C2C2E]">
                                    {DATE_RANGES.map(({ key, label }, i) => (
                                        <div
                                            key={key}
                                            onClick={() => setSelectedRange(key)}
                                            className={clsx(
                                                "flex items-center justify-between min-h-[48px] px-4 cursor-pointer active:bg-slate-100 dark:active:bg-[#2C2C2E] transition-colors duration-75",
                                                i < DATE_RANGES.length - 1 && "border-b border-slate-100 dark:border-[#2C2C2E]",
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
                            </motion.div>
                        )}

                        {/* STEP 3: Advanced Options */}
                        {step === 3 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="pt-4"
                            >
                                <h3 className="text-xs font-semibold text-slate-500 dark:text-[#8E8E93] uppercase tracking-widest px-2 mb-3">Advanced Options</h3>
                                <div className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden border border-slate-200 dark:border-[#2C2C2E]">
                                    {/* File format */}
                                    <div className="flex items-center justify-between min-h-[48px] px-4 border-b border-slate-100 dark:border-[#2C2C2E]">
                                        <p className="text-[16px] text-black dark:text-white leading-tight font-medium py-2.5">File Format</p>
                                        <div className="relative">
                                            <select
                                                value={format}
                                                onChange={(e) => setFormat(e.target.value)}
                                                className="appearance-none bg-slate-100 dark:bg-[#2C2C2E] text-slate-700 dark:text-[#E5E5EA] text-[14px] font-medium rounded-lg px-3 py-1.5 focus:outline-none pr-8 cursor-pointer"
                                            >
                                                <option value="csv">CSV</option>
                                                <option value="xlsx">XLSX</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Completed only */}
                                    <div className="flex items-center justify-between min-h-[48px] px-4 border-b border-slate-100 dark:border-[#2C2C2E]">
                                        <p className="text-[16px] text-black dark:text-white leading-tight font-medium py-2.5">Completed Only</p>
                                        <button
                                            onClick={() => setCompletedOnly(!completedOnly)}
                                            className={clsx(
                                                "w-[51px] h-[31px] rounded-full p-[2px] transition-colors duration-200",
                                                completedOnly ? "bg-emerald-500" : "bg-slate-200 dark:bg-[#39393D]"
                                            )}
                                        >
                                            <div className={clsx(
                                                "w-[27px] h-[27px] rounded-full bg-white shadow-sm transition-transform duration-200",
                                                completedOnly ? "translate-x-[20px]" : "translate-x-0"
                                            )} />
                                        </button>
                                    </div>

                                    {/* Include notes */}
                                    <div className="flex items-center justify-between min-h-[48px] px-4">
                                        <p className="text-[16px] text-black dark:text-white leading-tight font-medium py-2.5">Include Notes</p>
                                        <button
                                            onClick={() => setIncludeNotes(!includeNotes)}
                                            className={clsx(
                                                "w-[51px] h-[31px] rounded-full p-[2px] transition-colors duration-200",
                                                includeNotes ? "bg-emerald-500" : "bg-slate-200 dark:bg-[#39393D]"
                                            )}
                                        >
                                            <div className={clsx(
                                                "w-[27px] h-[27px] rounded-full bg-white shadow-sm transition-transform duration-200",
                                                includeNotes ? "translate-x-[20px]" : "translate-x-0"
                                            )} />
                                        </button>
                                    </div>
                                </div>

                                {/* Summary */}
                                <div className="mt-5 px-2">
                                    <p className="text-[13px] text-slate-500 dark:text-[#8E8E93] leading-relaxed">
                                        Exporting <span className="font-semibold text-black dark:text-white">{MODULES.find(m => m.key === selectedModule)?.label}</span> data
                                        {selectedRange && <> for <span className="font-semibold text-black dark:text-white">{DATE_RANGES.find(r => r.key === selectedRange)?.label}</span></>}
                                        {' '}as <span className="font-semibold text-black dark:text-white">{format.toUpperCase()}</span>
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Bottom CTA */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 bg-gradient-to-t from-[#F2F2F7] dark:from-black via-[#F2F2F7]/95 dark:via-black/95 to-transparent pt-8">
                        {step < 3 ? (
                            <button
                                onClick={() => setStep(s => s + 1)}
                                disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
                                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white text-[16px] font-semibold rounded-xl transition-all disabled:opacity-40 disabled:pointer-events-none"
                            >
                                Continue
                            </button>
                        ) : (
                            <button
                                onClick={handleExport}
                                disabled={isExporting}
                                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white text-[16px] font-semibold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {isExporting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Download className="w-5 h-5" />
                                        Generate Export
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};

export default ExportModal;
