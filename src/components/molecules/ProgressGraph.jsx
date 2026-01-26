import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../atoms/Card';
import { MoreVertical } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { format, parseISO } from 'date-fns';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-800 text-white text-xs rounded-lg p-2 shadow-xl">
                <p className="font-semibold mb-1">{label}</p>
                <p className="text-emerald-400">Score: {payload[0].value}%</p>
            </div>
        );
    }
    return null;
};

const ProgressGraph = () => {
    const { getHistory } = useData();
    const history = getHistory(15); // Get last 15 days

    const data = history.map(day => ({
        date: format(parseISO(day.date), 'MMM dd'),
        score: day.score
    }));

    return (
        <Card className="shadow-sm border-slate-100 overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-semibold text-slate-700">15-Day Discipline</CardTitle>
                <button className="text-slate-400 hover:text-slate-600">
                    <MoreVertical className="w-4 h-4" />
                </button>
            </CardHeader>
            <CardContent className="p-0 h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                            axisLine={false}
                            tickLine={false}
                            interval={3}
                        />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6366F1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Area
                            type="monotone"
                            dataKey="score"
                            stroke="#6366F1"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorScore)"
                            activeDot={{ r: 4, strokeWidth: 0, fill: '#6366F1' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

export default ProgressGraph;
