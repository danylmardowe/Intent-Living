import { objectives } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { lifeAreas } from '@/lib/mock-data';

const cadences = ['daily', 'weekly', 'monthly', 'sixMonthly'];
const cadenceTitles: Record<string, string> = {
    daily: 'Daily Objectives',
    weekly: 'Weekly Objectives',
    monthly: 'Monthly Objectives',
    sixMonthly: 'Six-Monthly Objectives'
}

export default function ObjectivesPage() {
  const objectivesByCadence = cadences.reduce((acc, cadence) => {
    acc[cadence] = objectives.filter(o => o.cadence === cadence);
    return acc;
  }, {} as Record<string, typeof objectives>);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">Objectives</h1>
          <p className="text-muted-foreground">Create, edit, and manage your objectives.
          </p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Objective
        </Button>
      </div>

      <Accordion type="multiple" defaultValue={['daily', 'weekly']} className="w-full">
        {cadences.map(cadence => (
            objectivesByCadence[cadence].length > 0 && (
          <AccordionItem key={cadence} value={cadence}>
            <AccordionTrigger className="text-lg font-medium">{cadenceTitles[cadence]}</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3">
                {objectivesByCadence[cadence].map(obj => {
                    const lifeArea = lifeAreas.find(la => la.id === obj.lifeAreaId);
                    return (
                        <div key={obj.id} className="flex items-center justify-between rounded-md border p-4">
                            <span className="font-medium">{obj.title}</span>
                            <div className="flex items-center gap-4">
                                {lifeArea && <Badge variant="secondary" className="flex items-center gap-1.5"><lifeArea.icon className="h-3 w-3" />{lifeArea.name}</Badge>}
                                <Badge variant={obj.status === 'active' ? 'default' : 'outline'} className="capitalize">{obj.status}</Badge>
                            </div>
                        </div>
                    )
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
            )
        ))}
      </Accordion>
    </div>
  );
}
