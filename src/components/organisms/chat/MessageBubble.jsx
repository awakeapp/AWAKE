import clsx from 'clsx';
import { motion } from 'framer-motion';

const MessageBubble = ({ message, isOwn }) => {
    // Format time: HH:MM
    const time = message.createdAt && !isNaN(new Date(message.createdAt))
        ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '...';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={clsx(
                "flex w-full mb-3",
                isOwn ? "justify-end" : "justify-start"
            )}
        >
            <div className={clsx(
                "max-w-[75%] px-3 py-2 rounded-2xl relative shadow-sm text-sm break-words leading-relaxed",
                isOwn
                    ? "bg-[#DCF8C6] text-slate-900 rounded-tr-none dark:bg-emerald-600 dark:text-white"
                    : "bg-white text-slate-900 rounded-tl-none border border-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100"
            )}>
                <p>{message.text}</p>
                <div className={clsx(
                    "text-[10px] mt-1 text-right opacity-60 font-medium",
                    isOwn ? "text-emerald-900 dark:text-emerald-100" : "text-slate-500 dark:text-slate-400"
                )}>
                    {time}
                </div>
            </div>
        </motion.div>
    );
};

export default MessageBubble;
