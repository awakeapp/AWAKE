import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useData } from '../context/DataContext';
import { useDate } from '../context/DateContext';
import RoutineCategory from '../components/organisms/RoutineCategory';
import DailyHabits from '../components/organisms/DailyHabits';
import DayOverviewModal from '../components/organisms/DayOverviewModal';
import TaskManagerModal from '../components/organisms/TaskManagerModal';
import UnifiedFeedbackModal from '../components/organisms/UnifiedFeedbackModal';
import DateHeader from '../components/organisms/DateHeader';
const UnlockDayModal = lazy(() => import('../components/organisms/UnlockDayModal'));
import Button from '../components/atoms/Button';
import { Loader2, ArrowLeft, Lock, Edit2, Plus, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

const Routine = () => {
    const { dailyData, updateTaskStatus, updateHabit, updateAllTasks, isLocked, submitDay, unlockDay } = useData();
    const { isPast } = useDate();
    const navigate = useNavigate();
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [showManagerModal, setShowManagerModal] = useState(false);
    const [showUnlockModal, setShowUnlockModal] = useState(false);

    // Track expanded categories (default all open)
    const [expandedCategories, setExpandedCategories] = useState({
        'EARLY MORNING': true,
        'BEFORE NOON': true,
        'AFTER NOON': true,
        'EVE/NIGHT': true,
    });

    // Unified Feedback Logic
    const [feedbackModal, setFeedbackModal] = useState({ isOpen: false, type: 'success', category: '' });

    // Tracking for success
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    if (!dailyData || !dailyData.tasks) {
        return (
            <div className="pb-24">
                <div className="sticky top-[60px] z-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md pt-3 pb-3 mb-4 border-b border-slate-200 dark:border-slate-800 -mx-4 px-4">
                    <DateHeader className="mb-0" />
                </div>
                <div className="flex items-center justify-center min-h-[40vh]">
                    <Loader2 className="w-8 h-8 animate-spin text-slate-300 dark:text-slate-700" />
                </div>
            </div>
        );
    }

    // Group tasks by category
    const categories = {
        'EARLY MORNING': dailyData.tasks.filter(t => t.category === 'EARLY MORNING'),
        'BEFORE NOON': dailyData.tasks.filter(t => t.category === 'BEFORE NOON'),
        'AFTER NOON': dailyData.tasks.filter(t => t.category === 'AFTER NOON'),
        'EVE/NIGHT': dailyData.tasks.filter(t => t.category === 'EVE/NIGHT' || t.category === 'NIGHT'),
    };

    // Track previous status of categories to detect changes
    // Status: 'incomplete' | 'success' (all checked) | 'failed' (completed but some missed)
    const categoryStatusRef = useRef({});

    useEffect(() => {
        if (!dailyData?.tasks) return;
        if (isPast) return;

        const newStatusMap = {};

        // Calculate current status for all categories
        Object.entries(categories).forEach(([category, tasks]) => {
            if (tasks.length === 0) {
                newStatusMap[category] = 'empty';
                return;
            }

            const allChecked = tasks.every(t => t.status === 'checked');
            const allHandled = tasks.every(t => t.status === 'checked' || t.status === 'missed');

            if (allChecked) {
                newStatusMap[category] = 'success';
            } else if (allHandled) {
                // If all are handled (no unchecked) but NOT all are checked, it's a "fail" (troll)
                newStatusMap[category] = 'failed';
            } else {
                newStatusMap[category] = 'incomplete';
            }
        });

        // Initialize ref on first load
        if (isInitialLoad) {
            categoryStatusRef.current = newStatusMap;
            setIsInitialLoad(false);
            return;
        }

        // Detect transitions
        Object.entries(newStatusMap).forEach(([category, status]) => {
            const prevStatus = categoryStatusRef.current[category] || 'incomplete';

            if (status !== prevStatus) {
                // Transition Logic
                if (prevStatus === 'incomplete' && status === 'success') {
                    // Success!
                    setFeedbackModal({ isOpen: true, type: 'success', category });
                } else if (prevStatus === 'incomplete' && status === 'failed') {
                    // Troll! (User finished category but failed some tasks)
                    setFeedbackModal({ isOpen: true, type: 'troll', category });
                }

                // If transitioning FROM success/failed TO incomplete, we just update the ref (reset), allows re-trigger later.
            }
        });

        // Update ref
        categoryStatusRef.current = newStatusMap;

    }, [dailyData.tasks, isPast, isInitialLoad]);


    const handleInitialSubmit = () => {
        setShowSubmitModal(true);
    };

    const handleConfirmSubmit = async (data) => {
        await submitDay(data);
        setShowSubmitModal(false);
    };

    const handleUnlock = (reason) => {
        unlockDay(reason);
        setShowUnlockModal(false);
    };

    return (
        <div className="pb-24">
            <div className="sticky top-0 z-50 -mx-4 px-2 sm:px-4 bg-slate-50/90 dark:bg-[#020617]/90 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 mb-6 pt-1 transition-all duration-300">
                <DateHeader 
                    className="w-full" 
                    overviewText={`${dailyData.tasks.filter(t => t.status === 'checked').length}/${dailyData.tasks.length}`}
                    onEditClick={() => setShowManagerModal(true)}
                    isLocked={isLocked}
                />
            </div>

            <div className="space-y-6">
                {/* Categories */}
                {Object.entries(categories).map(([category, tasks]) => (
                    <RoutineCategory
                        key={category}
                        title={category}
                        tasks={tasks}
                        onUpdateStatus={updateTaskStatus}
                        isLocked={isLocked}
                    />
                ))}

                {/* Habits */}
                <DailyHabits
                    habits={dailyData.habits}
                    onUpdateHabit={updateHabit}
                    isLocked={isLocked}
                />

                {/* Submit / Unlock */}
                {isLocked ? (
                    <div className="text-center p-6 bg-slate-100 rounded-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <div className="flex flex-col items-center gap-2 mb-4">
                            <div className="bg-slate-200 p-4 rounded-full dark:bg-slate-800">
                                <Lock className="w-8 h-8 text-slate-400" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">Day Locked</h3>
                                <p className="text-sm text-slate-500 font-normal">This day is completed and read-only.</p>
                            </div>
                        </div>
                        {dailyData.locked && !isPast && (
                            <Button
                                variant="outline"
                                onClick={() => setShowUnlockModal(true)}
                                className="w-full sm:w-auto"
                            >
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edit Day
                            </Button>
                        )}
                    </div>
                ) : (
                    <button
                        className="w-full py-3.5 text-sm font-semibold rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 shadow-sm ring-1 ring-slate-900/5 flex items-center justify-center gap-2 active:opacity-70 transition-opacity"
                        onClick={() => setShowSubmitModal(true)}
                    >
                        <List className="w-4 h-4 stroke-[1.5]" />
                        Today's Overview
                    </button>
                )}
            </div>

            {/* Submit Modal */}
            <DayOverviewModal
                isOpen={showSubmitModal}
                onClose={() => setShowSubmitModal(false)}
                data={dailyData}
                onConfirm={handleConfirmSubmit}
            />

            {/* Task Manager Modal */}
            <TaskManagerModal
                isOpen={showManagerModal}
                onClose={() => setShowManagerModal(false)}
                tasks={dailyData.tasks}
            />

            {/* Unified Feedback Modal (Success + Troll) */}
            <UnifiedFeedbackModal
                isOpen={feedbackModal.isOpen}
                onClose={() => setFeedbackModal(prev => ({ ...prev, isOpen: false }))}
                type={feedbackModal.type}
                category={feedbackModal.category}
            />

            {/* Unlock Day Modal */}
            <Suspense fallback={null}>
                <UnlockDayModal
                    isOpen={showUnlockModal}
                    onClose={() => setShowUnlockModal(false)}
                    onConfirm={handleUnlock}
                />
            </Suspense>
        </div>
    );
};

export default Routine;
