import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, Info } from 'lucide-react';
import ChatBubble from './ChatBubble';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

const ChatWindow = ({ assistant, isOpen, onClose }) => {
 const [inputValue, setInputValue] = useState("");
 const scrollRef = useRef(null);

 const {
 messages,
 sendMessage,
 initializeEngine,
 isEngineReady,
 isLoading,
 initProgress
 } = assistant;

 // Auto-scroll to bottom on new message
 useEffect(() => {
 if (scrollRef.current) {
 scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
 }
 }, [messages, initProgress]);

 const handleSend = () => {
 if (!inputValue.trim() || isLoading) return;
 sendMessage(inputValue);
 setInputValue("");
 };

 const handleKeyDown = (e) => {
 if (e.key === 'Enter' && !e.shiftKey) {
 e.preventDefault();
 handleSend();
 }
 };

 if (!isOpen) return null;

 return (
 <motion.div
 initial={{ opacity: 0, scale: 0.9, y: 20 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.9, y: 20 }}
 className="fixed bottom-24 right-4 w-[90vw] md:w-96 h-[600px] max-h-[70vh] bg-white dark:bg-black rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden z-[60]"
 >
 {/* Header */}
 <div className="p-4 border-b border-slate-100 dark:border-slate-900 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md">
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
 <Sparkles size={16} />
 </div>
 <div>
 <h3 className="font-bold text-slate-900 dark:text-white text-sm">Health Assistant</h3>
 <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
 <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
 Mistral 7B (Local)
 </p>
 </div>
 </div>
 </div>

 {/* Content Area */}
 <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-[#050505]" ref={scrollRef}>

 {/* Disclaimer Banner */}
 <div className="mx-4 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl flex gap-3">
 <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
 <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
 Guidance is <strong>general purpose only</strong>. Do not use for medical diagnosis.
 </p>
 </div>

 {!isEngineReady ? (
 <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6">
 <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-2">
 <Sparkles size={32} />
 </div>
 <div className="space-y-2">
 <h4 className="font-bold text-slate-900 dark:text-white">Initialize AI Engine</h4>
 <p className="text-sm text-slate-500 max-w-[240px] mx-auto">
 This runs locally on your device. It requires downloading model weights (~4GB) once.
 </p>
 </div>

 {isLoading ? (
 <div className="w-full max-w-[240px] space-y-2">
 <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
 <motion.div
 className="h-full bg-indigo-500"
 initial={{ width: "0%" }}
 animate={{ width: "100%" }}
 transition={{ duration: 2, repeat: Infinity }}
 />
 </div>
 <p className="text-xs text-center text-slate-500 font-mono truncate px-2">
 {initProgress || "Preparing..."}
 </p>
 </div>
 ) : (
 <button
 onClick={initializeEngine}
 className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-xl shadow-indigo-600/20 transition-all "
 >
 Download & Start AI
 </button>
 )}
 </div>
 ) : (
 <>
 {messages.map((msg, idx) => (
 <ChatBubble key={idx} message={msg} />
 ))}
 {isLoading && initProgress === '' && (
 <div className="flex gap-2 items-center text-slate-400 text-xs ml-11">
 <Loader2 className="w-3 h-3 animate-spin" />
 <span>Thinking...</span>
 </div>
 )}
 </>
 )}
 </div>

 {/* Input Area */}
 <div className="p-3 bg-white dark:bg-black border-t border-slate-100 dark:border-slate-900">
 <div className="relative flex items-end gap-2 bg-slate-100 dark:bg-slate-900 rounded-2xl p-2 focus-within:ring-2 ring-indigo-500/20 transition-all">
 <textarea
 value={inputValue}
 onChange={(e) => setInputValue(e.target.value)}
 onKeyDown={handleKeyDown}
 placeholder={isEngineReady ? "Ask about health..." : "Initialize to chat..."}
 disabled={!isEngineReady || isLoading}
 rows={1}
 className="w-full bg-transparent border-0 focus:ring-0 p-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 resize-none max-h-24 scrollbar-hide"
 />
 <button
 onClick={handleSend}
 disabled={!inputValue.trim() || !isEngineReady || isLoading}
 className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-indigo-600 dark:text-indigo-400 disabled:opacity-50 disabled:grayscale transition-all hover:bg-indigo-50 dark:hover:bg-slate-700 mb-0.5"
 >
 <Send size={18} />
 </button>
 </div>
 </div>
 </motion.div>
 );
};

export default ChatWindow;
