import { useChat } from '../context/ChatContext';
import ChatRequest from '../components/organisms/chat/ChatRequest';
import ChatInterface from '../components/organisms/chat/ChatInterface';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const LoveChat = () => {
    const { coupleId, loading } = useChat();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-900">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                    <Loader2 className="w-8 h-8 text-slate-400" />
                </motion.div>
            </div>
        );
    }

    if (!coupleId) {
        return <ChatRequest />;
    }

    return <ChatInterface />;
};

export default LoveChat;
