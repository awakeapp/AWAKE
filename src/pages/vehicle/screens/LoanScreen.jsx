import { Landmark, TrendingUp, Wallet, History, Plus, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const LoanScreen = ({ activeLoan, activeVehicle, loanDetail, setIsAmortizationOpen, setIsPrepaymentOpen, setIsPayEMIOpen, setIsAddLoanOpen }) => {
    
    if (!activeLoan) {
         return (
             <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 px-6 mt-4">
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
         );
    }
    
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 mt-2">
            
            {/* Overdue Warning ONLY on Loan Screen */}
            {loanDetail?.status === 'overdue' && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl flex items-start gap-3 animate-pulse">
                     <div className="p-2 bg-red-100 dark:bg-red-800 rounded-full text-red-600 dark:text-red-200">
                         <AlertTriangle className="w-5 h-5" />
                     </div>
                     <div>
                         <h4 className="font-bold text-red-900 dark:text-red-100 text-sm">EMI Overdue</h4>
                         <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                             Payment is overdue by {loanDetail.daysLate} days. 
                             Due date was {format(new Date(loanDetail.dueDate), 'MMM d, yyyy')}.
                         </p>
                     </div>
                </div>
            )}
            
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
                             <span className="text-indigo-600 dark:text-indigo-400">₹{(loanDetail?.totalPaid || 0).toLocaleString()} Paid</span>
                         </div>
                         <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                             <motion.div
                                 initial={{ width: 0 }}
                                 animate={{ width: `${((loanDetail?.totalPaid || 0) / (loanDetail?.totalPayable || activeLoan.totalPayable || 1)) * 100}%` }}
                                 className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600"
                             />
                         </div>
                         <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wide">
                             <span>Total Payable: ₹{(loanDetail?.totalPayable || activeLoan.totalPayable || 0).toLocaleString()}</span>
                             <span>Balance: ₹{(loanDetail?.remainingBalance || 0).toLocaleString()}</span>
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
                             <p className="text-lg font-bold text-slate-900 dark:text-white">₹{(loanDetail?.emi || activeLoan.emiAmount).toLocaleString()}</p>
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
    );
};

export default LoanScreen;
