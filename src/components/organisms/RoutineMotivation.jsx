import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Card, CardContent } from '../atoms/Card';

const ROUTINE_MOTIVATIONS = [
    "Your routine is your armor. Put it on.",
    "The secret to owning the day is starting it now.",
    "Routine is not a cage, it's a ladder. Start climbing.",
    "Don't wait for motivation. Create it with your first check.",
    "One press of GO changes the entire trajectory of your day.",
    "Discipline today equals freedom tomorrow. Let's begin.",
    "Your future self is watching. Make them proud.",
    "Success is the sum of small actions repeated daily."
];

const RoutineMotivation = () => {
    const [motivation, setMotivation] = useState(ROUTINE_MOTIVATIONS[0]);

    useEffect(() => {
        const idx = Math.floor(Math.random() * ROUTINE_MOTIVATIONS.length);
        setMotivation(ROUTINE_MOTIVATIONS[idx]);
    }, []);

    return (
        <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 border-none shadow-lg text-white">
            <AppCardContent className="p-6 flex flex-col items-center justify-center text-center gap-3">
                <div className="bg-white/20 p-2 rounded-full">
                    <Sparkles className="w-5 h-5 text-white" />
                </div>
                <p className="text-lg font-medium leading-relaxed max-w-xs mx-auto">
                    &ldquo;{motivation}&rdquo;
                </p>
            </AppCardContent>
        </Card>
    );
};

export default RoutineMotivation;
