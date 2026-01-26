import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuthContext';
import ProgressCharts from '../components/organisms/ProgressCharts';

const Analytics = () => {
    const navigate = useNavigate();
    const [chartData, setChartData] = useState([]);

    const { user } = useAuthContext();

    useEffect(() => {
        if (!user) return; // Wait for auth

        const loadedData = [];
        // Filter keys by current user ID
        const uid = user.uid;
        const prefix = `awake_data_${uid}_`;

        const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix));

        // Sort keys by date
        keys.sort();

        keys.forEach(key => {
            try {
                const dateStr = key.replace(prefix, '');
                const raw = JSON.parse(localStorage.getItem(key));

                if (raw && raw.tasks) {
                    const total = raw.tasks.length;
                    const completed = raw.tasks.filter(t => t.status === 'checked').length;
                    const score = total > 0 ? Math.round((completed / total) * 100) : 0;

                    // Format date to short string (e.g. "Jan 22")
                    const dateObj = new Date(dateStr);
                    const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                    loadedData.push({
                        date: formattedDate,
                        fullDate: dateStr,
                        score: score,
                        habits: raw.habits || {}
                    });
                }
            } catch (e) {
                console.error("Failed to parse data for analytics", e);
            }
        });

        setChartData(loadedData);
    }, [user]);

    return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            {/* Header */}
            <div className="flex items-center gap-4 mb-2">
                <button onClick={() => navigate('/finance')} className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
                <h2 className="text-xl font-bold text-slate-900">Analytics</h2>
            </div>

            <ProgressCharts data={chartData} />
        </div>
    );
};

export default Analytics;
