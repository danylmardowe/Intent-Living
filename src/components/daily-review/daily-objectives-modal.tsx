'use client'

import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/auth-context'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

export type Objective = {
  id: string
  title: string
  cadence: 'daily' | 'weekly' | 'monthly' | 'six-monthly'
  status: 'active' | 'paused' | 'retired'
  lifeAreaId?: string | null
  goalId?: string | null
}

export type TriStatus = 'yes' | 'partial' | 'no' | null

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  objectives: Objective[]
  answers: Record<string, TriStatus>
  notes: Record<string, string>
  onSetAnswer: (id: string, status: Exclude<TriStatus, null>) => void
  onSetNote: (id: string, text: string) => void
}

function dayId(d: Date = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function generateObjectivePrompt(title: string) {
  const t = (title || '').trim()
  const minsMatch = t.match(/(\d+)\s*(min|mins|minutes)\b/i)
  const hoursMatch = t.match(/(\d+)\s*(h|hr|hrs|hour|hours)\b/i)

  const isExercise = /\b(exercise|workout|run|walk|gym|yoga|cardio|train)\b/i.test(t)
  const isStudy = /\b(learn|study|reading|course|lesson|practice|revise|camp)\b/i.test(t)
  const isHabit = /\b(meditate|journal|write|code|hydrate|sleep|clean|review)\b/i.test(t)

  if (isExercise && minsMatch) return `Did you exercise for ${minsMatch[1]} minutes today?`
  if (isExercise && hoursMatch)
    return `Did you exercise for ${hoursMatch[1]} hour${hoursMatch[1] === '1' ? '' : 's'} today?`
  if (isStudy && minsMatch) return `Did you study for ${minsMatch[1]} minutes today?`
  if (isStudy && /camp/i.test(t) && minsMatch)
    return `Did you do your ${minsMatch[1]} minutes of daily camp learning today?`
  if (isHabit) return `Did you ${t.replace(/\.*$/, '')} today?`
  return `Did you make progress on “${t}” today?`
}

/**
 * Modal is **controlled** by the parent.
 * It does not write to Firestore; it only updates parent-held drafts via callbacks.
 */
export default function DailyObjectivesModal({
  open,
  onOpenChange,
  objectives,
  answers,
  notes,
  onSetAnswer,
  onSetNote,
}: Props) {
  const [current, setCurrent] = useState(0)
  const total = objectives.length
  const currentObjective = objectives[current] ?? null

  // Reset to first objective whenever we open with a new list
  useEffect(() => {
    if (!open) return
    setCurrent(0)
  }, [open, total])

  // Optional context: show last note (from journal) for the current objective
  const { user } = useAuth()
  const [lastNote, setLastNote] = useState<string | null>(null)
  useEffect(() => {
    if (!user || !currentObjective) {
      setLastNote(null)
      return
    }
    const q = query(
      collection(db, 'users', user.uid, 'journal'),
      where('objectiveId', '==', currentObjective.id),
      orderBy('createdAt', 'desc'),
      limit(1)
    )
    const unsub = onSnapshot(q, (snap) => {
      const first = snap.docs[0]?.data() as any
      setLastNote(first?.text ?? null)
    })
    return () => unsub()
  }, [user, currentObjective?.id])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Daily Objectives</DialogTitle>
        </DialogHeader>

        {total === 0 ? (
          <div className="py-8 text-sm text-muted-foreground">
            You have no active daily objectives.
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {current + 1} of {total}
                </div>
                <div className="w-40">
                  <Progress value={((current + 1) / Math.max(total, 1)) * 100} />
                </div>
              </div>

              <div className="text-sm">
                <div className="font-medium mb-1">{currentObjective?.title}</div>
                <div className="text-base">
                  {generateObjectivePrompt(currentObjective?.title || '')}
                </div>
                {lastNote ? (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="mr-2">
                      Last note
                    </Badge>
                    {lastNote}
                  </div>
                ) : null}
              </div>

              <div className="flex gap-2">
                <Button
                  variant={answers[currentObjective!.id] === 'yes' ? 'default' : 'outline'}
                  onClick={() => onSetAnswer(currentObjective!.id, 'yes')}
                >
                  Yes
                </Button>
                <Button
                  variant={answers[currentObjective!.id] === 'partial' ? 'default' : 'outline'}
                  onClick={() => onSetAnswer(currentObjective!.id, 'partial')}
                >
                  Partial
                </Button>
                <Button
                  variant={answers[currentObjective!.id] === 'no' ? 'destructive' : 'outline'}
                  onClick={() => onSetAnswer(currentObjective!.id, 'no')}
                >
                  No
                </Button>
              </div>

              <div>
                <label className="block text-sm mb-1">Optional note</label>
                <Textarea
                  value={notes[currentObjective!.id] ?? ''}
                  onChange={(e) => onSetNote(currentObjective!.id, e.target.value)}
                  placeholder="Add a short reflection…"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                disabled={current === 0}
                onClick={() => setCurrent((i) => Math.max(0, i - 1))}
              >
                Back
              </Button>

              <div className="flex gap-2">
                {current < total - 1 ? (
                  <Button onClick={() => setCurrent((i) => Math.min(total - 1, i + 1))}>
                    Next
                  </Button>
                ) : (
                  <DialogClose asChild>
                    <Button>Done</Button>
                  </DialogClose>
                )}
                <DialogClose asChild>
                  <Button variant="outline">Close</Button>
                </DialogClose>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
