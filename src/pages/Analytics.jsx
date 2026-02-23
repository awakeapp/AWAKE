import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuthContext';
import { useData } from '../context/DataContext';
import ProgressCharts from '../components/organisms/ProgressCharts';

const Analytics = () => {
    const navigate = useNavigate();
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    const { user } = useAuthContext();
    const { getAllHistory } = useData();

    useEffect(() => {
        const load = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            try {
                const loadedData = await getAllHistory(30);
                setChartData(loadedData);
            } catch (err) {
                console.error("Failed to load analytics", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [user, getAllHistory]);

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 px-4">
                <button onClick={() => window.history.back()} className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex-shrink-0">
                    <ArrowLeft className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">Analytics</h1>
                    <p className="text-slate-500 text-sm mt-0.5">Your financial breakdown</p>
                </div>
            </div>
            {loading ? (
                <div className="flex items-center justify-center h-64 text-slate-400">Loading analytics...</div>
            ) : (
                <ProgressCharts data={chartData} />
            )}
        </div>
    );
};

export default Analytics;
