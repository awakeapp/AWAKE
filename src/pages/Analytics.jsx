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
            <div className="flex items-center gap-4 mb-2">
                <button onClick={() => navigate('/finance')} className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
                <h2 className="text-xl font-bold text-slate-900">Analytics</h2>
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
