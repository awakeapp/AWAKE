import clsx from 'clsx';
import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';

const ChatBubble = ({ message }) => {
    const isAi = message.role === 'assistant';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={clsx(
                "flex gap-3 max-w-[90%]",
                isAi ? "self-start" : "self-end flex-row-reverse"
            )}
        >
            <div className={clsx(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border",
                isAi ? "bg-indigo-100 text-indigo-600 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800"
                    : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
            )}>
                {isAi ? <Bot size={16} /> : <User size={16} />}
            </div>

            <div className={clsx(
                "p-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                isAi ? "bg-white border border-slate-100 dark:bg-slate-900 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-tl-none"
                    : "bg-indigo-600 text-white shadow-indigo-500/20 rounded-tr-none"
            )}>
                <div className="whitespace-pre-wrap font-medium">
                    {message.content}
                </div>
            </div>
        </motion.div>
    );
};

export default ChatBubble;
