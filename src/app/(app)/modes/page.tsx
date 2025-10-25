import ModeCard from '@/components/modes/mode-card';
import { modes } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function ModesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">Modes</h1>
          <p className="text-muted-foreground">Intentionally define and activate states of being.</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Mode
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {modes.map(mode => (
          <ModeCard key={mode.id} mode={mode} />
        ))}
      </div>
    </div>
  );
}
