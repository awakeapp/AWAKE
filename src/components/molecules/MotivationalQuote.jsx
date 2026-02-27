import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote } from 'lucide-react';
import { Card, CardContent } from '../atoms/Card';

const QUOTES = [
    { text: "The most beloved deed to Allah is the most regular and constant even if it were little.", source: "Prophet Muhammad (ﷺ)" },
    { text: "Consistency is key to success.", source: "Unknown" },
    { text: "Discipline is doing what needs to be done, even if you don't want to do it.", source: "Unknown" },
    { text: "Your future is created by what you do today, not tomorrow.", source: "Robert Kiyosaki" },
    { text: "Small habits make a big difference.", source: "Unknown" },
];

const MotivationalQuote = () => {
    const [quote, setQuote] = useState(QUOTES[0]);

    useEffect(() => {
        // Random quote on mount
        setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
    }, []);

    return (
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 border-none shadow-lg text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
                <Quote size={64} />
            </div>
            <AppCardContent className="p-5 relative z-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={quote.text}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.5 }}
                    >
                        <p className="font-serif italic text-lg leading-relaxed mb-3 opacity-95">
                            "{quote.text}"
                        </p>
                        <p className="text-xs font-semibold tracking-wide opacity-80 uppercase">
                            — {quote.source}
                        </p>
                    </motion.div>
                </AnimatePresence>
            </AppCardContent>
        </Card>
    );
};

export default MotivationalQuote;
