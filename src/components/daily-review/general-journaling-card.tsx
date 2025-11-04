'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'
import GeneralJournalingModal from './general-journaling-modal'

interface GeneralJournalingCardProps {
  isSubmitted: boolean;
  onSubmit: (todayText: string, tomorrowText: string) => Promise<void>;
}

export default function GeneralJournalingCard({ isSubmitted, onSubmit }: GeneralJournalingCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSubmitAndClose = async (todayText: string, tomorrowText: string) => {
    await onSubmit(todayText, tomorrowText);
    setIsModalOpen(false);
  }

  return (
    <>
      <Card 
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => !isSubmitted && setIsModalOpen(true)}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>General Journal</CardTitle>
              <CardDescription>
                Click to reflect on today, generate tasks with AI, and plan for tomorrow.
              </CardDescription>
            </div>
            {isSubmitted && <CheckCircle2 className="h-6 w-6 text-green-500" />}
          </div>
        </CardHeader>
      </Card>

      <GeneralJournalingModal 
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleSubmitAndClose}
      />
    </>
  );
}