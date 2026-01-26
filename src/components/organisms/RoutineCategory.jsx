import TaskItem from '../molecules/workspace/TaskItem';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const RoutineCategory = ({ title, tasks, onUpdateStatus, isLocked }) => {
    if (!tasks || tasks.length === 0) return null;

    // Category Theme Colors
    const getTheme = () => {
        switch (title) {
            case 'EARLY MORNING': return 'from-indigo-500 to-blue-500';
            case 'BEFORE NOON': return 'from-blue-500 to-cyan-400';
            case 'AFTER NOON': return 'from-amber-400 to-orange-500';
            case 'EVE/NIGHT':
            case 'NIGHT': return 'from-indigo-900 to-slate-800';
            default: return 'from-slate-500 to-slate-600';
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

    return (
        <section className={`space-y-4 mb-10 ${isLocked ? 'opacity-70 grayscale-[0.5] pointer-events-none' : ''}`}>
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className={cn("w-1.5 h-6 rounded-full bg-gradient-to-b", getTheme())} />
                    <h3 className="text-[12px] font-semibold text-slate-900/40 dark:text-slate-100/40 uppercase tracking-[0.2em]">
                        {title}
                    </h3>
                </div>
                <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest bg-slate-50 dark:bg-slate-900/50 px-2 py-0.5 rounded-lg border border-slate-100 dark:border-slate-800">
                    {tasks.length} {tasks.length === 1 ? 'Task' : 'Tasks'}
                </span>
            </div>

            <motion.div
                className="grid gap-3"
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
        </section>
    );
};

export default RoutineCategory;
