import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EisenhowerMatrix from '@/components/tasks/eisenhower-matrix';
import KanbanBoard from '@/components/tasks/kanban-board';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function TasksPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">Manage your structured, actionable steps.</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      </div>

      <Tabs defaultValue="matrix">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="matrix">Eisenhower Matrix</TabsTrigger>
          <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
        </TabsList>
        <TabsContent value="matrix" className="mt-6">
          <EisenhowerMatrix />
        </TabsContent>
        <TabsContent value="kanban" className="mt-6">
          <KanbanBoard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
