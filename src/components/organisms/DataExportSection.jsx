import { useState } from 'react';
import { FileDown, ClipboardList, CheckSquare, Wallet, Car, Loader2, Check, ChevronDown } from 'lucide-react';
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
        accentClass: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
    },
    {
        key: 'todo',
        label: 'To-Do',
        description: 'Active & completed tasks',
        icon: CheckSquare,
        accentClass: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
    },
    {
        key: 'finance',
        label: 'Finance',
        description: 'Transactions & accounts',
        icon: Wallet,
        accentClass: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    },
    {
        key: 'vehicle',
        label: 'Vehicle',
        description: 'Service records',
        icon: Car,
        accentClass: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400',
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
        <section className="space-y-4">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 ml-1 mt-6">
                Storage
            </h3>

            <div className="bg-white dark:bg-slate-900 rounded shadow-sm border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
                {/* Header / trigger row */}
                <button
                    onClick={() => setIsOpen(v => !v)}
                    className="w-full flex items-center justify-between p-4 group focus:outline-none"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <FileDown className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-slate-900 dark:text-white text-sm">Data Export</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Download your data as CSV</p>
                        </div>
                    </div>
                    <div className="p-2 rounded-full group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-colors">
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                </button>

                {/* Expandable reports panel */}
                {isOpen && (
                    <div className="border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/50">
                        {EXPORTS.map(({ key, label, description, icon: Icon, accentClass }) => {
                            const isLoading = loadingKey === key;
                            const isDone = doneKey === key;

                            return (
                                <div key={key} className="flex items-center justify-between px-4 py-3 gap-3">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className={`w-9 h-9 rounded flex items-center justify-center shrink-0 ${accentClass}`}>
                                            <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-800 dark:text-white text-sm">{label}</p>
                                            <p className="text-[11px] text-slate-500 truncate">{description}</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleExport(key)}
                                        disabled={!!loadingKey}
                                        className="flex items-center gap-1.5 px-3 py-1.5 shrink-0 text-[10px] font-black uppercase tracking-widest rounded border transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none
                                            bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300
                                            hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-200 hover:text-indigo-600"
                                    >
                                        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                                         isDone    ? <Check    className="w-3.5 h-3.5 text-emerald-500" /> :
                                                     <FileDown  className="w-3.5 h-3.5" />}
                                        {isLoading ? 'Exporting…' : isDone ? 'Done!' : 'CSV'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
};

export default DataExportSection;
