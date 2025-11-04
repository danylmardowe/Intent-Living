// src/components/daily-review/appreciation-card.tsx
'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2 } from 'lucide-react'

interface AppreciationCardProps {
  isSubmitted: boolean
  onSubmit: (gratitudeText: string) => Promise<void>
}

export default function AppreciationCard({ isSubmitted, onSubmit }: AppreciationCardProps) {
  const [text, setText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!text.trim()) return
    setIsSubmitting(true)
    await onSubmit(text)
    setIsSubmitting(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Appreciation</CardTitle>
            <CardDescription>What are you grateful for today?</CardDescription>
          </div>
          {isSubmitted && <CheckCircle2 className="h-6 w-6 text-green-500" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write down a few things that brought you joy or that you're thankful for..."
          rows={4}
          disabled={isSubmitted || isSubmitting}
        />
        {!isSubmitted && (
          <Button onClick={handleSubmit} disabled={!text.trim() || isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Appreciation'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}