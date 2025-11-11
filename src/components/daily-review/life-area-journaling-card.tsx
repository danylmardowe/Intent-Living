// src/components/daily-review/life-area-journaling-card.tsx
'use client'

import { useMemo, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2 } from 'lucide-react'
import { useUserCollection } from '@/lib/useUserCollection'
import { LifeArea, Task, Goal } from '@/lib/types'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Skeleton } from '../ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { InfoIcon } from 'lucide-react'

type JournalEntries = Record<string, string>

interface LifeAreaJournalingCardProps {
  isSubmitted: boolean;
  onSubmit: (entries: JournalEntries) => Promise<void>;
}

export default function LifeAreaJournalingCard({ isSubmitted, onSubmit }: LifeAreaJournalingCardProps) {
  const [entries, setEntries] = useState<JournalEntries>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: allLifeAreas, loading } = useUserCollection<LifeArea>('lifeAreas');
  const { data: tasks } = useUserCollection<Task>('tasks');
  const { data: goals } = useUserCollection<Goal>('goals');

  // 1. FILTER life areas to only include those with a 'daily' cadence
  const dailyLifeAreas = useMemo(() => {
    return allLifeAreas.filter(area => area.journalingCadence === 'daily');
  }, [allLifeAreas]);

  const handleSubmit = async () => {
    if (Object.values(entries).every(text => !text.trim())) return;
    setIsSubmitting(true);
    await onSubmit(entries);
    setIsSubmitting(false);
  };

  const allAreasAnswered = dailyLifeAreas.length > 0 && dailyLifeAreas.every(area => entries[area.id]?.trim());

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Life Area Journals</CardTitle>
            <CardDescription>Reflect on your daily life areas.</CardDescription>
          </div>
          {isSubmitted && <CheckCircle2 className="h-6 w-6 text-green-500" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : dailyLifeAreas.length === 0 ? (
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>No Daily Journaling Areas</AlertTitle>
            <AlertDescription>
              You haven't set any of your Life Areas to a "daily" journaling cadence. You can update this on the Life Areas page.
            </AlertDescription>
          </Alert>
        ) : (
          <Accordion type="multiple" className="w-full">
            {dailyLifeAreas.map(area => {
              // 2. GENERATE dynamic prompts for each area
              const relatedTasks = tasks.filter(t => t.lifeAreaId === area.id && t.status !== 'done' && t.status !== 'archived');
              const relatedGoals = goals.filter(g => g.lifeAreaId === area.id);

              const promptIntro = `How is your '${area.name}' area going at the moment?`;
              
              return (
                <AccordionItem value={area.id} key={area.id}>
                  <AccordionTrigger>{area.name}</AccordionTrigger>
                  <AccordionContent className="space-y-3">
                    <div className="text-sm text-muted-foreground space-y-1">
                        <p>{promptIntro}</p>
                        {relatedTasks.length > 0 && (
                            <p>Specifically, how is your progress on the task: <strong>"{relatedTasks[0].title}"</strong>?</p>
                        )}
                        {relatedGoals.length > 0 && !relatedTasks.length && (
                             <p>You have a goal for <strong>"{relatedGoals[0].title}"</strong> in this area. How are things tracking towards that?</p>
                        )}
                    </div>
                    <Textarea
                      value={entries[area.id] || ''}
                      onChange={(e) => setEntries(prev => ({ ...prev, [area.id]: e.target.value }))}
                      placeholder="Write your reflections here..."
                      rows={4}
                      disabled={isSubmitted || isSubmitting}
                    />
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
        
        {!isSubmitted && dailyLifeAreas.length > 0 && (
          <Button onClick={handleSubmit} disabled={!allAreasAnswered || isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Life Area Journals'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}