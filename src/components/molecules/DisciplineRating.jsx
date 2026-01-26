import { motion } from 'framer-motion';
import { Card, CardContent } from '../atoms/Card';
import clsx from 'clsx';

const DisciplineRating = ({ percentage = 0 }) => {
    // Circle math
    const roundedPercentage = Math.round(percentage);
    const radius = 45; // Slightly larger
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (roundedPercentage / 100) * circumference;

    // Color logic
    const getColor = (p) => {
        if (p < 40) return 'text-red-500';
        if (p < 70) return 'text-amber-500';
        return 'text-emerald-500';
    };

    const getMessage = (p) => {
        if (p === 0) return "Start your day!";
        if (p < 40) return "Keep pushing!";
        if (p < 70) return "Doing good!";
        if (p < 100) return "Almost there!";
        return "Perfect Day!";
    };

    const colorClass = getColor(roundedPercentage);

    return (
        <Card className="shadow-sm border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardContent className="p-6 flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Discipline Rating</h3>
                    <p className="text-xs text-slate-500 font-medium">Daily completion score</p>

                    <div className={clsx("mt-2 text-sm font-bold bg-slate-50 dark:bg-slate-800 py-1.5 px-3 rounded-lg w-fit transition-colors", colorClass)}>
                        {getMessage(roundedPercentage)}
                    </div>
                </div>

                <div className="relative w-28 h-28 flex items-center justify-center">
                    {/* Background Circle */}
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="56"
                            cy="56"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            className="text-slate-100 dark:text-slate-800"
                        />
                        {/* Progress Circle */}
                        <motion.circle
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            cx="56"
                            cy="56"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeLinecap="round"
                            className={clsx(colorClass)}
                        />
                    </svg>

                    {/* Accessorizing Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={clsx("text-2xl font-black leading-none tracking-tighter", colorClass)}>
                            {roundedPercentage}%
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default DisciplineRating;
