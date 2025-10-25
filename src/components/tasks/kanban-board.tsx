import { tasks } from '@/lib/mock-data';
import TaskCard from './task-card';

const statuses: Record<string, string> = {
  backlog: 'Backlog',
  scheduled: 'Scheduled',
  today: 'Today',
  'in-progress': 'In Progress',
  done: 'Done',
};

const statusOrder = ['backlog', 'scheduled', 'today', 'in-progress', 'done'];

export default function KanbanBoard() {
  const tasksByStatus = statusOrder.reduce((acc, status) => {
    acc[status] = tasks.filter(t => t.status === status);
    return acc;
  }, {} as Record<string, typeof tasks>);

  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {statusOrder.map(status => (
        <div key={status} className="w-72 flex-shrink-0">
          <div className="flex items-center justify-between p-2">
            <h3 className="font-semibold">{statuses[status]}</h3>
            <span className="text-sm font-medium text-muted-foreground">
              {tasksByStatus[status].length}
            </span>
          </div>
          <div className="space-y-4 rounded-md bg-secondary/50 p-2">
            {tasksByStatus[status].length > 0 ? (
                tasksByStatus[status].map(task => <TaskCard key={task.id} task={task} />)
            ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">No tasks</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
