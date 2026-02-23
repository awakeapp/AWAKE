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

    // Calculate completion for header
    const completed = tasks.filter(t => t.status === 'checked').length;
    const total = tasks.length;

    return (
        <section className={`mb-3 transition-all duration-300 ${isLocked ? 'opacity-70 grayscale-[0.5] pointer-events-none' : ''}`}>
            {/* Compact Category Header */}
            <div className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 shadow-sm ring-1 ring-slate-900/5 transition-all duration-200">
                <div className="flex items-center gap-2.5">
                    <div className={cn("w-1 h-4 rounded-full", getTheme())} />
                    <h3 className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest leading-none">
                        {title}
                    </h3>
                </div>
                <span className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                    {completed}/{total}
                </span>
            </div>

            {/* Content (Always Visible) */}
            <div className="overflow-hidden mt-2">
                <div className="grid gap-3 px-1 pb-4">
                    {tasks.map((task) => (
                        <TaskItem
                            key={task.id}
                            task={task}
                            onUpdateStatus={onUpdateStatus}
                            isLocked={isLocked}
                            isRoutine={true}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default RoutineCategory;
