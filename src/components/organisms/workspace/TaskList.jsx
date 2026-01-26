import TaskItem from '../../molecules/workspace/TaskItem';
import { ClipboardList } from 'lucide-react';

const TaskList = ({ tasks, onToggle, onDelete, onUpdate, isLocked, isVariant = 'default', onReschedule }) => {

    if (tasks.length === 0) return null;

    return (
        <div className="space-y-3">
            {tasks.map((task) => (
                <TaskItem
                    key={task.id}
                    task={task}
                    onUpdateStatus={onToggle}
                    isLocked={isLocked}
                    variant={isVariant}
                    onReschedule={onReschedule}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
};

export default TaskList;
