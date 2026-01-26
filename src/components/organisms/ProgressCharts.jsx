import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell } from 'recharts';
import { Card, CardContent } from '../atoms/Card';
import { TrendingUp, Award, Calendar } from 'lucide-react';

const ProgressCharts = ({ data }) => {
    // Data expected format: [{ date: 'Mon', score: 80, habits: { sugar: false, ... } }, ...]

    // Calculate Stats
    const currentStreak = data.length > 0 ? 5 : 0; // Mock logic for now implies we need real calculation
    const averageScore = Math.round(data.reduce((acc, curr) => acc + curr.score, 0) / (data.length || 1));
    const totalDays = data.length;

    // Custom Tooltip
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl">
                    <p className="font-bold text-slate-900 mb-1">{label}</p>
                    <p className="text-sm text-indigo-600 font-medium">
                        Score: {payload[0].value}%
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-emerald-500 mb-1" />
                    <span className="text-xl font-bold text-slate-800">{averageScore}%</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Avg Score</span>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                    <Award className="w-5 h-5 text-amber-500 mb-1" />
                    <span className="text-xl font-bold text-slate-800">{currentStreak}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Streak</span>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                    <Calendar className="w-5 h-5 text-indigo-500 mb-1" />
                    <span className="text-xl font-bold text-slate-800">{totalDays}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Days</span>
                </div>
            </div>

            {/* Main Trend Chart */}
            <Card className="border-none shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    <div className="p-5 border-b border-slate-50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            Performance Trend
                        </h3>
                    </div>
                    <div className="h-64 w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                <Area
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#6366f1"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorScore)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Habit Breakdown (Placeholder for now, could be BarChart) */}
            {/* Logic for bar chart would go here visualizing habit adherence */}
        </div>
    );
};

export default ProgressCharts;
