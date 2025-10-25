import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { LifeArea } from '@/lib/types';
import { Badge } from '../ui/badge';

interface LifeAreaCardProps {
  area: LifeArea;
}

export default function LifeAreaCard({ area }: LifeAreaCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 font-headline text-xl">
          <area.icon className="h-6 w-6 text-primary" />
          {area.name}
        </CardTitle>
        <CardDescription>"{area.vision}"</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div>
          <h4 className="font-semibold text-sm mb-2">Guiding Principles</h4>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {area.guidingPrinciples.map((principle, index) => (
              <li key={index}>{principle}</li>
            ))}
          </ul>
        </div>
        <Separator />
        <div>
          <h4 className="font-semibold text-sm mb-2">Key Performance Indicators (KPIs)</h4>
          <div className="flex flex-wrap gap-2">
            {area.kpis.map((kpi, index) => (
              <Badge key={index} variant="secondary">{kpi.name}: {kpi.value}</Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
