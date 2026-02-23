import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useData } from '../context/DataContext';
import { useDate } from '../context/DateContext';
import { useTasks } from '../context/TaskContext'; // Import TaskContext
import RoutineCategory from '../components/organisms/RoutineCategory';
import DailyHabits from '../components/organisms/DailyHabits';
import DayOverviewModal from '../components/organisms/DayOverviewModal';
import TaskManagerModal from '../components/organisms/TaskManagerModal';
import UnifiedFeedbackModal from '../components/organisms/UnifiedFeedbackModal';
import DateHeader from '../components/organisms/DateHeader';
const UnlockDayModal = lazy(() => import('../components/organisms/UnlockDayModal'));
import Button from '../components/atoms/Button';
import { Loader2, Lock, Edit2, List, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, Target, Flame } from 'lucide-react';
import { FirestoreService } from '../services/firestore-service';
import { orderBy, limit } from 'firebase/firestore';

const Dashboard = () => {
    // --- Routine Logic ---
    const { dailyData, updateTaskStatus, updateHabit, updateAllTasks, isLocked, submitDay, unlockDay } = useData();
    const { isPast } = useDate();
    const navigate = useNavigate();
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [showManagerModal, setShowManagerModal] = useState(false);
    const [showUnlockModal, setShowUnlockModal] = useState(false);
    
    // Removed Streak Logic

    // Unified Feedback Logic
    const [feedbackModal, setFeedbackModal] = useState({ isOpen: false, type: 'success', category: '' });
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // --- Task Logic (Top 3) ---
    const { tasks: workspaceTasks } = useTasks();
    const topTasks = workspaceTasks
        .filter(t => t.status !== 'done') // Only pending
        .slice(0, 3); // Top 3

    // --- Welcome Logic ---
    const hour = new Date().getHours();
    let greeting = 'Good Morning';
    if (hour >= 12 && hour < 17) greeting = 'Good Afternoon';
    else if (hour >= 17) greeting = 'Good Evening';

    const completedRoutine = dailyData.tasks.filter(t => t.status === 'checked').length;
    const totalRoutine = dailyData.tasks.length;
    const routineProgress = totalRoutine > 0 ? Math.round((completedRoutine / totalRoutine) * 100) : 0;
    
    const remainingTasksCount = workspaceTasks.filter(t => t.status !== 'done').length;
    
    // Motivation Text
    let motivation = "";
    if (routineProgress >= 80) motivation = "Finishing strong.";
    if (routineProgress === 100) motivation = "Discipline mastered.";
    if (remainingTasksCount === 0 && routineProgress === 100) motivation = "All systems go.";

    // --- Routine Grouping ---
    if (!dailyData || !dailyData.tasks) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    const categories = {
        'EARLY MORNING': dailyData.tasks.filter(t => t.category === 'EARLY MORNING'),
        'BEFORE NOON': dailyData.tasks.filter(t => t.category === 'BEFORE NOON'),
        'AFTER NOON': dailyData.tasks.filter(t => t.category === 'AFTER NOON'),
        'EVE/NIGHT': dailyData.tasks.filter(t => t.category === 'EVE/NIGHT' || t.category === 'NIGHT'),
    };

    // --- Feedback Effect (Identical to Routine.jsx) ---
    const categoryStatusRef = useRef({});
    useEffect(() => {
        if (!dailyData?.tasks) return;
        if (isPast) return;

        const newStatusMap = {};
        Object.entries(categories).forEach(([category, tasks]) => {
            if (tasks.length === 0) {
                newStatusMap[category] = 'empty';
                return;
            }
            const allChecked = tasks.every(t => t.status === 'checked');
            const allHandled = tasks.every(t => t.status === 'checked' || t.status === 'missed');

            if (allChecked) newStatusMap[category] = 'success';
            else if (allHandled) newStatusMap[category] = 'failed';
            else newStatusMap[category] = 'incomplete';
        });

        if (isInitialLoad) {
            categoryStatusRef.current = newStatusMap;
            setIsInitialLoad(false);
            return;
        }

        Object.entries(newStatusMap).forEach(([category, status]) => {
            const prevStatus = categoryStatusRef.current[category] || 'incomplete';
            if (status !== prevStatus) {
                if (prevStatus === 'incomplete' && status === 'success') {
                    setFeedbackModal({ isOpen: true, type: 'success', category });
                } else if (prevStatus === 'incomplete' && status === 'failed') {
                    setFeedbackModal({ isOpen: true, type: 'troll', category });
                }
            }
        });
        categoryStatusRef.current = newStatusMap;
    }, [dailyData.tasks, isPast, isInitialLoad]);

    // --- Handlers ---
    const handleInitialSubmit = () => setShowSubmitModal(true);
    const handleConfirmSubmit = async (data) => {
        await submitDay(data);
        setShowSubmitModal(false);
    };
    const handleUnlock = (reason) => {
        unlockDay(reason);
        setShowUnlockModal(false);
    };

    // --- Temporal Collapsing Logic ---
    const [activeCategory, setActiveCategory] = useState('');

    useEffect(() => {
        // Only set default if not already set (prevents overriding user interaction)
        if (activeCategory) return;

        const hour = new Date().getHours();
        let currentPeriod = '';

        if (hour < 8) currentPeriod = 'EARLY MORNING';
        else if (hour < 12) currentPeriod = 'BEFORE NOON';
        else if (hour < 17) currentPeriod = 'AFTER NOON';
        else currentPeriod = 'EVE/NIGHT';

        // Check if current period exists in data
        const hasTasks = dailyData.tasks.some(t => {
            if (currentPeriod === 'EVE/NIGHT') return t.category === 'EVE/NIGHT' || t.category === 'NIGHT';
            return t.category === currentPeriod;
        });

        // If current period has tasks, open it. Else, find first incomplete or just first.
        if (hasTasks) {
            setActiveCategory(currentPeriod);
        } else {
            setActiveCategory('EARLY MORNING'); // Fallback
        }
    }, [dailyData.tasks, activeCategory]);

    const toggleCategory = (category) => {
        setActiveCategory(prev => prev === category ? '' : category);
    };

    return (
        <div className="pb-32 px-4 pt-4 space-y-6">
            {/* Header / Date */}
            <div className="sticky top-[60px] z-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md pt-1 pb-3 -mx-4 px-4 border-b border-transparent">
                <DateHeader className="mb-0" />
            </div>

            {/* WELCOME & SUMMARY SECTION */}
            <div className="space-y-4">
                <div className="flex items-end justify-between px-1">
                    <div>
                        <h1 className="text-xl font-semibold text-slate-800 dark:text-white tracking-tight">{greeting}, User</h1>
                        {motivation && <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{motivation}</p>}
                    </div>
                    <div className="text-right hidden sm:block">
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-widest">Workspace</div>
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{remainingTasksCount} tasks left</div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm relative overflow-hidden">
                    {/* Progress Background */}
                    <div 
                        className="absolute bottom-0 left-0 h-1 bg-indigo-500/20 transition-all duration-1000"
                        style={{ width: `${routineProgress}%` }}
                    />

                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-4">
                            <div className={clsx(
                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                                routineProgress === 100 ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-slate-100 text-indigo-600 dark:bg-slate-800 dark:text-indigo-400"
                            )}>
                                {routineProgress === 100 ? <Trophy className="w-6 h-6" /> : <Target className="w-6 h-6" />}
                            </div>
                            <div>
                                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-0.5">Routine</div>
                                <div className="text-lg font-semibold text-slate-900 dark:text-white leading-none">
                                    {routineProgress}% <span className="text-xs font-medium text-slate-400 ml-1">Complete</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                             {/* Mobile Task Count */}
                             <div className="sm:hidden text-right mr-2">
                                <div className="text-[10px] font-bold text-slate-400 uppercase">Tasks</div>
                                <div className="text-sm font-bold text-slate-700 dark:text-slate-300">{remainingTasksCount}</div>
                            </div>

                            <button
                                onClick={() => setShowManagerModal(true)}
                                className={clsx(
                                    "w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 transition-colors",
                                    isLocked && "hidden"
                                )}
                            >
                                <Edit2 className="w-4 h-4 stroke-[2]" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Success Banner */}
                {routineProgress === 100 && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-3 flex items-center gap-3 text-emerald-700 dark:text-emerald-400"
                    >
                        <Sparkles className="w-5 h-5" />
                        <span className="text-sm font-semibold">All daily routines completed. Excellent discipline.</span>
                    </motion.div>
                )}

                {/* Streak Card Removed */}
            </div>

            {/* SECTOR 1: ROUTINE (Collapsible) */}
            <div className="space-y-2">
                {dailyData.tasks.length > 0 ? (
                    Object.entries(categories).map(([category, tasks]) => (
                        <RoutineCategory
                            key={category}
                            title={category}
                            tasks={tasks}
                            onUpdateStatus={updateTaskStatus}
                            isLocked={isLocked}
                            isOpen={activeCategory === category}
                            onToggle={() => toggleCategory(category)}
                        />
                    ))
                ) : (
                    isLocked ? (
                        <button
                            onClick={() => setShowUnlockModal(true)}
                            className="w-full py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:text-amber-500 hover:border-amber-200 dark:hover:border-amber-900/50 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all group"
                        >
                            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-3 transition-colors">
                                <Lock className="w-6 h-6 text-amber-500" />
                            </div>
                            <span className="font-semibold text-sm text-slate-600 dark:text-slate-300">Day Locked</span>
                            <span className="text-xs mt-1">Unlock availability to add routines</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => setShowManagerModal(true)}
                            className="w-full py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:text-indigo-500 hover:border-indigo-200 dark:hover:border-indigo-900/50 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all group"
                        >
                            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 transition-colors">
                                <Edit2 className="w-6 h-6" />
                            </div>
                            <span className="font-semibold text-sm">Design Your Day</span>
                            <span className="text-xs mt-1">Add your daily rituals & routines</span>
                        </button>
                    )
                )}
            </div>

            {/* SECTOR 2: HABITS (Fuel) */}
            <DailyHabits
                habits={dailyData.habits}
                onUpdateHabit={updateHabit}
                isLocked={isLocked}
            />

            {/* SECTOR 3: CRITICAL TASKS (The Output) */}
            {topTasks.length > 0 && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Priority Tasks</h3>
                        <button onClick={() => navigate('/workspace')} className="text-[11px] font-bold text-indigo-500 hover:text-indigo-600">VIEW ALL</button>
                    </div>
                    <div className="space-y-2">
                        {topTasks.map(task => (
                            <div key={task.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${task.priority === 'High' ? 'bg-red-500' : 'bg-slate-300'}`} />
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{task.name}</span>
                                </div>
                                <span className="text-xs text-slate-400">{task.time || 'Today'}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}


            {/* ACTION: Complete Day */}
            <div className="pt-6">
                {isLocked ? (
                    <div className="text-center p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800/50 dashed">
                        <div className="flex flex-col items-center gap-2 mb-4">
                            <Lock className="w-6 h-6 text-slate-400" />
                            <p className="text-sm text-slate-500 font-medium">Day Completed & Locked</p>
                        </div>
                        {dailyData.locked && !isPast && (
                            <Button variant="outline" onClick={() => setShowUnlockModal(true)} className="w-full sm:w-auto text-xs h-9">
                                Unlock to Edit
                            </Button>
                        )}
                    </div>
                ) : (
                    <Button
                        className="w-full py-4 text-sm font-semibold shadow-xl shadow-indigo-500/20"
                        onClick={handleInitialSubmit}
                    >
                        Complete Day
                    </Button>
                )}
            </div>

            {/* Modals */}
            <DayOverviewModal isOpen={showSubmitModal} onClose={() => setShowSubmitModal(false)} data={dailyData} onConfirm={handleConfirmSubmit} />
            <TaskManagerModal isOpen={showManagerModal} onClose={() => setShowManagerModal(false)} tasks={dailyData.tasks} />
            <UnifiedFeedbackModal isOpen={feedbackModal.isOpen} onClose={() => setFeedbackModal(prev => ({ ...prev, isOpen: false }))} type={feedbackModal.type} category={feedbackModal.category} />
            {/* Unlock Day Modal */}
            <Suspense fallback={null}>
                <UnlockDayModal isOpen={showUnlockModal} onClose={() => setShowUnlockModal(false)} onConfirm={handleUnlock} />
            </Suspense>

            {/* Footer Links */}
            <div className="flex justify-center gap-6 opacity-40 pt-8 pb-4">
                <button onClick={() => navigate('/history')} className="text-[10px] font-bold uppercase tracking-wider text-slate-500">History</button>
                <div className="w-px h-3 bg-slate-300 my-auto"></div>
                <button onClick={() => navigate('/settings')} className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Settings</button>
            </div>
        </div>
    );
};

export default Dashboard;
