import { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useDate } from '../context/DateContext';
import { useAuthContext } from '../hooks/useAuthContext';
import { AppCard as Card, AppCardContent } from '../components/ui/AppCard';
import JumpDateModal from '../components/organisms/JumpDateModal';
import { Calendar as CalendarIcon, PieChart, AlertCircle, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';

const History = () => {
 const navigate = useNavigate();
 const { dailyData } = useData();
 const { formattedDate, setDate, isToday } = useDate();
 const { user } = useAuthContext();
 const [showJumpModal, setShowJumpModal] = useState(false);

 // --- Report Calculations ---
 const totalTasks = dailyData.tasks?.length || 0;
 const completedTasks = dailyData.tasks?.filter(t => t.status === 'checked') || [];
 const missedTasks = dailyData.tasks?.filter(t => t.status === 'missed') || [];
 const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

 const violations = [];
 if (dailyData.habits?.junkFood) violations.push("Ate Junk Food");
 if (dailyData.habits?.sugar) violations.push("Consumed Sugar");
 if (dailyData.habits?.coldDrinks) violations.push("Drank Cold Drinks");
 if (dailyData.habits?.screenTime > 2) violations.push(`High Screen Time (${dailyData.habits.screenTime}h)`);

 const improvements = [
 ...missedTasks.map(t => `Missed task: ${t.name}`),
 ...violations.map(v => `Avoid: ${v}`)
 ];

  return (
    <PageLayout
        title="History"
        showBack
        rightNode={
            <button
                onClick={() => setShowJumpModal(true)}
                className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 rounded-xl transition-all shadow-sm active:scale-95"
            >
                <CalendarIcon className="w-5 h-5" />
            </button>
        }
        renderFloating={
            <JumpDateModal
            isOpen={showJumpModal}
            onClose={() => setShowJumpModal(false)}
            />
        }
    >
      <div className="space-y-6">

 {/* Selected Date Report */}
 <motion.div
 key={formattedDate}
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.3 }}
 className="space-y-4"
 >
 <div className="text-center mb-6">
 <h3 className="text-base font-medium text-slate-500 dark:text-slate-400">
 Overview for <span className="text-slate-900 dark:text-white font-semibold">{new Date(formattedDate + 'T00:00:00').toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
 </h3>
 </div>

 {/* Score Card */}
 <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none shadow-xl relative overflow-hidden">
 <div className="absolute top-0 right-0 p-8 opacity-10">
 <PieChart size={120} />
 </div>
 <AppCardContent className="p-6 relative z-10 flex items-center justify-between">
 <div>
 <p className="text-indigo-200 font-medium mb-1">Daily Score</p>
 <div className="text-4xl font-bold tracking-tight flex items-baseline gap-1">
 {completionRate}
 <span className="text-xl opacity-60">%</span>
 </div>
 <p className="text-sm text-indigo-100 mt-2 opacity-80">
 {completedTasks.length} / {totalTasks} tasks completed
 </p>
 </div>
 <div className="w-24 h-24 rounded-full border-8 border-white/20 flex items-center justify-center relative">
 <TrendingUp className="w-10 h-10 text-white" />
 </div>
 </AppCardContent>
 </Card>

 {/* Stats Grid */}
 <div className="grid grid-cols-2 gap-3">
 <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
 <div className="flex items-center gap-2 mb-2">
 <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
 <span className="font-semibold text-emerald-900 dark:text-emerald-100">Completed</span>
 </div>
 <p className="text-xl font-semibold text-emerald-700 dark:text-emerald-300">{completedTasks.length}</p>
 </div>
 <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border border-red-100 dark:border-red-800/30">
 <div className="flex items-center gap-2 mb-2">
 <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
 <span className="font-semibold text-red-900 dark:text-red-100">Missed</span>
 </div>
 <p className="text-xl font-semibold text-red-700 dark:text-red-300">{missedTasks.length}</p>
 </div>
 </div>

 {/* Violations */}
 {violations.length > 0 && (
 <Card className="border-red-100 bg-red-50/50 dark:bg-red-900/10 dark:border-red-900/30">
 <AppCardContent className="p-5">
 <h4 className="font-semibold text-red-800 dark:text-red-200 flex items-center gap-2 mb-3">
 <AlertCircle className="w-5 h-5" />
 Violations Detected
 </h4>
 <ul className="space-y-2">
 {violations.map((v, i) => (
 <li key={i} className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
 <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
 {v}
 </li>
 ))}
 </ul>
 </AppCardContent>
 </Card>
 )}

 {/* Improvements */}
 {improvements.length > 0 ? (
 <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
 <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase text-xs tracking-wider">
 Areas to Improve
 </h4>
 <ul className="space-y-3">
 {improvements.map((item, i) => (
 <li key={i} className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
 <div className="w-6 h-6 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center shrink-0 text-slate-400 text-xs font-bold border border-slate-100 dark:border-slate-700">
 {i + 1}
 </div>
 <span className="py-0.5">{item}</span>
 </li>
 ))}
 </ul>
 </div>
 ) : (
 <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl p-6 text-center border-dashed border-2 border-emerald-100 dark:border-emerald-800/30">
 <p className="text-emerald-700 dark:text-emerald-300 font-medium">No improvements needed! Perfect day!</p>
 </div>
 )}
 </motion.div>

      </div>
    </PageLayout>
  );
};

export default History;
