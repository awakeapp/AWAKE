import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CreditCard, CheckCircle2, AlertTriangle } from 'lucide-react';

const PayPortal = () => {
    const [searchParams] = useSearchParams();
    const upiIdRaw = searchParams.get('upi');
    const amountRaw = searchParams.get('am');
    const nameRaw = searchParams.get('pn');
    
    const [upiId, setUpiId] = useState('');
    const [amount, setAmount] = useState('');
    const [name, setName] = useState('');
    
    useEffect(() => {
        try { if(upiIdRaw) setUpiId(decodeURIComponent(atob(upiIdRaw))); } catch(e){}
        try { if(amountRaw) setAmount(decodeURIComponent(atob(amountRaw))); } catch(e){}
        try { if(nameRaw) setName(decodeURIComponent(atob(nameRaw))); } catch(e){}
    }, [upiIdRaw, amountRaw, nameRaw]);

    if (!upiId || !amount) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
                <AlertTriangle className="w-16 h-16 text-rose-500 mb-6" />
                <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Invalid Payment Link</h1>
                <p className="text-slate-500 font-medium">This payment link is broken, expired, or missing details.</p>
            </div>
        );
    }
    
    const handlePayClick = () => {
        const uri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name || 'AWAKE User')}&am=${encodeURIComponent(amount)}&cu=INR`;
        window.location.href = uri;
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
            <div className="flex-1 max-w-md w-full mx-auto p-6 flex flex-col items-center justify-center relative">
                
                {/* Visual Card */}
                <div className="w-full bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                    
                    <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mx-auto mb-6 text-indigo-600 dark:text-indigo-400 shadow-inner">
                        <CreditCard className="w-8 h-8" />
                    </div>
                    
                    <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Payment Request</h2>
                    <p className="text-base font-bold text-slate-900 dark:text-white mb-8">
                        {name ? `To ${name}` : 'Clear Pending Dues'}
                    </p>
                    
                    <div className="inline-flex items-baseline mb-8 pb-8 border-b border-slate-100 dark:border-slate-800 w-full justify-center">
                        <span className="text-2xl font-black text-slate-300 dark:text-slate-600 mr-2 -mt-2">₹</span>
                        <span className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{Number(amount).toLocaleString()}</span>
                    </div>
                    
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-pre-line mb-8 leading-relaxed">
                        Tap below to securely pay via any UPI app<br />installed on your phone<br /><span className="text-[10px] mt-2 block opacity-70 uppercase tracking-widest">(GPay, PhonePe, Paytm, etc)</span>
                    </p>
                    
                    <button 
                        onClick={handlePayClick}
                        className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        <CheckCircle2 className="w-5 h-5"/> Pay Now
                    </button>
                    
                    <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-800/50">
                        <p className="text-[9px] uppercase font-black tracking-widest text-slate-300 dark:text-slate-600 mb-1">
                            Powered by AWAKE
                        </p>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                            100% secure direct bank transfer via UPI
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PayPortal;
