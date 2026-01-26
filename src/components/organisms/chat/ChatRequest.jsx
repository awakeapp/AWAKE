import { useState } from 'react';
import { useChat } from '../../../context/ChatContext';
import Button from '../../atoms/Button';
import { Heart, Copy, Check, Loader2, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ChatRequest = () => {
    const { generateCode, joinWithCode, pairingCode, loading, isMock } = useChat();
    const [inputCode, setInputCode] = useState('');
    const [joinLoading, setJoinLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');

    const handleCopy = () => {
        navigator.clipboard.writeText(pairingCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleJoin = async () => {
        if (inputCode.length < 6) return;
        setJoinLoading(true);
        setError('');
        try {
            await joinWithCode(inputCode);
        } catch (err) {
            setError(err.message || "Failed to join. Invalid code?");
        } finally {
            setJoinLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-8 h-[calc(100vh-140px)]">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-red-50 p-6 rounded-full dark:bg-red-900/20"
            >
                <Heart className="w-12 h-12 text-red-500 fill-current animate-pulse" />
            </motion.div>

            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Couple Connection</h2>
                <p className="text-slate-500 max-w-xs mx-auto text-sm dark:text-slate-400">
                    Connect with your partner to unlock the private chat. One generates, one joins.
                </p>
                {isMock && <p className="text-xs text-orange-500 font-bold bg-orange-100 dark:bg-orange-900/30 inline-block px-2 py-1 rounded">DEMO MODE</p>}
            </div>

            <div className="w-full max-w-sm space-y-6">
                {/* Generate Section */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 dark:text-slate-300">Invite Partner</h3>

                    {!pairingCode ? (
                        <Button
                            onClick={generateCode}
                            variant="secondary"
                            className="w-full"
                        >
                            Generate Invite Code
                        </Button>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono text-3xl font-bold tracking-widest text-slate-800 flex justify-center relative group dark:bg-slate-900 dark:border-slate-600 dark:text-white">
                                {pairingCode}
                            </div>
                            <Button
                                onClick={handleCopy}
                                size="sm"
                                variant="ghost"
                                className={copied ? "text-green-600" : "text-slate-500"}
                            >
                                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                                {copied ? "Copied!" : "Copy Code"}
                            </Button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
                    <span className="text-xs font-bold text-slate-400">OR</span>
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700"></div>
                </div>

                {/* Join Section */}
                <div className="space-y-3">
                    <div className="relative">
                        <Key className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            value={inputCode}
                            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                            placeholder="Enter Partner's Code"
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white font-mono uppercase focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                            maxLength={6}
                        />
                    </div>

                    {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

                    <Button
                        onClick={handleJoin}
                        disabled={inputCode.length < 6 || joinLoading}
                        className="w-full bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 text-white border-none"
                    >
                        {joinLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Connect"}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ChatRequest;
