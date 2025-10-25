import GoalTree from '@/components/goals/goal-tree';
import { goals } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function GoalsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">Goals</h1>
          <p className="text-muted-foreground">Model larger outcomes and drive execution.</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Goal
        </Button>
      </div>
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            {goals.map(goal => (
              <GoalTree key={goal.id} goal={goal} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
