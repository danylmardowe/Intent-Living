import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { Mode } from '@/lib/types';
import { lifeAreas } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { CheckCircle } from 'lucide-react';

interface ModeCardProps {
  mode: Mode;
}

export default function ModeCard({ mode }: ModeCardProps) {
  const activeAreas = lifeAreas.filter(area => mode.activeLifeAreaIds.includes(area.id));

  return (
    <Card className={cn(
        "flex flex-col",
        mode.isActive && "border-primary ring-2 ring-primary/50"
    )}>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="font-headline text-xl">{mode.name}</CardTitle>
                <CardDescription>A mode for {mode.duration} focus.</CardDescription>
            </div>
            {mode.isActive && <Badge variant="default" className="whitespace-nowrap"><CheckCircle className="mr-1.5 h-3.5 w-3.5"/>Active</Badge>}
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div>
            <h4 className="font-semibold text-sm mb-2">Mindsets</h4>
             <div className="flex flex-wrap gap-2">
                {mode.mindsets.map(mindset => (
                    <Badge key={mindset.id} variant="outline" className="font-normal">"{mindset.affirmation}"</Badge>
                ))}
            </div>
        </div>
        <Separator />
         <div>
            <h4 className="font-semibold text-sm mb-2">Active Life Areas</h4>
             <div className="flex flex-wrap gap-2">
                {activeAreas.map(area => (
                    <Badge key={area.id} variant="secondary" className="flex items-center gap-1.5">
                        <area.icon className="h-3 w-3" />
                        {area.name}
                    </Badge>
                ))}
            </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant={mode.isActive ? "secondary" : "default"} className="w-full" disabled={mode.isActive}>
          {mode.isActive ? 'Currently Active' : 'Activate Mode'}
        </Button>
      </CardFooter>
    </Card>
  );
}
