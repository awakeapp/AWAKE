import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVehicle } from '../../context/VehicleContext';
import { 
    Home, Wallet, Settings, Landmark, MoreVertical, ChevronDown, 
    Plus, Car, Download, Archive, Edit2, ShieldAlert, List, Wrench, MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

import LedgerScreen from './screens/LedgerScreen';
import ServiceScreen from './screens/ServiceScreen';
import LoanScreen from './screens/LoanScreen';
import AddVehicleModal from './AddVehicleModal';
import ManageVehiclesModal from './ManageVehiclesModal';
import AddLoanModal from './AddLoanModal';
import PayEMIModal from './PayEMIModal';
import AmortizationScheduleModal from './AmortizationScheduleModal';
import PrepaymentCalculatorModal from './PrepaymentCalculatorModal';
import ConfirmDialog from '../../components/organisms/ConfirmDialog';
import { AppBottomNav } from '../../components/ui/AppBottomNav';

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
        deleteVehicle
    } = useVehicle();

    const [activeTab, setActiveTab] = useState('dashboard');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isVehicleSelectorOpen, setIsVehicleSelectorOpen] = useState(false);
    const [showArchived, setShowArchived] = useState(false);
    
    // Modals
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isManageVehiclesOpen, setIsManageVehiclesOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState(null);
    const [isAddLoanOpen, setIsAddLoanOpen] = useState(false);
    const [isPayEMIOpen, setIsPayEMIOpen] = useState(false);
    const [isAmortizationOpen, setIsAmortizationOpen] = useState(false);
    const [isPrepaymentOpen, setIsPrepaymentOpen] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [archiveConfirmId, setArchiveConfirmId] = useState(null);
    
    const [historyFilter, setHistoryFilter] = useState('All');
    
    const menuRef = useRef();
    const selectorRef = useRef();
    
    const activeVehicle = getActiveVehicle();
    const activeLoan = activeVehicle ? getLoanForVehicle(activeVehicle.id) : null;
    const loanDetail = activeLoan ? getLoanDetailedStatus(activeLoan.id) : null;
    const stats = activeVehicle ? getVehicleStats(activeVehicle.id) : null;
    
    // Next Service logic
    const activeFollowUps = activeVehicle ? followUps.filter(f => f.vehicleId === activeVehicle.id && f.status !== 'completed') : [];
    let nextService = activeFollowUps.find(f => (f.type || '').toLowerCase().includes('service') || (f.type || '').toLowerCase().includes('oil'));
    if (!nextService && activeFollowUps.length > 0) nextService = activeFollowUps[0];
    
    // Trend Data provided by backend
    const trendData = stats?.trendData || [];
    const maxTrendCost = trendData.length ? Math.max(...trendData.map(d => d.cost)) || 1 : 1;
    
    // Ledger Entries already standardize 'EMI', 'fuel', 'service', etc.
    let combinedHistory = [...serviceRecords];

    if (historyFilter !== 'All') {
        combinedHistory = combinedHistory.filter(h => h.type.toLowerCase() === historyFilter.toLowerCase());
    }

    combinedHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Sort logic
    const visibleVehicles = vehicles;
    const sortedVehicles = [...visibleVehicles].sort((a, b) => {
        if (a.isActive) return -1;
        if (b.isActive) return 1;
        return 0;
    });
    
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
            if (selectorRef.current && !selectorRef.current.contains(event.target)) {
                setIsVehicleSelectorOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const exportCSV = () => {
        if (!activeVehicle) return;
        setIsMenuOpen(false);
        const headers = ['Date', 'Type', 'Amount', 'Odometer', 'Notes'];
        const rows = combinedHistory.map(r => [
            format(new Date(r.date), 'yyyy-MM-dd'),
            r.type,
            r.amount || 0,
            r.odometer || '',
            r.notes ? `"${r.notes.replace(/"/g, '""')}"` : ''
        ].join(','));
        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `${activeVehicle.name}_ledger.csv`);
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
        setIsAddOpen(false);
        setEditingVehicle(null);
    };

    const handleRecordPayment = (loanId, paymentData) => {
        payEMI(loanId, paymentData);
        setIsPayEMIOpen(false);
    };

    const getIcon = (type) => Car;

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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-2 pb-24">
            
            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
                <div className="px-4 pt-4 pb-5 flex items-center justify-between">
                    {/* Left: Vehicle Selector */}
                    <div className="relative" ref={selectorRef}>
                        <button 
                            onClick={() => setIsVehicleSelectorOpen(!isVehicleSelectorOpen)}
                            className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            <div className="flex flex-col text-left">
                                <span className="font-bold text-slate-900 dark:text-white text-sm leading-tight max-w-[120px] truncate">
                                    {activeVehicle ? activeVehicle.name : 'Select Vehicle'}
                                </span>
                                {activeVehicle && (
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                                        {Number(activeVehicle.odometer || 0).toLocaleString()} km
                                    </span>
                                )}
                            </div>
                            <ChevronDown className="w-4 h-4 text-slate-500" />
                        </button>
                        
                        <AnimatePresence>
                            {isVehicleSelectorOpen && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50"
                                >
                                    <div className="p-2 space-y-1">
                                        {sortedVehicles.filter(v => !v.isArchived).map(vehicle => (
                                            <button
                                                key={vehicle.id}
                                                onClick={() => {
                                                    setVehicleActive(vehicle.id);
                                                    setIsVehicleSelectorOpen(false);
                                                }}
                                                className={`w-full flex items-center gap-3 p-2 rounded-xl transition-colors ${vehicle.isActive ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                                            >
                                                <Car className={`w-5 h-5 ${vehicle.isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                                                <div className="flex-1 text-left">
                                                    <p className={`text-sm font-bold ${vehicle.isActive ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-700 dark:text-slate-200'}`}>{vehicle.name}</p>
                                                    <p className="text-[10px] text-slate-500">{vehicle.brandModel}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right: More Menu */}
                    <div>
                        <button 
                            onClick={() => navigate('/vehicle/more')}
                            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 active:scale-95 transition-all shadow-sm"
                        >
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <div className="px-4 pt-0 pb-4">
                {activeVehicle ? (
                    <>
                        {/* Quick Stats overview top container for Dashboard ONLY */}
                        {activeTab === 'dashboard' && (
                            <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-indigo-900 dark:to-slate-900 rounded-3xl p-5 text-white shadow-xl shadow-slate-900/10 mb-6 relative overflow-hidden">
                                 {/* Alert Badge if Overdue */}
                                 {stats?.overdueCount > 0 && (
                                     <div className="absolute top-4 right-4 bg-red-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 animate-pulse">
                                         <ShieldAlert className="w-3 h-3" />
                                         {stats.overdueCount} Alerts
                                     </div>
                                 )}
                                 
                                <div className="flex divide-x divide-white/10 mt-2">
                                     <div className="flex-1 p-2 pl-0 text-left">
                                         <p className="text-[10px] text-slate-400 uppercase font-bold mb-1 tracking-wider">Month Cost</p>
                                         <p className="font-bold text-xl">₹{stats?.monthSpend.toLocaleString()}</p>
                                     </div>
                                     <div className="flex-1 p-2 text-center">
                                         <p className="text-[10px] text-slate-400 uppercase font-bold mb-1 tracking-wider">Total Cost</p>
                                         <p className="font-bold text-xl">₹{stats?.totalSpend.toLocaleString()}</p>
                                     </div>
                                     <div className="flex-1 p-2 pr-0 text-right flex flex-col items-end">
                                         <p className="text-[10px] text-slate-400 uppercase font-bold mb-1 tracking-wider">Cost/Km</p>
                                         <p className="font-bold text-xl">₹{stats?.costPerKm}</p>
                                     </div>
                                </div>
                            </div>
                        )}

                        <main className="pb-16">
                            <div className={activeTab === 'dashboard' ? 'block' : 'hidden'}>
                                <LedgerScreen 
                                    activeVehicle={activeVehicle}
                                    trendData={trendData}
                                    maxTrendCost={maxTrendCost}
                                    stats={stats}
                                    combinedHistory={combinedHistory}
                                    historyFilter={historyFilter}
                                    setHistoryFilter={setHistoryFilter}
                                    getIcon={getIcon}
                                    sortedVehicles={sortedVehicles}
                                    showArchived={showArchived}
                                    setVehicleActive={setVehicleActive}
                                    setDeleteConfirmId={setDeleteConfirmId}
                                    toggleArchiveVehicle={toggleArchiveVehicle}
                                />
                            </div>
                            
                            <div className={activeTab === 'service' ? 'block' : 'hidden'}>
                                <ServiceScreen 
                                    activeVehicle={activeVehicle}
                                    nextService={nextService}
                                    activeTab={activeTab}
                                />
                            </div>
                            
                            <div className={activeTab === 'loan' ? 'block' : 'hidden'}>
                                <LoanScreen 
                                    activeLoan={activeLoan}
                                    activeVehicle={activeVehicle}
                                    loanDetail={loanDetail}
                                    setIsAmortizationOpen={setIsAmortizationOpen}
                                    setIsPrepaymentOpen={setIsPrepaymentOpen}
                                    setIsPayEMIOpen={setIsPayEMIOpen}
                                    setIsAddLoanOpen={setIsAddLoanOpen}
                                />
                            </div>
                        </main>
                        
                        {/* Contextual FABs */}
                        {activeTab === 'dashboard' && (
                            <button
                                onClick={() => alert("Add Entry: Full ledger entry modal coming soon")}
                                className="fixed bottom-[80px] right-6 bg-indigo-600 text-white px-5 py-3 rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 hover:scale-105 transition-transform z-40 font-bold text-sm"
                            >
                                <Plus className="w-5 h-5" /> Add Entry
                            </button>
                        )}
                        {activeTab === 'service' && (
                            <button
                                onClick={() => alert("Add Reminder Modal Coming Soon")}
                                className="fixed bottom-[80px] right-6 bg-blue-600 text-white px-5 py-3 rounded-2xl shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 hover:scale-105 transition-transform z-40 font-bold text-sm"
                            >
                                <Plus className="w-5 h-5" /> Add Reminder
                            </button>
                        )}
                        {activeTab === 'loan' && activeLoan && (
                            <button
                                onClick={() => setIsPayEMIOpen(true)}
                                className="fixed bottom-[80px] right-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-3 rounded-2xl shadow-xl flex items-center justify-center gap-2 hover:scale-105 transition-transform z-40 font-bold text-sm"
                            >
                                <Plus className="w-5 h-5" /> Record EMI
                            </button>
                        )}

                    </>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-slate-500">No active vehicle found.</p>
                    </div>
                )}
            </div>

            {/* Internal Bottom Navigation */}
            <AppBottomNav 
                items={[
                    { id: 'app-home', icon: Home, label: 'AWAKE', onClick: () => navigate('/') },
                    { 
                        id: 'service', 
                        icon: Wrench, 
                        label: 'Service', 
                        isActive: activeTab === 'service', 
                        onClick: () => setActiveTab('service') 
                    },
                    { 
                        id: 'dashboard', 
                        icon: Car, 
                        label: 'Dashboard', 
                        isActive: activeTab === 'dashboard', 
                        onClick: () => setActiveTab('dashboard'), 
                        isPrimary: true 
                    },
                    { 
                        id: 'loan', 
                        icon: Landmark, 
                        label: 'Loan', 
                        isActive: activeTab === 'loan', 
                        onClick: () => setActiveTab('loan') 
                    },
                    { 
                        id: 'more', 
                        icon: MoreHorizontal, 
                        label: 'More', 
                        onClick: () => navigate('/vehicle/more') 
                    }
                ]} 
            />

            {/* Modals */}
             <AddVehicleModal
                 isOpen={isAddOpen}
                 onClose={() => {
                     setIsAddOpen(false);
                     setEditingVehicle(null);
                 }}
                 onSave={handleSaveVehicle}
                 editVehicle={editingVehicle}
             />
             
             <ManageVehiclesModal
                 isOpen={isManageVehiclesOpen}
                 onClose={() => setIsManageVehiclesOpen(false)}
                 setEditingVehicle={setEditingVehicle}
                 setIsAddOpen={setIsAddOpen}
                 setDeleteConfirmId={setDeleteConfirmId}
             />
             
             <AddLoanModal
                 isOpen={isAddLoanOpen}
                 onClose={() => setIsAddLoanOpen(false)}
                 onSave={(data) => { addLoan(data); setIsAddLoanOpen(false); }}
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
            
            <ConfirmDialog
                 isOpen={!!deleteConfirmId}
                 onClose={() => setDeleteConfirmId(null)}
                 onConfirm={() => {
                     deleteVehicle(deleteConfirmId);
                     setDeleteConfirmId(null);
                 }}
                 title="Delete Vehicle?"
                 message="Are you sure you want to permanently delete this vehicle? All related data will be lost."
                 confirmText="Delete"
            />
            
            <ConfirmDialog
                 isOpen={!!archiveConfirmId}
                 onClose={() => setArchiveConfirmId(null)}
                 onConfirm={() => {
                     toggleArchiveVehicle(archiveConfirmId);
                     setArchiveConfirmId(null);
                 }}
                 title="Archive Vehicle?"
                 message="Are you sure you want to archive this vehicle? It will be hidden from the main view."
                 confirmText="Archive"
            />
        </div>
    );
};

export default VehicleDashboard;
