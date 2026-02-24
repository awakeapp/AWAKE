import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatWindow from './ChatWindow';
import { useHealthAssistant } from '../../../hooks/useHealthAssistant';
import { useScrollLock } from '../../../hooks/useScrollLock';

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const assistant = useHealthAssistant();

    useScrollLock(isOpen);

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <div
                        className="fixed inset-0 z-[55] md:hidden bg-slate-900/20 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>

            <ChatWindow
                assistant={assistant}
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            />

            <motion.button
                layoutId="chat-fab"
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="fixed bottom-24 right-4 md:bottom-8 md:right-8 w-14 h-14 rounded-full bg-black dark:bg-white text-white dark:text-black shadow-2xl shadow-black/20 z-[60] flex items-center justify-center border border-white/10"
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                        >
                            <X className="w-6 h-6" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="chat"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                        >
                            <MessageCircle className="w-6 h-6" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>
        </>
    );
};

export default ChatWidget;
