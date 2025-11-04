'use client'

import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/auth-context'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { LifeArea, Goal, Task, Activity, ActivityType } from '@/lib/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Terminal } from 'lucide-react'

/* ---------- Time helpers ---------- */
function toLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
function nowLocalInput() {
  return toLocalInputValue(new Date())
}
function plusDaysLocalInput(days: number, h = 9, m = 0) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(h, m, 0, 0)
  return toLocalInputValue(d)
}

/* ---------- Fuzzy matching for inline entity highlighting ---------- */
function sim(a: string, b: string) {
  const s1 = a.toLowerCase().trim(),
    s2 = b.toLowerCase().trim()
  if (!s1 || !s2) return 0
  if (s1 === s2) return 1
  const bg = (s: string) => {
    const r: string[] = []
    for (let i = 0; i < s.length - 1; i++) r.push(s.slice(i, i + 2))
    return r
  }
  const b1 = bg(s1),
    b2 = bg(s2)
  const m = new Map<string, number>()
  b1.forEach((x) => m.set(x, (m.get(x) || 0) + 1))
  let o = 0
  b2.forEach((x) => {
    const n = m.get(x) || 0
    if (n > 0) {
      o++
      m.set(x, n - 1)
    }
  })
  return (2 * o) / (b1.length + b2.length)
}

function tokenize(
  text: string,
  entities: Array<{
    id: string
    title: string
    lifeAreaName?: string
    kind: 'task' | 'goal' | 'activityType'
  }>
) {
  return text.split(/(\s+)/).map((tok, i) => {
    const clean = tok.replace(/[^\p{L}\p{N}]/gu, '')
    let best: (typeof entities)[number] | null = null
    let score = 0
    for (const e of entities) {
      const s = sim(clean, e.title)
      if (s > 0.8 && s > score) {
        best = e
        score = s
      }
    }
    if (!best || !clean) return <React.Fragment key={i}>{tok}</React.Fragment>
    const href =
      best.kind === 'task'
        ? `/tasks/${best.id}`
        : best.kind === 'goal'
        ? `/goals/${best.id}`
        : undefined
    const chip = (
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            {href ? (
              <Link
                href={href}
                className="font-semibold underline underline-offset-4"
              >
                {tok}
              </Link>
            ) : (
              <span className="font-semibold">{tok}</span>
            )}
          </TooltipTrigger>
          <TooltipContent>
            <span className="text-xs">
              {best.kind === 'activityType' ? 'Activity' : 'Goal/Task'} •{' '}
              {best.lifeAreaName || 'Unassigned'}
            </span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
    return <React.Fragment key={i}>{tok}</React.Fragment>
  })
}

/* join helper: "a", "a and b", "a, b and c" */
function joinHuman(list: string[], conj: 'and' | 'or') {
  if (list.length <= 1) return list[0] || ''
  if (list.length === 2) return `${list[0]} ${conj} ${list[1]}`
  return `${list.slice(0, -1).join(', ')} ${conj} ${
    list[list.length - 1]
  }`
}

/* NEW: reflection prompt builder in the exact style requested */
function buildReflectPromptV2(
  goals: Goal[],
  tasks: Task[],
  justCreatedTasks: Task[]
) {
  const activeGoals = goals.filter((g) => g.isActive)
  const activeTasks = tasks.filter((t) => t.isActive)

  // fallbacks: if no active tasks, try just-created
  const taskPool = activeTasks.length > 0 ? activeTasks : justCreatedTasks

  const goalTitles = activeGoals.map((g) => g.title).slice(0, 3)
  const taskTitles = taskPool.map((t) => t.title).slice(0, 2)

  let part1 = 'How was your progress today?'
  if (goalTitles.length > 0) {
    part1 = `How was your progress towards ${joinHuman(goalTitles, 'and')}?`
  }

  let part2 = 'What went well and what got in the way?'
  if (taskTitles.length === 1) {
    part2 = `Did you work on ${taskTitles[0]} today, and how did it go?`
  } else if (taskTitles.length >= 2) {
    part2 = `Did you work on ${joinHuman(taskTitles, 'or')} today, and how did it go?`
  }

  return `${part1} ${part2}`
}

type TodayGen = {
  id: string
  title: string
  as: 'task' | 'activity'
  selected: boolean
  task: {
    description: string
    status: Task['status']
    startAt: string
    dueAt: string
    importance: number
    urgency: number
    lifeAreaId: string | null
    goalId: string | null
  }
  activity: {
    activityTypeId: string | null
    lifeAreaId: string | null
    startAt: string
    durationMin: number
  }
  expanded: boolean
}

type TomorrowGen = {
  id: string
  title: string
  as: 'task' | 'activity'
  lifeAreaId?: string | null
  activityTypeId?: string | null
  selected: boolean
}

interface GeneralJournalingModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (todayText: string, tomorrowText: string) => Promise<void>;
}

export default function GeneralJournalingModal({ open, onOpenChange, onSubmit }: GeneralJournalingModalProps) {
  const { user } = useAuth()

  const [lifeAreas, setLifeAreas] = useState<LifeArea[]>([])
  const [activeAreaIds, setActiveAreaIds] = useState<Set<string>>(new Set())
  const [goals, setGoals] = useState<Goal[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([])

  // steps: 0 Today, 1 Generate (AI), 2 Reflect, 3 Tomorrow
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0)

  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [p3, setP3] = useState('')

  const [taskQuery, setTaskQuery] = useState('')
  const [actQuery, setActQuery] = useState('')
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set())
  const [selectedActivityTypeIds, setSelectedActivityTypeIds] = useState<
    Set<string>
  >(new Set())

  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [todaySuggestions, setTodaySuggestions] = useState<TodayGen[]>([])
  const [tomorrowSuggestions, setTomorrowSuggestions] = useState<
    TomorrowGen[]
  >([])
  const [justCreatedTasks, setJustCreatedTasks] = useState<Task[]>([])

  useEffect(() => {
    if (!user || !open) return
    const unsubAreas = onSnapshot(
      collection(db, 'users', user.uid, 'lifeAreas'),
      (snap) => {
        setLifeAreas(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as LifeArea[]
        )
      }
    )
    const unsubMode = onSnapshot(
      query(
        collection(db, 'users', user.uid, 'modes'),
        where('isActive', '==', true),
        limit(1)
      ),
      (snap) => {
        const ids =
          ((snap.docs[0]?.data()?.activeLifeAreaIds as string[]) ?? [])
        setActiveAreaIds(new Set(ids))
      }
    )
    const unsubTypes = onSnapshot(
      collection(db, 'users', user.uid, 'activityTypes'),
      (snap) => {
        setActivityTypes(
          snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as ActivityType[]
        )
      }
    )
    ;(async () => {
      const gs = await getDocs(query(collection(db, 'users', user.uid, 'goals')))
      setGoals(
        gs.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Goal[]
      )
      const ts = await getDocs(query(collection(db, 'users', user.uid, 'tasks')))
      setTasks(
        ts.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Task[]
      )
    })()
    return () => {
      unsubAreas()
      unsubMode()
      unsubTypes()
    }
  }, [user, open])

  const lifeAreaName = (id?: string | null) =>
    lifeAreas.find((la) => la.id === id)?.name
  const entities = useMemo(
    () => [
      ...tasks.map(
        (t) =>
          ({
            id: t.id,
            title: t.title,
            lifeAreaName: lifeAreaName(t.lifeAreaId),
            kind: 'task' as const,
          } as const)
      ),
      ...goals.map(
        (g) =>
          ({
            id: g.id,
            title: g.title,
            lifeAreaName: lifeAreaName(g.lifeAreaId),
            kind: 'goal' as const,
          } as const)
      ),
      ...activityTypes.map(
        (a) =>
          ({
            id: a.id,
            title: a.title,
            lifeAreaName: lifeAreaName(a.defaultLifeAreaId),
            kind: 'activityType' as const,
          } as const)
      ),
    ],
    [tasks, goals, activityTypes, lifeAreas]
  )

  const prompt1Label = 'What did you get done today?'

  const filteredTasks = useMemo(() => {
    const s = taskQuery.toLowerCase().trim()
    const list = tasks.filter((t) => t.status !== 'archived')
    if (!s) return list.slice(0, 100)
    return list
      .filter(
        (t) => t.title.toLowerCase().includes(s) || sim(t.title, s) > 0.7
      )
      .slice(0, 100)
  }, [tasks, taskQuery])

  const filteredActivityTypes = useMemo(() => {
    const s = actQuery.toLowerCase().trim()
    if (!s) return activityTypes.slice(0, 100)
    return activityTypes
      .filter(
        (a) => a.title.toLowerCase().includes(s) || sim(a.title, s) > 0.7
      )
      .slice(0, 100)
  }, [activityTypes, actQuery])

  function toggleTask(id: string) {
    setSelectedTaskIds((prev) => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }
  function toggleActivityType(id: string) {
    setSelectedActivityTypeIds((prev) => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  /* --- AI generator call (server route) --- */
  async function generateFromP1() {
    setIsGenerating(true)
    setGenerationError(null);
    setTodaySuggestions([])
    
    try {
        const res = await fetch('/api/ai/generate-tasks-activities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              input: p1,
              context: {
                lifeAreas: lifeAreas.map((l) => ({ name: l.name })),
                tasks: tasks.map((t) => ({ title: t.title })),
                goals: goals.map((g) => ({ title: g.title })),
                activityTypes: activityTypes.map((a) => ({ title: a.title })),
              },
            }),
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data?.error || 'Failed to generate suggestions.');
          }

          const firstArea = [...activeAreaIds][0] ?? null;
          const suggs: TodayGen[] = [
            ...data.tasks.map((t: any, i: number) => ({
                id: `t-${i}`,
                title: t.title,
                as: 'task' as const,
                selected: true,
                expanded: false,
                task: {
                  description: t.description || '',
                  status: (t.status || 'scheduled') as Task['status'],
                  startAt: toLocalInputValue(
                    new Date(Date.now() + (t.startOffsetMin ?? 0) * 60 * 1000)
                  ),
                  dueAt: plusDaysLocalInput(t.dueDaysFromNow ?? 1),
                  importance: Number(t.importance ?? 50),
                  urgency: Number(t.urgency ?? 40),
                  lifeAreaId: mapNameToId(t.lifeAreaName, lifeAreas) ?? firstArea,
                  goalId: mapTitleToId(t.goalTitle, goals),
                },
                activity: {
                  activityTypeId: null,
                  lifeAreaId: firstArea,
                  startAt: nowLocalInput(),
                  durationMin: 30,
                },
              })),
              ...data.activities.map((a: any, i: number) => ({
                id: `a-${i}`,
                title: a.title,
                as: 'activity' as const,
                selected: true,
                expanded: false,
                task: {
                  description: '',
                  status: 'scheduled',
                  startAt: nowLocalInput(),
                  dueAt: plusDaysLocalInput(1),
                  importance: 50,
                  urgency: 40,
                  lifeAreaId: firstArea,
                  goalId: null,
                },
                activity: {
                  activityTypeId: mapTitleToId(a.activityTypeTitle, activityTypes),
                  lifeAreaId: mapNameToId(a.lifeAreaName, lifeAreas) ?? firstArea,
                  startAt: toLocalInputValue(
                    new Date(Date.now() + (a.startOffsetMin ?? 0) * 60 * 1000)
                  ),
                  durationMin: Number(a.durationMin ?? 30),
                },
              })),
          ];

          setTodaySuggestions(suggs);
          setStep(1); // Move to next step on SUCCESS
    } catch (error: any) {
        setGenerationError(error.message);
    } finally {
        setIsGenerating(false);
    }
  }

  function mapNameToId(name?: string, arr?: { id: string; name: string }[] | null) {
    if (!name) return null
    const exact = arr?.find((x) => x.name.toLowerCase() === name.toLowerCase())
      ?.id
    if (exact) return exact
    const best = arr?.reduce(
      (best, cur) => {
        const s = sim(name, cur.name)
        return s > (best?.score ?? 0) ? { id: cur.id, score: s } : best
      },
      null as null | { id: string; score: number }
    )
    return best && best.score > 0.8 ? best.id : null
  }
  function mapTitleToId(
    title?: string,
    arr?: { id: string; title: string }[] | null
  ) {
    if (!title) return null
    const exact = arr?.find(
      (x) => x.title.toLowerCase() === title.toLowerCase()
    )?.id
    if (exact) return exact
    const best = arr?.reduce(
      (best, cur) => {
        const s = sim(title, cur.title)
        return s > (best?.score ?? 0) ? { id: cur.id, score: s } : best
      },
      null as null | { id: string; score: number }
    )
    return best && best.score > 0.8 ? best.id : null
  }

  async function addTodaySelectedAndAdvance() {
    if (!user) return
    const toCreate = todaySuggestions.filter((s) => s.selected)
    const createdTitles: string[] = []
    await Promise.all(
      toCreate.map(async (s) => {
        if (s.as === 'task') {
          const t = s.task
          await addDoc(collection(db, 'users', user.uid, 'tasks'), {
            title: s.title,
            description: t.description || '',
            status: t.status || 'scheduled',
            lifeAreaId: t.lifeAreaId ?? null,
            goalId: t.goalId ?? null,
            startAt: t.startAt ? new Date(t.startAt) : null,
            dueAt: t.dueAt ? new Date(t.dueAt) : null,
            importance: Number(t.importance ?? 50),
            urgency: Number(t.urgency ?? 40),
            createdAt: serverTimestamp(),
          })
          createdTitles.push(s.title)
        } else {
          const a = s.activity
          await addDoc(collection(db, 'users', user.uid, 'activities'), {
            title: s.title,
            activityTypeId: a.activityTypeId ?? null,
            lifeAreaId: a.lifeAreaId ?? null,
            startAt: a.startAt ? new Date(a.startAt) : serverTimestamp(),
            durationMin: Number(a.durationMin ?? 30),
            createdAt: serverTimestamp(),
          })
        }
      })
    )
    setJustCreatedTasks(
      createdTitles.map((title, i) => ({ id: `local-${i}`, title } as Task))
    )
    setStep(2)
  }

  function buildTomorrowFromP3() {
    const firstArea = [...activeAreaIds][0] ?? null
    const parts = p3
      .split(/[\n\.!\?]+/g)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 10)
    setTomorrowSuggestions(
      parts.map((title, i) => ({
        id: `tm-${i}`,
        title,
        as: 'task',
        lifeAreaId: firstArea,
        activityTypeId: null,
        selected: true,
      }))
    )
  }
  async function createTomorrowSelected() {
    if (!user) return
    const dueAt = new Date()
    dueAt.setDate(dueAt.getDate() + 1)
    dueAt.setHours(9, 0, 0, 0)
    await Promise.all(
      tomorrowSuggestions
        .filter((s) => s.selected)
        .map(async (s) => {
          if (s.as === 'task') {
            await addDoc(collection(db, 'users', user.uid, 'tasks'), {
              title: s.title,
              status: 'scheduled',
              lifeAreaId: s.lifeAreaId ?? null,
              dueAt,
              importance: 50,
              urgency: 40,
              createdAt: serverTimestamp(),
            })
          } else {
            await addDoc(collection(db, 'users', user.uid, 'activities'), {
              title: s.title,
              lifeAreaId: s.lifeAreaId ?? null,
              activityTypeId: s.activityTypeId ?? null,
              startAt: serverTimestamp(),
              durationMin: 30,
              createdAt: serverTimestamp(),
            })
          }
        })
    )
    setTomorrowSuggestions([])
  }

  async function saveJournalsAndClose() {
    await onSubmit(p1, p3);
    onOpenChange(false)
    setStep(0)
    setP1('')
    setP2('')
    setP3('')
    setSelectedTaskIds(new Set())
    setSelectedActivityTypeIds(new Set())
    setTodaySuggestions([])
    setTomorrowSuggestions([])
    setJustCreatedTasks([])
  }

  const reflectPromptV2 = buildReflectPromptV2(goals, tasks, justCreatedTasks)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>General Journaling</DialogTitle>
          {/* Fix for accessibility warning */}
          <DialogDescription className="sr-only">
            A multi-step modal to reflect on your day, generate tasks, and plan for tomorrow.
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center gap-2 text-xs mb-2">
          <Badge variant={step === 0 ? 'default' : 'outline'}>1</Badge>
          <span>Today</span>
          <span className="opacity-40">—</span>
          <Badge variant={step === 1 ? 'default' : 'outline'}>2</Badge>
          <span>Generate</span>
          <span className="opacity-40">—</span>
          <Badge variant={step === 2 ? 'default' : 'outline'}>3</Badge>
          <span>Reflect</span>
          <span className="opacity-40">—</span>
          <Badge variant={step === 3 ? 'default' : 'outline'}>4</Badge>
          <span>Tomorrow</span>
        </div>

        {/* MODAL CONTENT STARTS HERE */}
        {step === 0 && (
          <div className="space-y-4">
             {generationError && (
                <Alert variant="destructive">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Generation Failed</AlertTitle>
                    <AlertDescription>{generationError}</AlertDescription>
                </Alert>
            )}
            <Card>
              <CardContent className="pt-4 space-y-2">
                <div className="text-sm font-medium">{prompt1Label}</div>
                <Textarea
                  rows={3}
                  value={p1}
                  onChange={(e) => setP1(e.target.value)}
                />
                <div className="text-sm text-muted-foreground">
                  {tokenize(p1, entities)}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardContent className="pt-4 space-y-2">
                  <div className="text-sm font-medium">
                    Select any tasks you completed
                  </div>
                  <Input
                    placeholder="Search tasks…"
                    value={taskQuery}
                    onChange={(e) => setTaskQuery(e.target.value)}
                  />
                  <div className="max-h-56 overflow-auto rounded-md border">
                    {filteredTasks.length === 0 ? (
                      <div className="p-3 text-sm text-muted-foreground">
                        No tasks
                      </div>
                    ) : (
                      <div className="p-2 grid gap-1">
                        {filteredTasks.map((t) => {
                          const checked = selectedTaskIds.has(t.id)
                          return (
                            <label
                              key={t.id}
                              className="flex items-center gap-2 rounded px-2 py-1 hover:bg-muted cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={checked}
                                onChange={() => toggleTask(t.id)}
                              />
                              <span className="text-sm">
                                <span className="font-medium">{t.title}</span>{' '}
                                <span className="text-xs text-muted-foreground">
                                  {lifeAreaName(t.lifeAreaId) || 'Unassigned'}
                                </span>
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4 space-y-2">
                  <div className="text-sm font-medium">
                    Select any activities you did
                  </div>
                  <Input
                    placeholder="Search activities…"
                    value={actQuery}
                    onChange={(e) => setActQuery(e.target.value)}
                  />
                  <div className="max-h-56 overflow-auto rounded-md border">
                    {filteredActivityTypes.length === 0 ? (
                      <div className="p-3 text-sm text-muted-foreground">
                        No activities
                      </div>
                    ) : (
                      <div className="p-2 grid gap-1">
                        {filteredActivityTypes.map((a) => {
                          const checked = selectedActivityTypeIds.has(a.id)
                          return (
                            <label
                              key={a.id}
                              className="flex items-center gap-2 rounded px-2 py-1 hover:bg-muted cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={checked}
                                onChange={() => toggleActivityType(a.id)}
                              />
                              <span className="text-sm">
                                <span className="font-medium">{a.title}</span>{' '}
                                <span className="text-xs text-muted-foreground">
                                  {lifeAreaName(a.defaultLifeAreaId) ||
                                    'Unassigned'}
                                </span>
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={generateFromP1}
                disabled={isGenerating || !p1.trim()}
              >
                {isGenerating ? 'Generating…' : 'Next'}
              </Button>
            </div>
          </div>
        )}

        {step === 1 && (
            <p>Generate Step Content Goes Here...</p>
        )}
        {step === 2 && (
            <p>Reflect Step Content Goes Here...</p>
        )}
        {step === 3 && (
            <p>Tomorrow Step Content Goes Here...</p>
        )}
        {/* MODAL CONTENT ENDS HERE */}

        <div className="flex justify-end pt-2">
            <DialogClose asChild>
                <Button variant="outline">Close</Button>
            </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}