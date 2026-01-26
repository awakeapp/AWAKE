import { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { useDate } from '../context/DateContext';
import RoutineCategory from '../components/organisms/RoutineCategory';
import DailyHabits from '../components/organisms/DailyHabits';
import DayOverviewModal from '../components/organisms/DayOverviewModal';
import TaskManagerModal from '../components/organisms/TaskManagerModal';
import UnifiedFeedbackModal from '../components/organisms/UnifiedFeedbackModal';
import DateHeader from '../components/organisms/DateHeader';
import UnlockDayModal from '../components/organisms/UnlockDayModal';
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

    // Unified Feedback Logic
    const [feedbackModal, setFeedbackModal] = useState({ isOpen: false, type: 'success', category: '' });

    // Tracking for success
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    if (!dailyData || !dailyData.tasks) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
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
            <div className="sticky top-[60px] z-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md pt-3 pb-3 mb-4 border-b border-slate-200 dark:border-slate-800 -mx-4 px-4">
                <DateHeader className="mb-0" />
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-5 py-4 mb-6 flex items-center justify-between transition-all duration-150">
                <div className="flex items-center gap-4">
                    <div className="bg-slate-100 dark:bg-slate-800 p-2.5 rounded-xl text-slate-500">
                        <List className="w-5 h-5 stroke-[1.5]" />
                    </div>
                    <div>
                        <h2 className="text-[15px] font-semibold text-slate-700 dark:text-slate-200 tracking-tight">Daily Routine</h2>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                            {dailyData.tasks.filter(t => t.status === 'checked').length}/{dailyData.tasks.length} Completed
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowManagerModal(true)}
                    className={clsx(
                        "text-slate-400 hover:text-indigo-600 transition-colors p-2",
                        isLocked && "hidden"
                    )}
                    aria-label="Edit Routine"
                >
                    <Edit2 className="w-4 h-4 stroke-[1.5]" />
                </button>
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
                                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Day Locked</h3>
                                <p className="text-sm text-slate-500 font-medium">This day is completed and read-only.</p>
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
                    <Button
                        className="w-full py-4 text-base font-semibold transition-all duration-150 active:scale-[0.98]"
                        onClick={handleInitialSubmit}
                    >
                        Complete Day
                    </Button>
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
            <UnlockDayModal
                isOpen={showUnlockModal}
                onClose={() => setShowUnlockModal(false)}
                onConfirm={handleUnlock}
            />
        </div>
    );
};

export default Routine;
