import { useTasks } from '../../context/TaskContext';
import TaskItem from '../../components/molecules/workspace/TaskItem';
import { useMemo } from 'react';
import { Calendar, Star, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useParams, useNavigate } from 'react-router-dom';

const FilteredTaskView = () => {
    const navigate = useNavigate();
    const { filterType } = useParams();
    const { tasks, toggleTask, deleteTask, updateTask, rescheduleTask } = useTasks();

    const filteredTasks = useMemo(() => {
        let sorted = [...tasks];

        switch (filterType) {
            case 'important':
                return sorted
                    .filter(t => t.priority === 'High' && !t.isCompleted && t.status !== 'completed')
                    .sort((a, b) => new Date(a.date) - new Date(b.date));
            case 'recent':
                return sorted
                    .sort((a, b) => b.createdAt - a.createdAt)
                    .slice(0, 20);
            case 'all':
            default:
                return sorted
                    .filter(t => !t.isCompleted && t.status !== 'completed')
                    .sort((a, b) => new Date(a.date) - new Date(b.date));
        }
    }, [tasks, filterType]);

    const getHeaderInfo = () => {
        if (filterType === 'important') return { title: 'Important Tasks', icon: Star, color: 'text-yellow-500' };
        if (filterType === 'recent') return { title: 'Recently Added', icon: Clock, color: 'text-blue-500' };
        return { title: 'All Active Tasks', icon: Calendar, color: 'text-indigo-500' };
    };

    const header = getHeaderInfo();
    const HeaderIcon = header.icon;

    return (
        <div className="space-y-6 pb-24">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex-shrink-0">
                    <svg className="w-6 h-6 text-slate-700 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className={`p-2 rounded-lg bg-slate-50 dark:bg-slate-800 ${header.color}`}>
                    <HeaderIcon className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 leading-tight">
                        {header.title}
                    </h1>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        {filteredTasks.length} tasks found
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                {filteredTasks.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            No tasks found in this view.
                        </p>
                    </div>
                ) : (
                    filteredTasks.map(task => (
                        <div key={task.id}>
                            {/* Optional Date Header if sorting by date */}
                            {/* Simplified List */}
                            <TaskItem
                                task={task}
                                onUpdateStatus={toggleTask} // Mapped to onUpdateStatus to match prop name in TaskItem
                                isLocked={false}
                            />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default FilteredTaskView;
