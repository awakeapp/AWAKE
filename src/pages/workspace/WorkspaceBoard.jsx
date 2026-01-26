import { useTasks } from '../../context/TaskContext';
import { Plus, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';

const COLUMN_COLORS = {
    Work: 'bg-blue-500',
    Health: 'bg-emerald-500',
    Study: 'bg-amber-500',
    Personal: 'bg-purple-500',
    Spiritual: 'bg-sky-500'
};

const WorkspaceBoard = () => {
    const { tasks, updateTask } = useTasks();
    const categories = ['Work', 'Health', 'Study', 'Personal', 'Spiritual'];

    // Filter active tasks (not completed) for the board view? Or all? 
    // Usually boards show workflow. But here we are grouping by CATEGORY.
    // Let's show ALL PENDING tasks for now, as completed ones usually leave the active board.
    const activeTasks = tasks.filter(t => t.status !== 'completed' && !t.isCompleted);

    return (
        <div className="h-[calc(100vh-140px)] overflow-x-auto overflow-y-hidden">
            <div className="flex gap-6 h-full min-w-max pb-4">
                {categories.map(cat => {
                    const catTasks = activeTasks.filter(t => t.category === cat);

                    return (
                        <div key={cat} className="w-72 flex flex-col pt-2">
                            {/* Column Header */}
                            <div className="flex items-center justify-between mb-4 px-1">
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${COLUMN_COLORS[cat] || 'bg-slate-400'}`} />
                                    <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-sm">{cat}</h3>
                                    <span className="text-xs text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                        {catTasks.length}
                                    </span>
                                </div>
                                <button className="text-slate-400 hover:text-slate-600">
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Column Content */}
                            <div className="flex-1 bg-slate-100/50 dark:bg-slate-800/30 rounded-2xl p-3 overflow-y-auto space-y-3 border border-dashed border-slate-200 dark:border-slate-700">
                                {catTasks.map(task => (
                                    <div key={task.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow group cursor-pointer group">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase
                                                ${task.priority === 'High' ? 'bg-red-100 text-red-600' :
                                                    task.priority === 'Medium' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'
                                                }
                                            `}>
                                                {task.priority}
                                            </span>
                                        </div>
                                        <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1 leading-snug">
                                            {task.title}
                                        </h4>
                                        <div className="flex items-center justify-between text-xs text-slate-400 mt-3">
                                            <span>{task.date ? format(new Date(task.date), 'MMM d') : 'No Date'}</span>
                                            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                {task.estimatedTime}m
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Add Button Placeholder */}
                                <button className="w-full py-2 flex items-center justify-center gap-2 text-slate-400 hover:text-indigo-500 hover:bg-white/50 rounded-lg transition-all border border-transparent hover:border-indigo-200 dashed">
                                    <Plus className="w-4 h-4" />
                                    <span className="text-sm font-medium">Add Task</span>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default WorkspaceBoard;
