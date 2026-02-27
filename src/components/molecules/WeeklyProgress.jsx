import { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAuthContext } from '../../hooks/useAuthContext';
import { useData } from '../../context/DataContext';
import { AppCard as Card, AppCardContent } from '../ui/AppCard';
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
    const { getHistory } = useData();
    const [selectedMetric, setSelectedMetric] = useState(METRICS[0]);
    const [showMenu, setShowMenu] = useState(false);
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            try {
                // Fetch last 7 days including today
                const data = await getHistory(7);
                setHistoryData(data);
            } catch (err) {
                console.error("Failed to load history", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, getHistory]);

    const chartData = useMemo(() => {
        if (!historyData || historyData.length === 0) return Array(7).fill({ day: '-', score: 0 });

        return historyData.map((dayData, index) => {
            const isToday = index === 6; // Assuming getHistory returns oldest to newest
            const dayLabel = isToday ? 'Today' : (new Date(dayData.date).toLocaleDateString('en-US', { weekday: 'short' }));

            let score = 0;
            if (dayData.data) {
                if (selectedMetric.id === 'routine') {
                    // Score is already calculated in getHistory for routine but let's re-verify or use it
                    score = dayData.score;
                } else {
                    // Habits
                    const val = dayData.data.habits?.find(h => h.id === selectedMetric.id)?.value
                        || dayData.data.habits?.[selectedMetric.id]; // Backwards compat for object structure if any

                    if (typeof val === 'boolean') {
                        score = val ? 100 : 0;
                    } else if (typeof val === 'number') {
                        score = val;
                    }
                }
            }

            return {
                day: dayLabel,
                score: score,
                date: dayData.date
            };
        });
    }, [historyData, selectedMetric]);


    // Interpretive Insight Logic
    const trendInsight = useMemo(() => {
        if (!chartData || chartData.length < 2) return null;
        const scores = chartData.map(d => d.score);
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        const todayScore = scores[scores.length - 1];
        const yesterdayScore = scores[scores.length - 2];

        if (todayScore === 100 && yesterdayScore === 100) return "Top-tier consistency! You're on a roll.";
        if (todayScore > yesterdayScore) return "Momentum is building. Keep pushing!";
        if (avg > 80) return "Highly disciplined week. You're crushing it.";
        if (avg > 50) return "Steady progress. Stay the course.";
        return "New day, new opportunity. Build your streak.";
    }, [chartData]);

    if (loading) {
        return (
            <Card className="border-none shadow-sm bg-white h-[240px] flex items-center justify-center">
                <div className="text-slate-400 text-sm">Loading progress...</div>
            </Card>
        );
    }

    return (
        <Card className="border-none shadow-sm bg-white overflow-visible relative z-10">
            <AppCardContent className="p-4">
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
                        <BarChart data={chartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
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
                                {chartData.map((entry, index) => (
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
            </AppCardContent>
        </Card >
    );
};

export default WeeklyProgress;
