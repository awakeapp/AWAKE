import { useState } from 'react';
import { FileDown, ClipboardList, CheckSquare, Wallet, Car, Loader2, Check, ChevronDown } from 'lucide-react';
import clsx from 'clsx';
import { useData } from '../../context/DataContext';
import { useTasks } from '../../context/TaskContext';
import { useFinance } from '../../context/FinanceContext';
import { useVehicle } from '../../context/VehicleContext';
import {
    exportRoutineData,
    exportTodoData,
    exportFinanceData,
    exportVehicleData
} from '../../utils/exportUtils';

const EXPORTS = [
    {
        key: 'routine',
        label: 'Routine',
        description: 'Task history with status',
        icon: ClipboardList,
    },
    {
        key: 'todo',
        label: 'To-Do',
        description: 'Active & completed tasks',
        icon: CheckSquare,
    },
    {
        key: 'finance',
        label: 'Finance',
        description: 'Transactions & accounts',
        icon: Wallet,
    },
    {
        key: 'vehicle',
        label: 'Vehicle',
        description: 'Service records',
        icon: Car,
    },
];

const DataExportSection = ({ showToast }) => {
    const { getAllHistory } = useData();
    const { tasks } = useTasks();
    const { transactions, categories, accounts } = useFinance();
    const { serviceRecords, vehicles } = useVehicle();

    const [isOpen, setIsOpen] = useState(false);
    const [loadingKey, setLoadingKey] = useState(null);
    const [doneKey, setDoneKey] = useState(null);

    const handleExport = async (key) => {
        if (loadingKey) return;
        setLoadingKey(key);
        try {
            switch (key) {
                case 'routine': await exportRoutineData(getAllHistory); break;
                case 'todo':    exportTodoData(tasks); break;
                case 'finance': exportFinanceData(transactions, categories, accounts); break;
                case 'vehicle': exportVehicleData(serviceRecords, vehicles); break;
            }
            setDoneKey(key);
            showToast?.(`${EXPORTS.find(e => e.key === key)?.label} data exported!`);
            setTimeout(() => setDoneKey(null), 2000);
        } catch (err) {
            console.error('[DataExport]', err);
            showToast?.(err.message || 'Export failed.', 'error');
        } finally {
            setLoadingKey(null);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800/60 last:border-none">
            {/* Header / trigger row */}
            <button
                onClick={() => setIsOpen(v => !v)}
                className={clsx(
                    "w-full flex items-center justify-between px-4 min-h-[56px] focus:outline-none transition-colors",
                    isOpen ? "bg-slate-50 dark:bg-slate-800/50" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}
            >
                <div className="flex items-center gap-4">
                    <div className="text-slate-400 shrink-0">
                        <FileDown strokeWidth={2} className="w-5 h-5" />
                    </div>
                    <div className="text-left py-2">
                        <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-tight">Data Export</p>
                        <p className="text-xs text-slate-500 mt-0.5">Download your data as CSV</p>
                    </div>
                </div>
                <div className="shrink-0 ml-4 flex items-center">
                    <ChevronDown className={clsx("w-5 h-5 text-slate-300 transition-transform duration-200", isOpen && "rotate-180")} />
                </div>
            </button>

            {/* Expandable reports panel */}
            {isOpen && (
                <div className="bg-slate-50/50 dark:bg-slate-900/50 divide-y divide-slate-100 dark:divide-slate-800/50 px-4 pb-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    {EXPORTS.map(({ key, label, description, icon: Icon }) => {
                        const isLoading = loadingKey === key;
                        const isDone = doneKey === key;

                        return (
                            <div key={key} className="flex items-center justify-between py-3 gap-3">
                                <div className="flex items-center gap-3 flex-1 min-w-0 pl-9">
                                    <div className="text-slate-400 shrink-0">
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-medium text-slate-700 dark:text-slate-300 text-sm">{label}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleExport(key)}
                                    disabled={!!loadingKey}
                                    className={clsx(
                                        "flex items-center gap-1.5 px-3 py-1.5 shrink-0 text-xs font-semibold rounded border transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none",
                                        isDone 
                                            ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
                                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
                                    )}
                                >
                                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                                        isDone    ? <Check    className="w-3.5 h-3.5" /> :
                                                    <FileDown  className="w-3.5 h-3.5" />}
                                    {isLoading ? 'Exporting...' : isDone ? 'Done' : 'Export'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default DataExportSection;
