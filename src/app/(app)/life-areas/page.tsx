import LifeAreaCard from '@/components/life-areas/life-area-card';
import { lifeAreas } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function LifeAreasPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">Life Areas</h1>
          <p className="text-muted-foreground">Segment your life into meaningful domains to define vision and track focus.</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Life Area
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {lifeAreas.map(area => (
          <LifeAreaCard key={area.id} area={area} />
        ))}
      </div>
    </div>
  );
}
