import { useVehicle } from '../../../context/VehicleContext';
import { format } from 'date-fns';
import { Fuel, Settings, Landmark, Zap, AlertTriangle, Wallet, TrendingUp, History, Archive, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LedgerScreen = ({ activeVehicle, trendData, maxTrendCost, stats, combinedHistory, historyFilter, setHistoryFilter, onAddEntry, sortedVehicles, showArchived, getIcon, setVehicleActive, setDeleteConfirmId, toggleArchiveVehicle }) => {
    
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Cost Breakdown */}
            {stats?.breakdown && (
                <section className="mt-2 mb-2">
                    <h3 className="font-bold text-slate-900 dark:text-white px-1 mb-2 text-sm flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-slate-400" />
                        Cost Breakdown
                    </h3>
                    <div className="grid grid-cols-4 gap-2">
                        {[
                            { label: 'Fuel', amount: stats.breakdown.fuel, icon: Fuel, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
                            { label: 'Service', amount: stats.breakdown.service, icon: Settings, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                            { label: 'EMI', amount: stats.breakdown.emi, icon: Landmark, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
                            { label: 'Insure', amount: stats.breakdown.insurance, icon: Zap, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' }
                        ].map(item => (
                            <div key={item.label} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-2 text-center shadow-sm flex flex-col items-center justify-between">
                                <div className={`w-6 h-6 rounded-full ${item.bg} ${item.color} flex items-center justify-center mb-1`}>
                                    <item.icon className="w-3 h-3" />
                                </div>
                                <p className="text-[9px] font-bold text-slate-500 uppercase">{item.label}</p>
                                <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                                    ₹{item.amount > 1000 ? (item.amount / 1000).toFixed(1) + 'k' : item.amount}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* 6 Month Trend */}
            {trendData.length > 0 && (
                <section className="mt-6 mb-2">
                    <h3 className="font-bold text-slate-900 dark:text-white px-1 mb-3 text-sm flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-slate-400" />
                        6-Month Trend
                    </h3>
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-end justify-between h-32">
                        {trendData.map((data, i) => (
                            <div key={i} className="flex flex-col items-center gap-2 w-full group relative">
                                <span className="absolute -top-6 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    ₹{data.cost > 1000 ? (data.cost / 1000).toFixed(1) + 'k' : data.cost}
                                </span>
                                <div className="w-full max-w-[24px] bg-slate-100 dark:bg-slate-800 rounded-t-lg relative flex flex-col justify-end h-16">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${(data.cost / maxTrendCost) * 100}%` }}
                                        className="bg-indigo-500 rounded-t-lg w-full transition-all group-hover:bg-indigo-400"
                                    />
                                </div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase">{data.label}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Transaction Log */}
            <section className="mt-6">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                        <History className="w-4 h-4 text-slate-500" />
                        Transactions
                    </h3>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar mb-4">
                    {['All', 'Fuel', 'Service', 'EMI', 'Insurance'].map(f => (
                        <button
                            key={f}
                            onClick={() => setHistoryFilter(f)}
                            className={`text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${historyFilter === f ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                <div className="space-y-3">
                     {combinedHistory.length === 0 ? (
                        <div className="text-center py-8 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                            <Wallet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-slate-400 text-sm">No transaction records found.</p>
                        </div>
                    ) : (
                        combinedHistory.map(record => (
                            <div key={record.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-start justify-between group hover:border-indigo-200 transition-colors">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h5 className="font-bold text-slate-900 dark:text-white text-sm">{record.type}</h5>
                                        {record.financeTxId && <div className="w-2 h-2 rounded-full bg-emerald-500" title="Synced with Finance"></div>}
                                    </div>
                                    <p className="text-xs text-slate-400">{format(new Date(record.date), 'MMM d, yyyy')} • {record.category}</p>
                                    {record.notes && (
                                        <p className="text-xs text-slate-500 mt-2 line-clamp-2">{record.notes}</p>
                                    )}
                                </div>
                                <div className="text-right">
                                    {record.cost > 0 && (
                                        <span className="block font-bold text-slate-900 dark:text-white text-sm">₹{Number(record.cost).toLocaleString()}</span>
                                    )}
                                    {record.odometer && (
                                        <span className="block text-[10px] text-slate-400 mt-1 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-lg inline-block">
                                            {Number(record.odometer).toLocaleString()} km
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
             
            {/* Vehicle List (for inactive or archived view) */}
            {(showArchived || (activeVehicle ? sortedVehicles.length > 1 : true)) && (
            <div className="space-y-3 mt-4">
            {sortedVehicles.length === 0 && showArchived ? (
            <div className="text-center py-8 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <Archive className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No archived vehicles found.</p>
            </div>
            ) : (
            sortedVehicles.filter(v => showArchived ? true : !v.isActive).map(vehicle => {
            const Icon = getIcon(vehicle.type);
            return (
            <motion.div
            key={vehicle.id}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`bg-white dark:bg-slate-900 p-4 rounded-2xl border ${vehicle.isActive ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-100 dark:border-slate-800'} shadow-sm relative overflow-hidden cursor-pointer hover:shadow-md transition-all`}
            onClick={() => !showArchived && setVehicleActive(vehicle.id)}
            >
            <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${vehicle.isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
            <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
            <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">{vehicle.name}</h4>
            {vehicle.isActive && <CheckCircle className="w-4 h-4 text-indigo-500" />}
            </div>
            <p className="text-xs text-slate-500">{vehicle.brandModel}</p>
            </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-50 dark:border-slate-800 flex justify-end gap-2">
            <button
            onClick={(e) => {
            e.stopPropagation();
            setDeleteConfirmId(vehicle.id);
            }}
            className="text-red-400 hover:text-red-600 text-[10px] font-bold uppercase tracking-wider px-2 py-1"
            >
            Delete
            </button>
            <button
            onClick={(e) => {
            e.stopPropagation();
            toggleArchiveVehicle(vehicle.id);
            }}
            className="text-slate-400 hover:text-slate-600 text-[10px] font-bold uppercase tracking-wider px-2 py-1"
            >
            {vehicle.isArchived ? 'Unarchive' : 'Archive'}
            </button>
            </div>
            </motion.div>
            );
            }))}

            </div>
            )}
        </div>
    );
};

export default LedgerScreen;
