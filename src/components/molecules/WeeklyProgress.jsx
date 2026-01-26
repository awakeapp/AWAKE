import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import { useAuthContext } from '../../hooks/useAuthContext';
import { Card, CardContent } from '../atoms/Card';
import { MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const METRICS = [
    { id: 'routine', label: 'Routine Completion' },
    { id: 'junkFood', label: 'Junk Food' },
    { id: 'sugar', label: 'Sugar' },
    { id: 'screenTime', label: 'Screen Time' },
    { id: 'coldDrinks', label: 'Cold Drinks' }
];

const WeeklyProgress = () => {
    const { user } = useAuthContext();
    const uid = user ? user.uid : 'guest';
    const [selectedMetric, setSelectedMetric] = useState(METRICS[0]);
    const [showMenu, setShowMenu] = useState(false);

    const data = useMemo(() => {
        const history = [];
        const today = startOfDay(new Date());

        for (let i = 6; i >= 0; i--) {
            const date = subDays(today, i);
            const dateKey = format(date, 'yyyy-MM-dd');
            const storageKey = `awake_data_${uid}_${dateKey}`;

            const dayLabel = i === 0 ? 'Today' : format(date, 'EEE');

            let score = 0;
            try {
                const stored = localStorage.getItem(storageKey);
                if (stored) {
                    const parsed = JSON.parse(stored);

                    if (selectedMetric.id === 'routine') {
                        if (parsed.tasks && parsed.tasks.length > 0) {
                            const completed = parsed.tasks.filter(t => t.status === 'checked').length;
                            score = Math.round((completed / parsed.tasks.length) * 100);
                        }
                    } else {
                        // Habits logic
                        const val = parsed.habits?.[selectedMetric.id];
                        if (typeof val === 'boolean') {
                            score = val ? 100 : 0;
                        } else if (typeof val === 'number') {
                            score = val;
                        }
                    }
                }
            } catch (e) {
                console.warn('Failed to parse data for graph', e);
            }

            history.push({
                day: dayLabel,
                score: score,
                date: dateKey
            });
        }
        return history;
    }, [uid, selectedMetric]);

    // Interpretive Insight Logic
    const trendInsight = useMemo(() => {
        if (!data || data.length < 2) return null;
        const scores = data.map(d => d.score);
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        const todayScore = scores[6];
        const yesterdayScore = scores[5];

        if (todayScore === 100 && yesterdayScore === 100) return "Top-tier consistency! You're on a roll.";
        if (todayScore > yesterdayScore) return "Momentum is building. Keep pushing!";
        if (avg > 80) return "Highly disciplined week. You're crushing it.";
        if (avg > 50) return "Steady progress. Stay the course.";
        return "New day, new opportunity. Build your streak.";
    }, [data]);

    return (
        <Card className="border-none shadow-sm bg-white overflow-visible relative z-10">
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4 relative">
                    <div>
                        <h3 className="font-bold text-slate-700 text-sm tracking-wide">{selectedMetric.label}</h3>
                        <span className="text-xs font-medium text-slate-400">Last 7 Days</span>
                    </div>

                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-1 hover:bg-slate-100 rounded-full transition-colors relative"
                    >
                        <MoreHorizontal className="w-5 h-5 text-slate-400" />
                    </button>

                    <AnimatePresence>
                        {showMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                    className="absolute right-0 top-8 z-20 bg-white rounded-xl shadow-xl border border-slate-100 w-48 py-2 overflow-hidden"
                                >
                                    {METRICS.map(metric => (
                                        <button
                                            key={metric.id}
                                            onClick={() => {
                                                setSelectedMetric(metric);
                                                setShowMenu(false);
                                            }}
                                            className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${selectedMetric.id === metric.id
                                                ? 'bg-indigo-50 text-indigo-600'
                                                : 'text-slate-600 hover:bg-slate-50'
                                                }`}
                                        >
                                            {metric.label}
                                        </button>
                                    ))}
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>

                <div className="h-32 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                            <XAxis
                                dataKey="day"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#94a3b8' }}
                                interval={0}
                            />
                            <YAxis
                                hide
                                domain={[0, 100]}
                            />
                            <Tooltip
                                cursor={{ fill: '#f1f5f9' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                labelStyle={{ color: '#64748b', fontSize: '10px', fontWeight: 'bold' }}
                                itemStyle={{ color: '#4f46e5', fontSize: '12px', fontWeight: 'bold' }}
                                formatter={(value) => [`${value}${typeof value === 'boolean' ? '' : '%'}`, 'Value']}
                            />
                            <Bar dataKey="score" radius={[4, 4, 0, 0]} maxBarSize={40}>
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.day === 'Today' ? '#4f46e5' : '#cbd5e1'}
                                        className="transition-all duration-300 hover:opacity-80"
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {trendInsight && (
                    <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Consistency Insight</p>
                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                            {trendInsight}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card >
    );
};

export default WeeklyProgress;
