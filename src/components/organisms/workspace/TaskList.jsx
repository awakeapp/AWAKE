import TaskItem from '../../molecules/workspace/TaskItem';
import { ClipboardList } from 'lucide-react';

const TaskList = ({ 
    tasks, 
    onToggle, 
    onDelete, 
    onUpdate, 
    isLocked, 
    isVariant = 'default', 
    onReschedule, 
    onEdit,
    isSelectMode,
    selectedTaskIds,
    onSelect,
    onLongPress
}) => {

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
                    onEdit={onEdit}
                    isSelectMode={isSelectMode}
                    isSelected={selectedTaskIds?.has(task.id)}
                    onSelect={onSelect}
                    onLongPress={onLongPress}
                />
            ))}
        </div>
    );
};

export default TaskList;
