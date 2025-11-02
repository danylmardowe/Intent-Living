'use client'

import * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/auth-context'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import DailyObjectivesModal, { Objective, TriStatus } from './daily-objectives-modal'
import GeneralJournalingModal from './general-journaling-modal'
import { CheckCircle2, Triangle, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type JournalEntry = {
  id: string
  text: string
  lifeAreaId?: string | null
  kind?: string
  createdAt?: any
}

type LifeArea = {
  id: string
  name: string
  journalingCadence?: 'off' | 'daily' | 'weekly' | 'monthly' | 'custom'
}

function isCadenceDue(
  cadence: 'daily' | 'weekly' | 'monthly',
  lastAt: Date | null | undefined,
  now = new Date()
) {
  if (!lastAt) return true
  const diffDays = Math.floor((now.getTime() - lastAt.getTime()) / (1000 * 60 * 60 * 24))
  if (cadence === 'daily') return diffDays >= 1
  if (cadence === 'weekly') return diffDays >= 7
  if (cadence === 'monthly') return diffDays >= 28
  return false
}

function dayId(d: Date = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function DailyReviewWorkflow() {
  const { user } = useAuth()
  const [objectivesOpen, setObjectivesOpen] = useState(false)
  const [journalOpen, setJournalOpen] = useState(false)

  // ---------------- Daily Objectives: live (same as your latest) ----------------
  const [dailyObjectives, setDailyObjectives] = useState<Objective[]>([])
  const [serverChecks, setServerChecks] = useState<
    Record<string, { status: Exclude<TriStatus, null> | null; locked: boolean }>
  >({})
  const checkUnsubsRef = useRef<Record<string, () => void>>({})

  useEffect(() => {
    if (!user) return
    const today = dayId()

    const qObj = query(
      collection(db, 'users', user.uid, 'objectives'),
      where('cadence', '==', 'daily'),
      where('status', '==', 'active')
    )

    const unsubObjectives = onSnapshot(qObj, (snap) => {
      const objs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Objective[]
      setDailyObjectives(objs)

      Object.values(checkUnsubsRef.current).forEach((fn) => fn && fn())
      checkUnsubsRef.current = {}

      objs.forEach((o) => {
        const checkDocRef = doc(db, 'users', user.uid, 'objectives', o.id, 'checks', today)
        const unsub = onSnapshot(checkDocRef, (docSnap) => {
          const data = docSnap.data() as any
          let status: Exclude<TriStatus, null> | null = null
          if (data?.status === 'yes' || data?.status === 'no' || data?.status === 'partial') {
            status = data.status
          } else if (typeof data?.done === 'boolean') {
            status = data.done ? 'yes' : 'no'
          }
          const locked = !!data?.locked
          setServerChecks((prev) => ({ ...prev, [o.id]: { status, locked } }))
        })
        checkUnsubsRef.current[o.id] = unsub
      })
    })

    return () => {
      unsubObjectives()
      Object.values(checkUnsubsRef.current).forEach((fn) => fn && fn())
      checkUnsubsRef.current = {}
    }
  }, [user])

  const [draftAnswers, setDraftAnswers] = useState<Record<string, TriStatus>>({})
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({})
  const [editing, setEditing] = useState(false)

  function openObjectivesModal(seedFromServer: boolean) {
    if (seedFromServer) {
      const seeded: Record<string, TriStatus> = {}
      dailyObjectives.forEach((o) => (seeded[o.id] = serverChecks[o.id]?.status ?? null))
      setDraftAnswers(seeded)
      setDraftNotes({})
    }
    setObjectivesOpen(true)
  }

  const allLocked =
    dailyObjectives.length > 0 &&
    dailyObjectives.every((o) => serverChecks[o.id]?.locked === true)

  const answersSource: Record<string, TriStatus> =
    Object.keys(draftAnswers).length > 0
      ? draftAnswers
      : Object.fromEntries(
          dailyObjectives.map((o) => [o.id, serverChecks[o.id]?.status ?? null])
        )

  const yesList = dailyObjectives.filter((o) => answersSource[o.id] === 'yes')
  const partialList = dailyObjectives.filter((o) => answersSource[o.id] === 'partial')
  const noList = dailyObjectives.filter((o) => answersSource[o.id] === 'no')

  const allAnswered =
    dailyObjectives.length > 0 &&
    dailyObjectives.every(
      (o) =>
        answersSource[o.id] === 'yes' ||
        answersSource[o.id] === 'no' ||
        answersSource[o.id] === 'partial'
    )

  const showSubmit = !allLocked && Object.keys(draftAnswers).length > 0 && allAnswered

  async function submitObjectiveDrafts() {
    if (!user) return
    const today = dayId()
    await Promise.all(
      dailyObjectives.map(async (o) => {
        const s = draftAnswers[o.id]
        const done = s === 'yes'
        const partial = s === 'partial'
        const checkRef = doc(db, 'users', user.uid, 'objectives', o.id, 'checks', today)
        await setDoc(
          checkRef,
          { status: s, done, partial, locked: true, submittedAt: serverTimestamp() },
          { merge: true }
        )
        const note = (draftNotes[o.id] || '').trim()
        if (note) {
          await addDoc(collection(db, 'users', user.uid, 'journal'), {
            kind: 'objective',
            objectiveId: o.id,
            text: note,
            createdAt: serverTimestamp(),
          })
        }
      })
    )
    setDraftAnswers({})
    setDraftNotes({})
    setEditing(false)
  }

  // ---------------- Life-area + recents (kept minimal here) ----------------
  const [recent, setRecent] = useState<JournalEntry[]>([])
  useEffect(() => {
    if (!user) return
    const unsubRecent = onSnapshot(
      query(collection(db, 'users', user.uid, 'journal'), orderBy('createdAt', 'desc'), limit(6)),
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as JournalEntry))
        setRecent(items)
      }
    )
    return () => unsubRecent()
  }, [user])

  const canOpenToAnswer = !allLocked || editing

  return (
    <div className="space-y-6">
      {/* Daily Objectives card */}
      <Card className="hover:bg-muted/50 transition-colors">
        <div className="w-full text-left">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Daily Objectives</CardTitle>
                <CardDescription>
                  {dailyObjectives.length === 0 ? (
                    'No active daily objectives.'
                  ) : (
                    <>
                      <span className="font-medium">{yesList.length}</span> yes •{' '}
                      <span className="font-medium">{partialList.length}</span> partial •{' '}
                      <span className="font-medium">{noList.length}</span> no
                    </>
                  )}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {!allLocked ? (
                  showSubmit ? (
                    <Button size="sm" onClick={submitObjectiveDrafts} disabled={!showSubmit}>
                      Submit
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openObjectivesModal(Object.keys(draftAnswers).length === 0)}
                      disabled={!canOpenToAnswer}
                    >
                      Edit
                    </Button>
                  )
                ) : !editing ? (
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditing(true)
                      openObjectivesModal(true)
                    }}
                  >
                    Edit
                  </Button>
                ) : showSubmit ? (
                  <Button size="sm" onClick={submitObjectiveDrafts}>
                    Save changes
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => openObjectivesModal(true)}>
                    Edit
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            <div className="grid gap-1.5">
              {yesList.length > 0 && (
                <div className="text-sm">
                  <span className="mr-2 inline-flex items-center text-green-600 dark:text-green-500">
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Yes:
                  </span>
                  <span className="text-muted-foreground">
                    {yesList.map((o) => o.title).join(', ')}
                  </span>
                </div>
              )}
              {partialList.length > 0 && (
                <div className="text-sm">
                  <span className="mr-2 inline-flex items-center text-amber-600 dark:text-amber-500">
                    <Triangle className="h-4 w-4 mr-1" /> Partial:
                  </span>
                  <span className="text-muted-foreground">
                    {partialList.map((o) => o.title).join(', ')}
                  </span>
                </div>
              )}
              {noList.length > 0 && (
                <div className="text-sm">
                  <span className="mr-2 inline-flex items-center text-red-600 dark:text-red-500">
                    <XCircle className="h-4 w-4 mr-1" /> No:
                  </span>
                  <span className="text-muted-foreground">
                    {noList.map((o) => o.title).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </div>
      </Card>

      {/* General Journaling card */}
      <Card className="hover:bg-muted/50 transition-colors">
        <button type="button" onClick={() => setJournalOpen(true)} className="w-full text-left">
          <CardHeader>
            <CardTitle>General Journaling</CardTitle>
            <CardDescription>
              Click to answer 3 prompts. Entities (tasks, goals, activities) are bold + clickable with hover
              details.
            </CardDescription>
          </CardHeader>
        </button>
      </Card>
      <GeneralJournalingModal open={journalOpen} onOpenChange={setJournalOpen} />

      {/* Recent entries */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Entries</CardTitle>
          <CardDescription>Latest journal notes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {recent.length === 0 ? (
            <div className="text-sm text-muted-foreground">No entries yet.</div>
          ) : (
            recent.map((r) => (
              <div key={r.id} className="text-sm">
                {r.text}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
