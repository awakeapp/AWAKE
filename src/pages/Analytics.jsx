import { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, ArrowLeft } from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuthContext';
import { useData } from '../context/DataContext';
import ProgressCharts from '../components/organisms/ProgressCharts';
import PageLayout from '../components/layout/PageLayout';
import FinancialAnalytics from '../components/organisms/FinancialAnalytics';

const Analytics = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('finance'); // 'routine' or 'finance'
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
    <PageLayout
      title="Analytics"
      showBack
    >
      <div className="space-y-6 pb-20">
        <div className="space-y-4">
            <p className="text-slate-500 dark:text-slate-400 text-[13px] font-bold uppercase tracking-widest text-center">
                {activeTab === 'finance' ? 'Your financial performance' : 'Your routine & habits'}
            </p>

            {/* Tab Selector */}
            <div className="flex bg-slate-100/50 dark:bg-slate-900/50 p-1 rounded-2xl w-full border border-slate-200/50 dark:border-slate-800/50">
                <button 
                    onClick={() => setActiveTab('finance')}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'finance' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-md' : 'text-slate-500 dark:text-slate-500 hover:text-slate-600'}`}
                >
                    Finance
                </button>
                <button 
                    onClick={() => setActiveTab('routine')}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'routine' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-md' : 'text-slate-500 dark:text-slate-500 hover:text-slate-600'}`}
                >
                    Routine
                </button>
            </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 text-slate-400">Loading analytics...</div>
        ) : activeTab === 'finance' ? (
          <FinancialAnalytics />
        ) : (
          <ProgressCharts data={chartData} />
        )}
      </div>
    </PageLayout>
  );
};

export default Analytics;
