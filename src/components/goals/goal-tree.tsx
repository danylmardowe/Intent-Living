import type { Goal } from '@/lib/types';
import { lifeAreas } from '@/lib/mock-data';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronRight, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface GoalTreeProps {
  goal: Goal;
  level?: number;
}

export default function GoalTree({ goal, level = 0 }: GoalTreeProps) {
  const lifeArea = lifeAreas.find(la => la.id === goal.lifeAreaId);

  const hasChildren = goal.children && goal.children.length > 0;

  return (
    <Collapsible defaultOpen={level < 2}>
      <div className="flex items-center gap-2 rounded-md hover:bg-muted/50 pr-2">
        {hasChildren ? (
          <CollapsibleTrigger asChild>
            <button className="p-2">
              <ChevronRight className="h-4 w-4 transition-transform duration-200 [&[data-state=open]]:rotate-90" />
            </button>
          </CollapsibleTrigger>
        ) : (
          <div className="w-8 p-2 flex-shrink-0">
             <Target className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        <div className="flex-grow py-2">
            <div className="flex justify-between items-center">
                <span className="font-medium">{goal.title}</span>
                <span className="text-sm font-mono">{goal.progress}%</span>
            </div>
            <Progress value={goal.progress} className="h-2 mt-1" />
        </div>
        {lifeArea && (
            <Badge variant="outline" className="ml-4 flex items-center gap-1.5 whitespace-nowrap">
                <lifeArea.icon className="h-3 w-3" />
                {lifeArea.name}
            </Badge>
        )}
      </div>

      {hasChildren && (
        <CollapsibleContent>
          <div className="pl-8 border-l-2 border-dashed ml-4 mt-1 space-y-1">
            {goal.children?.map(childGoal => (
              <GoalTree key={childGoal.id} goal={childGoal} level={level + 1} />
            ))}
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}
