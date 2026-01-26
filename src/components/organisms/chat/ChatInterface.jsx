import { useState, useRef, useEffect } from 'react';
import { useChat } from '../../../context/ChatContext';
import { useAuthContext } from '../../../hooks/useAuthContext';
import MessageBubble from './MessageBubble';
import { Send, MoreVertical, Phone, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ChatInterface = () => {
    const { messages, sendMessage, partner, isMock } = useChat();
    const { user } = useAuthContext();
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const temp = newMessage;
        setNewMessage(''); // optimistic clear
        await sendMessage(temp);
    };

    return (
        <div className="flex flex-col h-screen max-w-md mx-auto bg-[#efe7dd] relative dark:bg-slate-900">
            {/* Background Pattern Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.02]"
                style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }}>
            </div>

            {/* Header */}
            <div className="bg-[#075E54] dark:bg-slate-800 p-2 flex items-center justify-between text-white shadow-md z-10 sticky top-0">
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate('/')} className="p-1 hover:bg-white/10 rounded-full">
                        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    </button>
                    <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                        {partner?.email?.[0].toUpperCase() || '?'}
                    </div>
                    <div>
                        <h3 className="font-bold text-base leading-tight">{partner?.email?.split('@')[0] || "Partner"}</h3>
                        <p className="text-[10px] opacity-80">{isMock ? 'online' : 'click for info'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 pr-2">
                    <Video className="w-5 h-5 opacity-80" />
                    <Phone className="w-5 h-5 opacity-80" />
                    <MoreVertical className="w-5 h-5 opacity-80" />
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 z-0">
                <div className="space-y-1">
                    {messages.map((msg) => (
                        <MessageBubble
                            key={msg.id}
                            message={msg}
                            isOwn={msg.senderId === user.uid}
                        />
                    ))}
                    {messages.length === 0 && (
                        <div className="text-center py-10 opacity-40 text-sm bg-yellow-100/50 p-4 rounded-xl mx-4 text-slate-600 dark:text-slate-400 dark:bg-slate-800/50">
                            🔒 Messages are end-to-end encrypted. No one outside of this chat, not even Awake, can read or listen to them.
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="bg-white dark:bg-slate-800 p-2 px-3 pb-safe-area flex items-center gap-2 z-10">
                <form onSubmit={handleSend} className="flex-1 flex items-center gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Message"
                        className="flex-1 bg-white dark:bg-slate-700 dark:text-white rounded-full px-5 py-3 border-none focus:ring-0 text-slate-900 placeholder:text-slate-400 shadow-sm"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="w-11 h-11 bg-[#008069] dark:bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-md disabled:opacity-50 disabled:scale-95 transition-all"
                    >
                        <Send className="w-5 h-5 ml-0.5" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatInterface;
