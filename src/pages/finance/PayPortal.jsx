import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CreditCard, CheckCircle2, AlertTriangle, Smartphone } from 'lucide-react';

const PayPortal = () => {
    const [searchParams] = useSearchParams();

    // Helper to decode either plain or base64 (for backward compatibility)
    const resolveParam = (val, isAmount) => {
        if (!val) return '';
        
        // If it's an amount and purely numeric, it's plain text.
        if (isAmount && /^\d+(\.\d+)?$/.test(val)) return val;
        
        // If it's an UPI ID and contains '@', it's plain text.
        if (!isAmount && val.includes('@')) return val;

        try {
            // Assume it might be base64 (older links)
            return decodeURIComponent(atob(val));
        } catch(e) {
            return val;
        }
    };

    const upiIdRaw = searchParams.get('upi') || '';
    const amountRaw = searchParams.get('am') || '';
    const nameRaw = searchParams.get('pn') || '';

    let upiId = resolveParam(upiIdRaw, false);
    let amountStr = resolveParam(amountRaw, true);
    let name = resolveParam(nameRaw, false);

    // If 'upiId' still looks like base64 garbage or 'amountStr' is garbage, fallback to plain
    if (!upiId.includes('@')) {
        upiId = upiIdRaw; 
    }
    
    // Clean amount (remove any commas just in case, though toString() doesn't add them)
    const cleanAmount = parseFloat(amountStr.replace(/,/g, ''));
    const amount = isNaN(cleanAmount) ? 0 : cleanAmount;

    const [paid, setPaid] = useState(false);

    const isValid = upiId && amount > 0;

    const handlePayClick = () => {
        const uri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name || 'Payment')}&am=${encodeURIComponent(amount)}&cu=INR&tn=${encodeURIComponent('Paid via AWAKE')}`;
        window.location.href = uri;
        // Show confirmation hint after a short delay (device handled it)
        setTimeout(() => setPaid(true), 2500);
    };

    if (!isValid) {
        return (
            <div style={{ minHeight: '100svh' }} className="bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-10 h-10 text-rose-500" />
                </div>
                <h1 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Invalid Link</h1>
                <p className="text-slate-500 font-medium text-sm max-w-xs mb-4">
                    This payment link is broken, missing, or expired. Please ask for a new one.
                </p>
                <div className="text-xs text-slate-400 bg-slate-100 p-3 rounded-xl text-left font-mono break-all w-full max-w-xs">
                    Debug Info:<br/>
                    UPI: {upiId || "Missing"}<br/>
                    Amount Raw: {amountRaw || "Missing"}<br/>
                    Amount Parsed: {amount}
                </div>
            </div>
        );
    }

    const formattedAmt = Number(amount).toLocaleString('en-IN');

    return (
        <div style={{ minHeight: '100svh' }} className="bg-gradient-to-br from-slate-50 to-indigo-50 flex flex-col items-center justify-center p-5">
            <div className="w-full max-w-sm">

                {/* Card */}
                <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-100 border border-slate-100 overflow-hidden">

                    {/* Header band */}
                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 px-8 pt-10 pb-14 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-200 mb-3">Payment Request</p>
                        <div className="flex items-baseline justify-center gap-1 mb-1">
                            <span className="text-2xl font-black text-indigo-300">₹</span>
                            <span className="text-6xl font-black text-white tracking-tighter leading-none">{formattedAmt}</span>
                        </div>
                        {name && (
                            <p className="text-indigo-200 text-sm font-medium mt-3">To {name}</p>
                        )}
                    </div>

                    {/* Body */}
                    <div className="px-8 -mt-6 pb-8">
                        <div className="bg-white rounded-2xl shadow-lg shadow-slate-100 border border-slate-100 p-4 mb-6 text-center">
                            <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">UPI ID</p>
                            <p className="text-sm font-bold text-slate-900 break-all">{upiId}</p>
                        </div>

                        {paid ? (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center mb-4">
                                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                                <p className="text-sm font-bold text-emerald-700">Redirected to UPI app!</p>
                                <p className="text-[11px] text-emerald-600 mt-0.5">Complete the payment in your UPI app.</p>
                            </div>
                        ) : (
                            <button
                                onClick={handlePayClick}
                                className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.97] text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-indigo-500/25 transition-all flex items-center justify-center gap-3 mb-4"
                            >
                                <Smartphone className="w-5 h-5" /> Pay Now via UPI
                            </button>
                        )}

                        <p className="text-center text-[10px] text-slate-400 font-medium leading-relaxed">
                            Opens GPay, PhonePe, Paytm or any<br />UPI app installed on your phone.
                        </p>
                    </div>
                </div>

                <p className="text-center text-[9px] font-black uppercase tracking-widest text-slate-400 mt-6">
                    Powered by AWAKE
                </p>
            </div>
        </div>
    );
};

export default PayPortal;
