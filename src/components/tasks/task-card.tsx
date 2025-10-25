import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { Task } from '@/lib/types';
import { lifeAreas } from '@/lib/mock-data';
import { CalendarIcon } from 'lucide-react';

interface TaskCardProps {
  task: Task;
}

export default function TaskCard({ task }: TaskCardProps) {
  const lifeArea = lifeAreas.find(la => la.id === task.lifeAreaId);

  return (
    <Card className="flex flex-col">
      <CardHeader className="p-4">
        <CardTitle className="text-base">{task.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow p-4 pt-0">
        <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-3 p-4 pt-0">
        <div className="flex items-center text-xs text-muted-foreground">
          <CalendarIcon className="mr-1 h-3 w-3" />
          Due {new Date(task.dueAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
        {task.progress > 0 && <Progress value={task.progress} className="h-2 w-full" />}
        {lifeArea && (
          <Badge variant="outline" className="flex items-center gap-1.5">
            <lifeArea.icon className="h-3 w-3" />
            {lifeArea.name}
          </Badge>
        )}
      </CardFooter>
    </Card>
  );
}
