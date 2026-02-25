import { useNavigate } from 'react-router-dom';
import { useVehicle } from '../../context/VehicleContext';
import ErrorDisplay from '../../components/molecules/ErrorDisplay';
import { useData } from '../../context/DataContext';
import {
 ArrowLeft, Plus, Car, Archive, CheckCircle, Bike, Truck,
 Fuel, Calendar, Gauge, AlertTriangle, TrendingUp, Zap,
 History, Wallet, MoreHorizontal, Bell, Settings, Landmark
} from 'lucide-react';
import { useState } from 'react';
import AddVehicleModal from './AddVehicleModal';
import AddLoanModal from './AddLoanModal';
import PayEMIModal from './PayEMIModal';
import AmortizationScheduleModal from './AmortizationScheduleModal';
import PrepaymentCalculatorModal from './PrepaymentCalculatorModal';
import FollowUpList from '../../components/organisms/vehicle/FollowUpList';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const VehicleDashboard = () => {
 const navigate = useNavigate();
 const {
 vehicles,
 addVehicle,
 updateVehicle,
 toggleArchiveVehicle,
 setVehicleActive,
 getActiveVehicle,
 serviceRecords,
 followUps,
 getVehicleStats,
 getLoanForVehicle,
 getLoanDetailedStatus,
 addLoan,
 payEMI,
 getVehicleRisks,
 deleteVehicle
 } = useVehicle();

 const { addTask } = useData();

 const [isAddOpen, setIsAddOpen] = useState(false);
 const [editingVehicle, setEditingVehicle] = useState(null);
 const [showArchived, setShowArchived] = useState(false);
 const [activeTab, setActiveTab] = useState('overview');
 const [isAddLoanOpen, setIsAddLoanOpen] = useState(false);
 const [isPayEMIOpen, setIsPayEMIOpen] = useState(false);
 const [isAmortizationOpen, setIsAmortizationOpen] = useState(false);
 const [isPrepaymentOpen, setIsPrepaymentOpen] = useState(false);
 const [historyFilter, setHistoryFilter] = useState('All');
 const [historySort, setHistorySort] = useState('date_desc');

 const activeVehicle = getActiveVehicle();
 const stats = activeVehicle ? getVehicleStats(activeVehicle.id) : null;
 const risks = activeVehicle ? getVehicleRisks(activeVehicle.id) : [];

 // Next Service logic
 const activeFollowUps = activeVehicle ? followUps.filter(f => f.vehicleId === activeVehicle.id && f.status !== 'completed') : [];
 let nextService = activeFollowUps.find(f => (f.type || '').toLowerCase().includes('service') || (f.type || '').toLowerCase().includes('oil'));
 if (!nextService && activeFollowUps.length > 0) nextService = activeFollowUps[0];

 // 6 Month Trend logic
 const getSixMonthTrend = () => {
     if (!activeVehicle || !stats) return [];
     const months = Array.from({ length: 6 }).map((_, i) => {
         const d = new Date();
         d.setMonth(d.getMonth() - i);
         return {
             label: format(d, 'MMM'),
             month: d.getMonth(),
             year: d.getFullYear(),
             cost: 0
         };
     }).reverse();

     const loan = getLoanForVehicle(activeVehicle.id);
     const loanPayments = loan ? loan.history || [] : [];
     
     const allTxs = [
         ...serviceRecords.filter(r => r.vehicleId === activeVehicle.id).map(r => ({ date: new Date(r.date), cost: Number(r.cost) || 0 })),
         ...loanPayments.map(p => ({ date: new Date(p.date), cost: Number(p.amount) || 0 }))
     ];

     allTxs.forEach(tx => {
         const bucket = months.find(m => m.month === tx.date.getMonth() && m.year === tx.date.getFullYear());
         if (bucket) {
             bucket.cost += tx.cost;
         }
     });

     return months;
 };
 const trendData = activeVehicle && activeTab === 'overview' ? getSixMonthTrend() : [];
 const maxTrendCost = trendData.length ? Math.max(...trendData.map(d => d.cost)) || 1 : 1;

 // Sort logic
 const visibleVehicles = vehicles.filter(v => showArchived ? v.isArchived : !v.isArchived);
 const sortedVehicles = [...visibleVehicles].sort((a, b) => {
 if (a.isActive) return -1;
 if (b.isActive) return 1;
 return 0;
 });

 const activeVehicleRecords = activeVehicle
 ? serviceRecords
 .filter(r => r.vehicleId === activeVehicle.id)
 .sort((a, b) => new Date(b.date) - new Date(a.date))
 : [];

 // History logic
 const activeLoanLocal = activeVehicle ? getLoanForVehicle(activeVehicle.id) : null;
 const loanPaymentsLocal = activeLoanLocal ? activeLoanLocal.history || [] : [];
     
 let combinedHistory = [
     ...activeVehicleRecords.map(r => ({ ...r, category: r.type.toLowerCase().includes('fuel') ? 'Fuel' : r.type.toLowerCase().includes('insurance') ? 'Insurance' : 'Service' })),
     ...loanPaymentsLocal.map(p => ({ ...p, type: 'EMI', date: p.date, cost: p.amount, category: 'EMI', id: p.id || Math.random().toString() }))
 ];

 if (historyFilter !== 'All') {
     combinedHistory = combinedHistory.filter(h => h.category === historyFilter);
 }

 combinedHistory.sort((a, b) => {
     if (historySort === 'date_desc') return new Date(b.date) - new Date(a.date);
     if (historySort === 'date_asc') return new Date(a.date) - new Date(b.date);
     if (historySort === 'cost_desc') return (Number(b.cost)||0) - (Number(a.cost)||0);
     if (historySort === 'cost_asc') return (Number(a.cost)||0) - (Number(b.cost)||0);
     return 0;
 });

 const groupedHistoryArray = [];
 const groupedHistoryMap = combinedHistory.reduce((acc, curr) => {
     const monthYear = format(new Date(curr.date), 'MMMM yyyy');
     if (!acc[monthYear]) acc[monthYear] = { monthYear, records: [], total: 0 };
     acc[monthYear].records.push(curr);
     acc[monthYear].total += (Number(curr.cost) || 0);
     return acc;
 }, {});
     
 for(const key in groupedHistoryMap) {
     groupedHistoryArray.push(groupedHistoryMap[key]);
 }
     
 const exportCSV = () => {
     if (!activeVehicle) return;
     const headers = ['Date', 'Type', 'Category', 'Cost', 'Odometer', 'Notes'];
     const rows = combinedHistory.map(r => [
         format(new Date(r.date), 'yyyy-MM-dd'),
         r.type,
         r.category,
         r.cost || 0,
         r.odometer || '',
         r.notes ? `"${r.notes.replace(/"/g, '""')}"` : ''
     ].join(','));
     const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
     const encodedUri = encodeURI(csvContent);
     const link = document.createElement('a');
     link.setAttribute('href', encodedUri);
     link.setAttribute('download', `${activeVehicle.name}_history.csv`);
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
 };

 const handleSaveVehicle = (data) => {
 if (editingVehicle) {
 updateVehicle(editingVehicle.id, data);
 } else {
 addVehicle(data);
 }
 };

 const handleSaveLoan = (loanData) => {
 addLoan(loanData);
 };

 const handleRecordPayment = (loanId, paymentData) => {
 payEMI(loanId, paymentData);
 };

 const activeLoan = activeVehicle ? getLoanForVehicle(activeVehicle.id) : null;
 const loanDetail = activeLoan ? getLoanDetailedStatus(activeLoan.id) : null;

 const handleAddToRoutine = () => {
 if (!activeVehicle) return;
 addTask({
 name: `Check ${activeVehicle.name} condition`,
 time: '09:00',
 category: 'EARLY MORNING',
 icon: '🚗'
 });
 alert("Added to today's routine!");
 };

 const getIcon = (type) => {
 switch (type) {
 case 'bike':
 case 'scooter': return Bike;
 case 'commercial': return Truck;
 default: return Car;
 }
 };

 if (vehicles.length === 0) {
 return (
 <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 flex flex-col items-center justify-center">
 <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-6">
 <Car className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
 </div>
 <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Vehicle Management</h1>
 <p className="text-slate-500 dark:text-slate-400 mb-8 text-center max-w-xs">
 Track expenses, maintenance, and reminders for your fleet.
 </p>
 <button
 onClick={() => setIsAddOpen(true)}
 className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2"
 >
 <Plus className="w-5 h-5" /> Add First Vehicle
 </button>
 <AddVehicleModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSave={handleSaveVehicle} />
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
 {/* Header */}
 <header
 className="bg-white dark:bg-slate-900 sticky top-0 z-20 shadow-sm animate-in slide-in-from-top-4 duration-300"
 style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
 >
 <div className="px-6 pt-4 pb-4 flex items-center justify-between">
 <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
 {showArchived ? 'Archived Vehicles' : 'Vehicle Dashboard'}
 </h1>
 <button
 onClick={() => setShowArchived(!showArchived)}
 className={`p-2 rounded-full transition-colors ${showArchived ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-100 text-slate-500'}`}
 >
 <Archive className="w-5 h-5" />
 </button>
 </div>

 {/* Vehicle Selector / Active Card */}
 {activeVehicle && !showArchived && (
 <div className="px-6 pb-6">
 <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-indigo-900 dark:to-slate-900 rounded-2xl p-4 text-white shadow-xl shadow-slate-900/10 relative overflow-hidden">
 {/* Alert Badge if Overdue */}
 {stats?.overdueCount > 0 && (
 <div className="absolute top-4 right-4 bg-red-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 animate-pulse">
 <AlertTriangle className="w-3 h-3" />
 {stats.overdueCount} Alerts
 </div>
 )}

 <div className="flex justify-between items-start mb-4">
 <div>
 <h2 className="text-xl font-bold mb-0.5">{activeVehicle.name}</h2>
 <p className="text-slate-400 text-xs font-medium">{activeVehicle.brandModel}</p>
 </div>
 <div className="flex flex-col items-end gap-1">
 <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
 {(() => { const Icon = getIcon(activeVehicle.type); return <Icon className="w-5 h-5 text-white" />; })()}
 </div>
 </div>
 </div>

 <div className="flex divide-x divide-white/10 bg-white/5 rounded-xl backdrop-blur-sm">
 <div className="flex-1 p-2 text-center">
 <p className="text-[9px] text-slate-400 uppercase font-bold mb-0.5">Health</p>
 <div className="flex items-center justify-center gap-1">
 <div className="w-8 h-1 bg-white/10 rounded-full overflow-hidden">
 <div className={`h-full ${stats?.healthScore > 80 ? 'bg-emerald-400' : stats?.healthScore > 50 ? 'bg-orange-400' : 'bg-red-400'}`} style={{ width: `${stats?.healthScore || 0}%` }}></div>
 </div>
 </div>
 <p className="font-bold text-xs mt-1">{stats?.healthScore || 0}%</p>
 </div>
 <div className="flex-1 p-2 text-center">
 <p className="text-[9px] text-slate-400 uppercase font-bold mb-0.5">Total Cost</p>
 <p className="font-bold text-xs">₹{stats?.totalSpend.toLocaleString()}</p>
 </div>
 <div className="flex-1 p-2 text-center">
 <p className="text-[9px] text-slate-400 uppercase font-bold mb-0.5">Month Cost</p>
 <p className="font-bold text-xs">₹{stats?.monthSpend.toLocaleString()}</p>
 </div>
 </div>
 </div>

 {/* Tabs */}
 <div className="flex mt-4 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
 <button
 onClick={() => setActiveTab('overview')}
 className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'overview' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-white' : 'text-slate-500'}`}
 >
 Overview
 </button>
 <button
 onClick={() => setActiveTab('history')}
 className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'history' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-white' : 'text-slate-500'}`}
 >
 History
 </button>
 <button
 onClick={() => setActiveTab('loans')}
 className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'loans' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-white' : 'text-slate-500'}`}
 >
 Loans
 </button>
 </div>
 </div>
 )}
 </header>

 <div className="px-6 py-4">
 {activeVehicle && !showArchived ? (
 activeTab === 'overview' ? (
 <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

 {/* Smart Actions / Routine */}
 <section>
 <div className="flex gap-2">
 <button
 onClick={handleAddToRoutine}
 className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex items-center justify-center gap-2 shadow-sm hover:border-indigo-300 transition-colors"
 >
 <Zap className="w-4 h-4 text-orange-500" />
 <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Check Routine</span>
 </button>
 <button
 onClick={() => {
 setEditingVehicle(activeVehicle);
 setIsAddOpen(true);
 }}
 className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex items-center justify-center gap-2 shadow-sm hover:border-indigo-300 transition-colors"
 >
 <Settings className="w-4 h-4 text-slate-500" />
 <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Edit Details</span>
 </button>
 </div>
 </section>

 {/* Cost Breakdown */}
 {stats?.breakdown && (
 <section className="mt-6 mb-2">
 <h3 className="font-bold text-slate-900 dark:text-white px-1 mb-2 text-sm flex items-center gap-2">
 <Wallet className="w-4 h-4 text-slate-400" />
 Total Cost Breakdown
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
             Last 6 Months Trend
         </h3>
         <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-end justify-between h-32">
             {trendData.map((data, i) => (
                 <div key={i} className="flex flex-col items-center gap-2 w-full group relative">
                     <span className="absolute -top-6 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                         ₹{data.cost > 1000 ? (data.cost/1000).toFixed(1)+'k' : data.cost}
                     </span>
                     <div className="w-full max-w-[24px] bg-slate-100 dark:bg-slate-800 rounded-t-lg relative flex flex-col justify-end h-16">
                         <motion.div 
                             initial={{height: 0}} 
                             animate={{height: `${(data.cost / maxTrendCost) * 100}%`}}
                             className="bg-indigo-500 rounded-t-lg w-full transition-all group-hover:bg-indigo-400"
                         />
                     </div>
                     <p className="text-[9px] font-bold text-slate-400 uppercase">{data.label}</p>
                 </div>
             ))}
         </div>
     </section>
 )}

 {/* Next Service Countdown */}
 {nextService && (
     <section className="mt-6 mb-2">
         <h3 className="font-bold text-slate-900 dark:text-white px-1 mb-2 text-sm flex items-center gap-2">
             <Calendar className="w-4 h-4 text-slate-400" />
             Next Service
         </h3>
         <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 flex items-center justify-between">
             <div className="flex items-center gap-3">
                 <div className="p-2 bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-200 rounded-lg">
                     <Settings className="w-5 h-5" />
                 </div>
                 <div>
                     <p className="font-bold text-indigo-900 dark:text-indigo-100 text-sm">{nextService.type}</p>
                     <p className="text-[10px] text-indigo-700 dark:text-indigo-300 mt-0.5 max-w-[180px] break-words">
                        {nextService.dueDate && `Due: ${format(new Date(nextService.dueDate), 'MMM d, yyyy')} `}
                        {nextService.dueDate && nextService.dueOdometer && '| '}
                        {nextService.dueOdometer && `At ${Number(nextService.dueOdometer).toLocaleString()} km`}
                     </p>
                 </div>
             </div>
             <div className="text-right flex flex-col items-end gap-2">
                {nextService.dueDate && (
                    <div>
                        <p className="font-bold text-indigo-900 dark:text-indigo-100 leading-none">
                            {Math.max(0, Math.ceil((new Date(nextService.dueDate) - new Date()) / (1000 * 60 * 60 * 24)))}
                        </p>
                        <p className="text-[9px] text-indigo-600 dark:text-indigo-400 uppercase font-bold tracking-wider">Days</p>
                    </div>
                )}
                {nextService.dueOdometer && (
                    <div>
                        <p className="font-bold text-indigo-900 dark:text-indigo-100 leading-none">
                            {Math.max(0, Number(nextService.dueOdometer) - Number(activeVehicle.odometer)).toLocaleString()}
                        </p>
                        <p className="text-[9px] text-indigo-600 dark:text-indigo-400 uppercase font-bold tracking-wider">km left</p>
                    </div>
                )}
             </div>
         </div>
     </section>
 )}

 <FollowUpList vehicle={activeVehicle} />

 {/* Risk Alerts & Insights */}
 {risks.length > 0 && (
 <section className="space-y-2 mt-6">
 <h3 className="font-bold text-slate-900 dark:text-white px-1 text-sm">Insights & Alerts</h3>
 <div className="grid gap-2">
 {risks.map((risk, index) => (
 <div
 key={index}
 className={`p-3 rounded-xl border flex items-start gap-3 ${risk.type === 'critical' ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900' :
 risk.type === 'warning' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-900' :
 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900'
 }`}
 >
 <div className={`p-2 rounded-full ${risk.type === 'critical' ? 'bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-200' :
 risk.type === 'warning' ? 'bg-orange-100 dark:bg-orange-800 text-orange-600 dark:text-orange-200' :
 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-200'
 }`}>
 <AlertTriangle className="w-4 h-4" />
 </div>
 <div className="flex-1">
 <h4 className={`font-bold text-sm leading-tight ${risk.type === 'critical' ? 'text-red-900 dark:text-red-100' :
 risk.type === 'warning' ? 'text-orange-900 dark:text-orange-100' :
 'text-blue-900 dark:text-blue-100'
 }`}>{risk.title}</h4>
 <p className={`text-[10px] mt-0.5 leading-tight ${risk.type === 'critical' ? 'text-red-700 dark:text-red-300' :
 risk.type === 'warning' ? 'text-orange-700 dark:text-orange-300' :
 'text-blue-700 dark:text-blue-300'
 }`}>{risk.detail}</p>
 {risk.title.includes('EMI') && risk.type === 'critical' && activeLoan && (
 <button onClick={() => setIsPayEMIOpen(true)} className="mt-2 text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 bg-red-600 text-white rounded-lg shadow-sm hover:bg-red-700 transition-colors">
 Pay EMI Now
 </button>
 )}
 {risk.title.includes('Overdue') && !risk.title.includes('EMI') && (
 <button onClick={() => navigate('/routine')} className="mt-2 text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 border border-current opacity-80 rounded-lg shadow-sm hover:opacity-100 transition-opacity">
 Resolve Now
 </button>
 )}
 </div>
 </div>
 ))}
 </div>
 </section>
 )}

 {/* Service Insight */}
 {stats?.lastServiceDate && (
 <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl flex items-start gap-3 border border-emerald-100 dark:border-emerald-800">
 <div className="bg-emerald-100 dark:bg-emerald-800 p-2 rounded-full">
 <History className="w-4 h-4 text-emerald-600 dark:text-white" />
 </div>
 <div>
 <h4 className="font-bold text-emerald-900 dark:text-emerald-100 text-sm">Last Service</h4>
 <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
 {stats.lastServiceType} on {format(new Date(stats.lastServiceDate), 'MMM d, yyyy')}
 </p>
 </div>
 </div>
 )}

 {/* Other Vehicles Header if exists */}
 {vehicles.length > 1 && (
 <h3 className="font-bold text-slate-900 dark:text-white pt-4">Other Vehicles</h3>
 )}
 </div>
 ) : activeTab === 'loans' ? (
 // LOANS TAB
 <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
 <div className="flex items-center justify-between">
 <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
 <Landmark className="w-4 h-4 text-slate-500" />
 Vehicle Financing
 </h3>
 {activeLoan ? (
 <div className="flex gap-2">
 {loanDetail?.status === 'overdue' && (
 <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2 py-1 rounded-full dark:bg-red-900/30 dark:text-red-400 flex items-center gap-1 animate-pulse">
 <AlertTriangle className="w-3 h-3" /> Overdue
 </span>
 )}
 {loanDetail?.status === 'pending' && (
 <span className="text-[10px] font-bold bg-orange-50 text-orange-600 px-2 py-1 rounded-full dark:bg-orange-900/30 dark:text-orange-400">
 Due Soon
 </span>
 )}
 {loanDetail?.status === 'paid' && (
 <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full dark:bg-emerald-900/30 dark:text-emerald-400">
 Paid
 </span>
 )}
 </div>
 ) : (
 <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full dark:bg-indigo-900/30 dark:text-indigo-400">Available</span>
 )}
 </div>

 {activeLoan ? (
 <div className="space-y-4">
 {/* Loan Summary Card */}
 <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
 <div className="flex justify-between items-start mb-6">
 <div>
 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Total Loan Principal</p>
 <h4 className="text-2xl font-bold text-slate-900 dark:text-white">₹{activeLoan.totalLoanAmount.toLocaleString()}</h4>
 <p className="text-xs text-slate-500 mt-1">{activeLoan.lender}</p>
 </div>
 <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-2xl">
 <Landmark className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
 </div>
 </div>

 <div className="space-y-4">
 <div>
 <div className="flex justify-between text-xs font-bold mb-2">
 <span className="text-slate-500">Repayment Progress</span>
 <span className="text-indigo-600 dark:text-indigo-400">₹{(activeLoan.totalLoanAmount - activeLoan.remainingPrincipal).toLocaleString()} Paid</span>
 </div>
 <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
 <motion.div
 initial={{ width: 0 }}
 animate={{ width: `${((activeLoan.totalLoanAmount - activeLoan.remainingPrincipal) / activeLoan.totalLoanAmount) * 100}%` }}
 className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600"
 />
 </div>
 <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wide">
 <span>Principal</span>
 <span>Balance: ₹{activeLoan.remainingPrincipal.toLocaleString()}</span>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50 dark:border-slate-800">
 <div>
 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Tenure & Date</p>
 <p className="font-bold text-sm">{activeLoan.tenureMonths} mo • {activeLoan.startDate ? format(new Date(activeLoan.startDate), 'MMM yyyy') : 'N/A'}</p>
 </div>
 <div>
 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Total Payable & Int</p>
 <p className="font-bold text-sm">₹{(activeLoan.totalPayable || 0).toLocaleString()} <span className="text-slate-400 text-xs font-normal"> / ₹{(activeLoan.totalInterest || 0).toLocaleString()} int</span></p>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-3 py-2">
 <button
 onClick={() => setIsAmortizationOpen(true)}
 className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 text-xs hover:bg-indigo-100 transition-colors"
 >
 <TrendingUp className="w-3.5 h-3.5" /> Amortization
 </button>
 <button
 onClick={() => setIsPrepaymentOpen(true)}
 className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 text-xs hover:bg-emerald-100 transition-colors"
 >
 <Wallet className="w-3.5 h-3.5" /> Prepayment
 </button>
 </div>

 <div className="flex items-center justify-between pt-2">
 <div>
 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Monthly EMI</p>
 <p className="text-lg font-bold text-slate-900 dark:text-white">₹{activeLoan.emiAmount.toLocaleString()}</p>
 </div>
 <button
 onClick={() => setIsPayEMIOpen(true)}
 className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-2xl font-bold shadow-lg flex items-center gap-2 hover:scale-[1.02] transition-transform"
 >
 Record EMI
 </button>
 </div>
 </div>
 </div>

 {/* History */}
 {activeLoan.history.length > 0 && (
 <div>
 <h4 className="font-bold text-slate-900 dark:text-white mb-3 pl-2 flex items-center gap-2">
 <History className="w-4 h-4 text-slate-400" />
 Recent Payments
 </h4>
 <div className="space-y-3">
 {activeLoan.history.slice().reverse().map(payment => (
 <div key={payment.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${payment.type === 'Penalty' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
 <Wallet className="w-5 h-5" />
 </div>
 <div>
 <p className="font-bold text-sm text-slate-900 dark:text-white">{payment.type} Payment</p>
 <p className="text-[10px] text-slate-400 uppercase font-bold">{format(new Date(payment.date), 'MMM d, yyyy')}</p>
 </div>
 </div>
 <div className="text-right">
 <p className="font-bold text-slate-900 dark:text-white text-sm">₹{payment.amount.toLocaleString()}</p>
 <p className="text-[9px] text-slate-400">P: ₹{payment.principal.toLocaleString()} | I: ₹{payment.interest.toLocaleString()}</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 ) : (
 <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 px-6">
 <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
 <Landmark className="w-8 h-8 text-slate-300" />
 </div>
 <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Finance Records</h4>
 <p className="text-slate-500 text-sm mb-8 max-w-xs mx-auto">
 Keep track of your vehicle loans, EMIs, and interest payments in one place.
 </p>
 <button
 onClick={() => setIsAddLoanOpen(true)}
 className="bg-slate-900 dark:bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold shadow-xl flex items-center gap-2 mx-auto hover:scale-105 transition-transform"
 >
 <Plus className="w-4 h-4" /> Initialize Finance
 </button>
 </div>
 )}
 </div>
 ) : (
 // HISTORY TAB
 <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
 <div className="flex flex-col gap-3">
    <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            Transaction Log
        </h3>
        <button onClick={exportCSV} className="text-xs font-bold bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
            Export CSV
        </button>
    </div>
    
    <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
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
    <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 font-bold">Sort:</span>
        <select 
            value={historySort} 
            onChange={e => setHistorySort(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 border-none p-0 focus:ring-0"
        >
            <option value="date_desc">Latest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="cost_desc">Highest Cost</option>
            <option value="cost_asc">Lowest Cost</option>
        </select>
    </div>
 </div>

 {groupedHistoryArray.length === 0 ? (
 <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
 <Wallet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
 <p className="text-slate-400 text-sm">No transaction records found.</p>
 </div>
 ) : (
     <div className="space-y-6">
         {groupedHistoryArray.map(group => (
             <div key={group.monthYear}>
                 <div className="flex items-center justify-between mb-3 px-1">
                     <h4 className="font-bold text-slate-600 dark:text-slate-400 text-sm">{group.monthYear}</h4>
                     <span className="text-xs font-bold text-slate-500">₹{group.total.toLocaleString()}</span>
                 </div>
                 <div className="space-y-2">
                     {group.records.map(record => (
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
                     ))}
                 </div>
             </div>
         ))}
     </div>
 )}
 </div>
 )
 ) : null}

 {/* Vehicle List (for inactive or archived view) */}
 {(activeTab === 'overview' || showArchived) && (showArchived || (activeVehicle ? vehicles.length > 1 : true)) && (
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

 {/* Quick stats for list items */}
 {(() => {
 const vStat = getVehicleStats(vehicle.id);
 if (vStat && vStat.overdueCount > 0) return (
 <div className="mt-2 text-[10px] font-bold text-red-500 flex items-center gap-1">
 <AlertTriangle className="w-3 h-3" /> {vStat.overdueCount} Items Overdue
 </div>
 )
 })()}

 <div className="mt-3 pt-2 border-t border-slate-50 dark:border-slate-800 flex justify-end gap-2">
 <button
 onClick={(e) => {
 e.stopPropagation();
 if (window.confirm('Are you sure you want to permanently delete this vehicle?')) {
 deleteVehicle(vehicle.id);
 }
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

 {/* Quick Add FAB */}
 <button
 onClick={() => {
 setEditingVehicle(null);
 setIsAddOpen(true);
 }}
 className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl shadow-indigo-600/30 flex items-center justify-center hover:scale-105 transition-transform z-40"
 >
 <Plus className="w-6 h-6" />
 </button>

 <AddVehicleModal
 isOpen={isAddOpen}
 onClose={() => {
 setIsAddOpen(false);
 setEditingVehicle(null);
 }}
 onSave={handleSaveVehicle}
 editVehicle={editingVehicle}
 />

 <AddLoanModal
 isOpen={isAddLoanOpen}
 onClose={() => setIsAddLoanOpen(false)}
 onSave={handleSaveLoan}
 vehicle={activeVehicle}
 />

 <PayEMIModal
 isOpen={isPayEMIOpen}
 onClose={() => setIsPayEMIOpen(false)}
 onSave={handleRecordPayment}
 loan={activeLoan}
 vehicle={activeVehicle}
 loanDetail={loanDetail}
 />

 <AmortizationScheduleModal
 isOpen={isAmortizationOpen}
 onClose={() => setIsAmortizationOpen(false)}
 loan={activeLoan}
 />

 <PrepaymentCalculatorModal
 isOpen={isPrepaymentOpen}
 onClose={() => setIsPrepaymentOpen(false)}
 loan={activeLoan}
 onSavePayment={handleRecordPayment}
 />
 </div>
 );
};

export default VehicleDashboard;
