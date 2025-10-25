import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { tasks } from '@/lib/mock-data';
import TaskCard from './task-card';

const quadrants = {
  do: 'Urgent & Important',
  schedule: 'Not Urgent & Important',
  delegate: 'Urgent & Not Important',
  eliminate: 'Not Urgent & Not Important',
};

export default function EisenhowerMatrix() {
  const doTasks = tasks.filter(t => t.urgency >= 50 && t.importance >= 50);
  const scheduleTasks = tasks.filter(t => t.urgency < 50 && t.importance >= 50);
  const delegateTasks = tasks.filter(t => t.urgency >= 50 && t.importance < 50);
  const eliminateTasks = tasks.filter(t => t.urgency < 50 && t.importance < 50);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-primary">{quadrants.do}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {doTasks.map(task => <TaskCard key={task.id} task={task} />)}
        </CardContent>
      </Card>
      <Card className="bg-green-500/5 border-green-500/20">
        <CardHeader>
          <CardTitle className="text-green-600">{quadrants.schedule}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {scheduleTasks.map(task => <TaskCard key={task.id} task={task} />)}
        </CardContent>
      </Card>
      <Card className="bg-yellow-500/5 border-yellow-500/20">
        <CardHeader>
          <CardTitle className="text-yellow-600">{quadrants.delegate}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {delegateTasks.map(task => <TaskCard key={task.id} task={task} />)}
        </CardContent>
      </Card>
      <Card className="bg-red-500/5 border-red-500/20">
        <CardHeader>
          <CardTitle className="text-red-600">{quadrants.eliminate}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {eliminateTasks.map(task => <TaskCard key={task.id} task={task} />)}
        </CardContent>
      </Card>
    </div>
  );
}
