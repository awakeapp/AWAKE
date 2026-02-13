import TaskItem from '../molecules/workspace/TaskItem';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

const RoutineCategory = ({ title, tasks, onUpdateStatus, isLocked }) => {
    if (!tasks || tasks.length === 0) return null;

    // Category Theme Colors
    const getTheme = () => {
        switch (title) {
            case 'EARLY MORNING': return 'bg-indigo-500';
            case 'BEFORE NOON': return 'bg-blue-500';
            case 'AFTER NOON': return 'bg-amber-400';
            case 'EVE/NIGHT':
            case 'NIGHT': return 'bg-indigo-900';
            default: return 'bg-slate-500';
        }
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    // Calculate completion for header
    const completed = tasks.filter(t => t.status === 'checked').length;
    const total = tasks.length;

    return (
        <section className={`mb-4 transition-all duration-300 ${isLocked ? 'opacity-70 grayscale-[0.5] pointer-events-none' : ''}`}>
            {/* Header (Non-Interactive, just label) */}
            <div
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 shadow-sm ring-1 ring-slate-900/5 transition-all duration-200"
            >
                <div className="flex items-center gap-3">
                    <div className={cn("w-1.5 h-6 rounded-full", getTheme())} />
                    <div className="text-left">
                        <h3 className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest">
                            {title}
                        </h3>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                        {completed}/{total}
                    </span>
                </div>
            </div>

            {/* Content (Always Visible) */}
            <div className="overflow-hidden mt-2">
                <motion.div
                    className="grid gap-3 px-1 pb-4"
                    variants={container}
                    initial="hidden"
                    animate="show"
                >
                    {tasks.map((task) => (
                        <TaskItem
                            key={task.id}
                            task={task}
                            onUpdateStatus={onUpdateStatus}
                            isLocked={isLocked}
                            isRoutine={true}
                        />
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default RoutineCategory;
