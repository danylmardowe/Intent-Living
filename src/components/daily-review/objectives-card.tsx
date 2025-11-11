// src/components/daily-review/objectives-card.tsx
'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/auth-context'
import { db } from '@/lib/firebase'
import { collection, doc, onSnapshot, query, where } from 'firebase/firestore'
import { Objective, TriStatus } from '@/lib/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2, Triangle, XCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

type ObjectiveData = Record<string, { status: TriStatus, note: string }>

interface ObjectivesCardProps {
  isSubmitted: boolean
  isEditable: boolean
  onSubmit: (data: ObjectiveData) => Promise<void>
}

export default function ObjectivesCard({ isSubmitted, isEditable, onSubmit }: ObjectivesCardProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [objectives, setObjectives] = useState<Objective[]>([])
  const [answers, setAnswers] = useState<Record<string, TriStatus>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'users', user.uid, 'objectives'),
      where('cadence', '==', 'daily'),
      where('status', '==', 'active')
    )
    const unsub = onSnapshot(q, snap => {
      setObjectives(snap.docs.map(d => ({ id: d.id, ...d.data() } as Objective)))
      setLoading(false)
    })
    return () => unsub()
  }, [user])

  const allAnswered = objectives.length > 0 && objectives.every(obj => answers[obj.id])

  const handleSubmit = async () => {
    if (!allAnswered) return
    setIsSubmitting(true)
    const dataToSubmit: ObjectiveData = {}
    objectives.forEach(obj => {
      dataToSubmit[obj.id] = {
        status: answers[obj.id],
        note: notes[obj.id] || ''
      }
    })
    await onSubmit(dataToSubmit)
    setIsSubmitting(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Daily Objectives</CardTitle>
            <CardDescription>What did you accomplish today?</CardDescription>
          </div>
          {isSubmitted && <CheckCircle2 className="h-6 w-6 text-green-500" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && <Skeleton className="h-24 w-full" />}
        {objectives.map(obj => (
          <div key={obj.id} className="rounded-lg border p-4">
            <p className="font-semibold">{obj.title}</p>
            <div className="mt-3 flex flex-wrap gap-2">
                <Button
                    size="sm"
                    variant={answers[obj.id] === 'yes' ? 'default' : 'outline'}
                    onClick={() => setAnswers(p => ({...p, [obj.id]: 'yes'}))}
                    disabled={!isEditable || isSubmitting}
                    className="bg-green-600 hover:bg-green-700 text-white"
                >
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Yes
                </Button>
                <Button
                    size="sm"
                    variant={answers[obj.id] === 'partial' ? 'default' : 'outline'}
                    onClick={() => setAnswers(p => ({...p, [obj.id]: 'partial'}))}
                    disabled={!isEditable || isSubmitting}
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                >
                    <Triangle className="mr-2 h-4 w-4" /> Partial
                </Button>
                <Button
                    size="sm"
                    variant={answers[obj.id] === 'no' ? 'destructive' : 'outline'}
                    onClick={() => setAnswers(p => ({...p, [obj.id]: 'no'}))}
                    disabled={!isEditable || isSubmitting}
                >
                    <XCircle className="mr-2 h-4 w-4" /> No
                </Button>
            </div>
            <Textarea
              value={notes[obj.id] || ''}
              onChange={(e) => setNotes(p => ({...p, [obj.id]: e.target.value}))}
              placeholder="Add an optional note..."
              rows={2}
              className="mt-3 text-sm"
              disabled={!isEditable || isSubmitting}
            />
          </div>
        ))}
        {!isSubmitted && isEditable && (
          <Button onClick={handleSubmit} disabled={!allAnswered || isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Objectives'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}