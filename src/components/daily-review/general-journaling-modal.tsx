// src/components/daily-review/general-journaling-modal.tsx
'use client'

import * as React from 'react'
import { useAuth } from '@/context/auth-context'
import { db } from '@/lib/firebase'
import {
  doc, getDoc, setDoc, serverTimestamp, Timestamp, addDoc, collection,
} from 'firebase/firestore'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

// ---------- Types ----------
type Step = 'write' | 'classify' | 'addActivities' | 'addTasks' | 'addGoals'

type JournalEntry = {
  id: string
  prompt: string
  answer: string
  createdAt: Timestamp
}

type GeneratedActivity = {
  title: string
  durationMins?: number
  notes?: string
  energyHint?: 'low' | 'medium' | 'high'
  confidence?: number
}

type GeneratedTask = {
  title: string
  description?: string
  status?: 'backlog' | 'scheduled' | 'today' | 'inprogress' | 'blocked'
  confidence?: number
}

type GeneratedGoal = {
  title: string
  description?: string
  lifeAreaId?: string
  confidence?: number
}

type GenerateResponse = {
  activities?: GeneratedActivity[]
  tasks?: GeneratedTask[]
  goals?: GeneratedGoal[]
}

// Unified candidate for the classify step
type CandidateType = 'activity' | 'task' | 'goal'
type Candidate = {
  id: string
  title: string
  description?: string
  durationMins?: number
  notes?: string
  energyHint?: 'low' | 'medium' | 'high'
  status?: GeneratedTask['status']
  confidence?: number
  type: CandidateType         // user-editable
  include: boolean            // user-editable
}

// ---------- Prompt bank (single prompt) ----------
const PROMPTS = ['What did you do today?']
function randomPrompt() { return PROMPTS[0] }

// ---------- Utils ----------
function pruneUndefined<T extends Record<string, any>>(obj: T): T {
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[k] = v
  return out as T
}

async function ensureUserRoot(uid: string) {
  await setDoc(doc(db, 'users', uid), { exists: true, updatedAt: serverTimestamp() }, { merge: true })
}

function uuid() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// Fallback (client) — mirrors/augments server; used if API returns empty/500.
function localExtract(note: string, maxItems = 12): GenerateResponse {
  const sentences = note.split(/(?<=[\.\?\!\n])/).map(s => s.trim()).filter(Boolean)

  // Wider coverage:
  const ACTIVITY_VERBS = /\b(went|did|worked|completed|trained|train|gym|ran|run|jogged|jog|walked|walk|hiked|cycle|cycled|biked|commuted|studied|learned|revised|practised|practiced|prepared|prepped|cleaned|cooked|wrote|writing|read|built|coding|coded|meeting|met|played|play|practice|practise|match|game)\b/i
  const SPORT_NOUNS = /\b(gym|run|jog|football|soccer|tennis|basketball|swim|swimming|yoga|pilates|cycling|bike|walk|hike)\b/i
  const DURATION = /\b(\d{1,3})\s*(min|mins|minutes|hr|hrs|hour|hours)\b/i
  const TASK_CUES = /\b(need to|should|must|todo|plan to|will|remind me|set up|book|schedule|buy|order|pick up|get|email|call|message|follow up|reach out|pay|submit|finish|complete|send|ship|reserve|register|sign up)\b/i
  const GOAL_CUES = /\b(i want to|i’d like to|i would like to|want to|aim to|plan to start|start .* program|learn|get into|commit to|over the next|this month i will|my goal is)\b/i

  const canon = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g,'').replace(/\s+/g,' ').trim()
  const dedup = <T extends { title: string }>(arr: T[]) =>
    Object.values(arr.reduce((acc, it:any) => { const k = canon(it.title); if (!acc[k]) acc[k]=it; return acc }, {} as Record<string,T>))

  const acts:any[] = [], tasks:any[] = [], goals:any[] = []
  for (const s of sentences) {
    const looksLikeActivity = ACTIVITY_VERBS.test(s) || SPORT_NOUNS.test(s)
    if (looksLikeActivity) {
      const m = s.match(DURATION)
      acts.push({
        title: s.replace(/^[-–•*]\s*/,'').slice(0,120),
        durationMins: m ? (m[2].startsWith('h')?Number(m[1])*60:Number(m[1])):undefined,
        energyHint: /gym|run|jog|trained|walk|hike|cycle|bike/i.test(s)?'high':undefined,
      })
    }
    if (TASK_CUES.test(s)) {
      tasks.push({
        title: s.replace(/^[-–•*]\s*/,'').slice(0,120),
        description: s.length>120?s.slice(0,500):undefined,
        status:'backlog',
      })
    }
    if (GOAL_CUES.test(s)) {
      goals.push({
        title: s.replace(/^[-–•*]\s*/,'').slice(0,120),
        description: s.length>120?s.slice(0,500):undefined,
      })
    }
    if (acts.length>=maxItems && tasks.length>=maxItems && goals.length>=maxItems) break
  }
  return { activities: dedup(acts).slice(0,maxItems), tasks: dedup(tasks).slice(0,maxItems), goals: dedup(goals).slice(0,maxItems) }
}

// ---------- Component ----------
export default function GeneralJournalingModal({
  open,
  onOpenChange,
  dateId,
  onExtractComplete,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  dateId: string
  onExtractComplete?: (result: GenerateResponse, entryId: string | null) => void
}) {
  const { user } = useAuth()
  const [step, setStep] = React.useState<Step>('write')

  // Single prompt; no regenerate
  const [promptText, setPromptText] = React.useState<string>(() => randomPrompt())
  const [answer, setAnswer] = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // extracted queues
  const [acts, setActs] = React.useState<GeneratedActivity[]>([])
  const [tasks, setTasks] = React.useState<GeneratedTask[]>([])
  const [goals, setGoals] = React.useState<GeneratedGoal[]>([])

  // CLASSIFY step state
  const [candidates, setCandidates] = React.useState<Candidate[]>([])

  const [iAct, setIAct] = React.useState(0)
  const [iTask, setITask] = React.useState(0)
  const [iGoal, setIGoal] = React.useState(0)

  // Linkage to this journal entry for idempotency/traceability
  const [entryId, setEntryId] = React.useState<string | null>(null)

  // Task & Goal small forms
  const [taskTitle, setTaskTitle] = React.useState('')
  const [taskDescription, setTaskDescription] = React.useState('')
  const [taskBusy, setTaskBusy] = React.useState(false)

  const [goalTitle, setGoalTitle] = React.useState('')
  const [goalDescription, setGoalDescription] = React.useState('')

  React.useEffect(() => {
    if (step === 'addTasks') {
      const t = tasks[iTask]
      setTaskTitle((t?.title || '').trim())
      setTaskDescription((t?.description || '').trim())
    }
  }, [step, iTask, tasks])

  React.useEffect(() => {
    if (step === 'addGoals') {
      const g = goals[iGoal]
      setGoalTitle((g?.title || '').trim())
      setGoalDescription((g?.description || '').trim())
    }
  }, [step, iGoal, goals])

  // Reset each time modal opens
  React.useEffect(() => {
    if (open) {
      setPromptText(randomPrompt())
      setAnswer('')
      setSaving(false)
      setError(null)
      setActs([]); setTasks([]); setGoals([])
      setCandidates([])
      setIAct(0); setITask(0); setIGoal(0)
      setTaskTitle(''); setTaskDescription(''); setGoalTitle(''); setGoalDescription('')
      setEntryId(null)
      setStep('write')
    }
  }, [open])

  // -------- Firestore writes --------
  async function saveJournalEntry(): Promise<{ ok: boolean; entryId?: string }> {
    if (!user?.uid) return { ok: false }
    try {
      await ensureUserRoot(user.uid)
      const reviewRef = doc(db, 'users', user.uid, 'dailyReviews', dateId)
      const snap = await getDoc(reviewRef)
      const existing = snap.exists() ? snap.data() : null

      const id = uuid()
      const entry: JournalEntry = {
        id,
        prompt: promptText,
        answer,
        createdAt: Timestamp.now(),
      }

      const next = {
        dateId,
        generalJournaling: {
          entries: [ ...(existing?.generalJournaling?.entries ?? []), pruneUndefined(entry) ],
          updatedAt: Timestamp.now(),
        },
        createdAt: existing?.createdAt ?? serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      await setDoc(reviewRef, pruneUndefined(next), { merge: true })
      return { ok: true, entryId: id }
    } catch {
      return { ok: false }
    }
  }

  async function extract(entryIdForContext?: string): Promise<GenerateResponse> {
    try {
      const res = await fetch('/api/ai/generate-tasks-activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: answer,
          context: { dateId, entryId: entryIdForContext, preferences: { maxItems: 12 } },
        }),
      })
      if (res.ok) {
        const gen = (await res.json()) as GenerateResponse
        const empty = (!gen.activities?.length) && (!gen.tasks?.length) && (!gen.goals?.length)
        if (!empty) return gen
      }
    } catch { /* ignore */ }
    return localExtract(answer, 12)
  }

  // -------- Create documents --------
  async function logActivity(a: GeneratedActivity) {
    if (!user?.uid) return
    await addDoc(collection(db, 'users', user.uid, 'activities'), pruneUndefined({
      title: (a.title || 'Activity').trim(),
      duration: a.durationMins ? a.durationMins * 60 * 1000 : undefined,
      notes: a.notes,
      energyLevel: a.energyHint === 'high' ? 3 : a.energyHint === 'medium' ? 2 : a.energyHint === 'low' ? 1 : undefined,
      source: 'journal-extract',
      sourceJournalEntryId: entryId || undefined,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }))
  }

  async function logTask(t: { title: string; description?: string; status?: GeneratedTask['status'] }) {
    if (!user?.uid) return
    await addDoc(collection(db, 'users', user.uid, 'tasks'), pruneUndefined({
      title: (t.title || 'Task').trim(),
      description: t.description?.trim() || undefined,
      status: t.status ?? 'backlog',
      source: 'journal-extract',
      sourceJournalEntryId: entryId || undefined,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }))
  }

  async function logGoal(g: { title: string; description?: string; lifeAreaId?: string }) {
    if (!user?.uid) return
    await addDoc(collection(db, 'users', user.uid, 'goals'), pruneUndefined({
      title: (g.title || 'Goal').trim(),
      description: g.description?.trim() || undefined,
      lifeAreaId: g.lifeAreaId || undefined,
      source: 'journal-extract',
      sourceJournalEntryId: entryId || undefined,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }))
  }

  // -------- Main action --------
  async function onSaveAndExtract() {
    if (!user?.uid || !answer.trim()) return
    setSaving(true); setError(null)

    const saved = await saveJournalEntry()
    if (saved.ok && saved.entryId) setEntryId(saved.entryId)

    const gen = await extract(saved.entryId)

    // Notify parent (card) that extraction finished (for optional routing/deep-linking)
    try { onExtractComplete?.(gen, saved.entryId ?? null) } catch {}

    // Build candidates for CLASSIFY
    const cls: Candidate[] = []
    for (const a of gen.activities ?? []) {
      cls.push({
        id: uuid(),
        type: 'activity',
        include: true,
        title: a.title,
        durationMins: a.durationMins,
        notes: a.notes,
        energyHint: a.energyHint,
        confidence: a.confidence,
      })
    }
    for (const t of gen.tasks ?? []) {
      cls.push({
        id: uuid(),
        type: 'task',
        include: true,
        title: t.title,
        description: t.description,
        status: t.status ?? 'backlog',
        confidence: t.confidence,
      })
    }
    for (const g of gen.goals ?? []) {
      cls.push({
        id: uuid(),
        type: 'goal',
        include: true,
        title: g.title,
        description: g.description,
        confidence: g.confidence,
      })
    }

    setSaving(false)

    if (cls.length === 0) {
      setError('No items detected. You can tweak your note or add items manually.')
      setStep('write')
      return
    }

    setCandidates(cls)
    setStep('classify')
  }

  // -------- Render fragments --------
  const renderWrite = (
    <div className="space-y-4">
      <div>
        <Label className="text-xs uppercase text-muted-foreground">Prompt</Label>
        <div className="mt-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
          {promptText}
        </div>
      </div>

      <div>
        <Label htmlFor="gj-answer">Your answer</Label>
        <Textarea
          id="gj-answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Free-write your thoughts here…"
          rows={10}
        />
      </div>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}

      <div className="flex items-center justify-end gap-2">
        <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={saving}>Close</Button>
        <Button onClick={onSaveAndExtract} disabled={saving || !answer.trim()}>
          {saving ? 'Saving & extracting…' : 'Save & extract'}
        </Button>
      </div>
    </div>
  )

  const renderClassify = (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Review suggestions. Set the correct type and toggle which ones to include. Then continue.
      </p>

      <div className="max-h-[50vh] overflow-auto space-y-3">
        {candidates.map((c) => (
          <div key={c.id} className="rounded-md border p-3">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <Input
                  value={c.title}
                  onChange={(e) =>
                    setCandidates(prev => prev.map(x => x.id === c.id ? { ...x, title: e.target.value } : x))
                  }
                />
                {c.type !== 'activity' ? (
                  <div className="mt-2">
                    <Label htmlFor={`desc-${c.id}`}>Description (optional)</Label>
                    <Textarea
                      id={`desc-${c.id}`}
                      rows={2}
                      value={c.description ?? ''}
                      onChange={(e) =>
                        setCandidates(prev => prev.map(x => x.id === c.id ? { ...x, description: e.target.value } : x))
                      }
                    />
                  </div>
                ) : (
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor={`dur-${c.id}`}>Duration (mins)</Label>
                      <Input
                        id={`dur-${c.id}`}
                        type="number"
                        inputMode="numeric"
                        value={c.durationMins ?? ''}
                        onChange={(e) => {
                          const v = e.target.value
                          const n = v === '' ? undefined : Number(v)
                          setCandidates(prev => prev.map(x => x.id === c.id ? { ...x, durationMins: Number.isFinite(n) ? n : undefined } : x))
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`notes-${c.id}`}>Notes (optional)</Label>
                      <Input
                        id={`notes-${c.id}`}
                        value={c.notes ?? ''}
                        onChange={(e) =>
                          setCandidates(prev => prev.map(x => x.id === c.id ? { ...x, notes: e.target.value } : x))
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="w-[220px] space-y-3">
                <div>
                  <Label>Type</Label>
                  <Select
                    value={c.type}
                    onValueChange={(val: CandidateType) =>
                      setCandidates(prev => prev.map(x => x.id === c.id ? { ...x, type: val } : x))
                    }
                  >
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activity">Activity</SelectItem>
                      <SelectItem value="task">Task</SelectItem>
                      <SelectItem value="goal">Goal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor={`inc-${c.id}`}>Include</Label>
                  <Switch
                    id={`inc-${c.id}`}
                    checked={c.include}
                    onCheckedChange={(v) =>
                      setCandidates(prev => prev.map(x => x.id === c.id ? { ...x, include: v } : x))
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button variant="secondary" onClick={() => setStep('write')}>Back</Button>
        <Button
          onClick={() => {
            // Split by type & include, then move to add loops
            const inc = candidates.filter(c => c.include && c.title.trim())
            const a: GeneratedActivity[] = inc.filter(c => c.type === 'activity').map(c => ({
              title: c.title,
              durationMins: c.durationMins,
              notes: c.notes,
              energyHint: c.energyHint,
            }))
            const t: GeneratedTask[] = inc.filter(c => c.type === 'task').map(c => ({
              title: c.title,
              description: c.description,
              status: c.status ?? 'backlog',
            }))
            const g: GeneratedGoal[] = inc.filter(c => c.type === 'goal').map(c => ({
              title: c.title,
              description: c.description,
            }))

            setActs(a); setTasks(t); setGoals(g)
            if (a.length) setStep('addActivities')
            else if (t.length) setStep('addTasks')
            else if (g.length) setStep('addGoals')
            else {
              setError('Nothing selected. You can tweak your note or close the dialog.')
              setStep('write')
            }
          }}
        >
          Continue
        </Button>
      </div>
    </div>
  )

  const renderAddActivity = (
    <div className="space-y-4">
      {acts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activities to add.</p>
      ) : (
        <>
          <div className="rounded-md border p-3">
            <div className="grid gap-3">
              <div>
                <Label htmlFor="act-title">Title</Label>
                <Input
                  id="act-title"
                  value={acts[iAct]?.title ?? ''}
                  onChange={(e) => {
                    const copy = [...acts]
                    copy[iAct] = { ...copy[iAct], title: e.target.value }
                    setActs(copy)
                  }}
                />
              </div>
              <div>
                <Label htmlFor="act-duration">Duration (mins)</Label>
                <Input
                  id="act-duration"
                  type="number"
                  inputMode="numeric"
                  value={acts[iAct]?.durationMins ?? ''}
                  onChange={(e) => {
                    const v = e.target.value
                    const n = v === '' ? undefined : Number(v)
                    const copy = [...acts]
                    copy[iAct] = { ...copy[iAct], durationMins: Number.isFinite(n) ? n : undefined }
                    setActs(copy)
                  }}
                />
              </div>
              <div>
                <Label htmlFor="act-notes">Notes (optional)</Label>
                <Textarea
                  id="act-notes"
                  value={acts[iAct]?.notes ?? ''}
                  onChange={(e) => {
                    const copy = [...acts]
                    copy[iAct] = { ...copy[iAct], notes: e.target.value }
                    setActs(copy)
                  }}
                  rows={3}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Add activity {iAct + 1} of {acts.length}
            </div>
            <div className="flex gap-2">
              {/* Convert to Task directly from here */}
              <Button
                variant="outline"
                onClick={() => {
                  const a = acts[iAct]
                  if (a?.title?.trim()) {
                    setTasks(prev => [...prev, { title: a.title, description: a.notes || '', status: 'backlog' }])
                    const copy = [...acts]
                    copy.splice(iAct, 1)
                    setActs(copy)
                    if (iAct >= copy.length && copy.length) setIAct(copy.length - 1)
                    if (!copy.length) {
                      if (tasks.length + 1) setStep('addTasks')
                      else if (goals.length) setStep('addGoals')
                      else onOpenChange(false)
                    }
                  }
                }}
              >
                Treat as Task
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  if (iAct + 1 < acts.length) setIAct(iAct + 1)
                  else if (tasks.length) setStep('addTasks')
                  else if (goals.length) setStep('addGoals')
                  else onOpenChange(false)
                }}
              >
                Skip
              </Button>
              <Button
                onClick={async () => {
                  const a = acts[iAct]
                  if (a?.title?.trim()) await logActivity(a)
                  if (iAct + 1 < acts.length) setIAct(iAct + 1)
                  else if (tasks.length) setStep('addTasks')
                  else if (goals.length) setStep('addGoals')
                  else onOpenChange(false)
                }}
              >
                Log Activity
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )

  const renderAddTask = (
    <div className="space-y-4">
      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tasks to add.</p>
      ) : (
        <>
          <div className="rounded-md border p-3">
            <div className="grid gap-3">
              <div>
                <Label htmlFor="task-title">Title</Label>
                <Input id="task-title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="task-desc">Description (optional)</Label>
                <Textarea id="task-desc" value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} rows={3} />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Add task {iTask + 1} of {tasks.length}
            </div>
            <div className="flex gap-2">
              {/* Convert to Activity directly from here */}
              <Button
                variant="outline"
                onClick={() => {
                  const t = tasks[iTask]
                  if ((taskTitle || t?.title)?.trim()) {
                    setActs(prev => [...prev, { title: (taskTitle || t?.title)!, notes: (taskDescription || t?.description) || '' }])
                    const copy = [...tasks]
                    copy.splice(iTask, 1)
                    setTasks(copy)
                    if (iTask >= copy.length && copy.length) setITask(copy.length - 1)
                    if (!copy.length) {
                      if (acts.length + 1) setStep('addActivities')
                      else if (goals.length) setStep('addGoals')
                      else onOpenChange(false)
                    }
                  }
                }}
              >
                Treat as Activity
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  if (iTask + 1 < tasks.length) setITask(iTask + 1)
                  else if (goals.length) setStep('addGoals')
                  else onOpenChange(false)
                }}
                disabled={taskBusy}
              >
                Skip
              </Button>
              <Button
                onClick={async () => {
                  if (!user?.uid) return
                  setTaskBusy(true)
                  try {
                    const t = tasks[iTask]
                    await logTask({
                      title: (taskTitle || t?.title || 'Task').trim(),
                      description: (taskDescription || t?.description || '').trim() || undefined,
                      status: t?.status ?? 'backlog',
                    })
                    if (iTask + 1 < tasks.length) setITask(iTask + 1)
                    else if (goals.length) setStep('addGoals')
                    else onOpenChange(false)
                  } finally {
                    setTaskBusy(false)
                  }
                }}
                disabled={!taskTitle.trim() && !(tasks[iTask]?.title ?? '').trim()}
              >
                Add task
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )

  const renderAddGoal = (
    <div className="space-y-4">
      {goals.length === 0 ? (
        <p className="text-sm text-muted-foreground">No goals to add.</p>
      ) : (
        <>
          <div className="rounded-md border p-3">
            <div className="grid gap-3">
              <div>
                <Label htmlFor="goal-title">Title</Label>
                <Input id="goal-title" value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="goal-desc">Description (optional)</Label>
                <Textarea id="goal-desc" value={goalDescription} onChange={(e) => setGoalDescription(e.target.value)} rows={3} />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Add goal {iGoal + 1} of {goals.length}
            </div>
            <div className="flex gap-2">
              {/* Convert to Task from here if desired */}
              <Button
                variant="outline"
                onClick={() => {
                  const g = goals[iGoal]
                  if ((goalTitle || g?.title)?.trim()) {
                    setTasks(prev => [...prev, { title: (goalTitle || g?.title)!, description: (goalDescription || g?.description) || '', status: 'backlog' }])
                    const copy = [...goals]
                    copy.splice(iGoal, 1)
                    setGoals(copy)
                    if (iGoal >= copy.length && copy.length) setIGoal(copy.length - 1)
                    if (!copy.length) {
                      if (tasks.length + 1) setStep('addTasks')
                      else if (acts.length) setStep('addActivities')
                      else onOpenChange(false)
                    }
                  }
                }}
              >
                Treat as Task
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  if (iGoal + 1 < goals.length) setIGoal(iGoal + 1)
                  else onOpenChange(false)
                }}
              >
                Skip
              </Button>
              <Button
                onClick={async () => {
                  const g = goals[iGoal]
                  const title = (goalTitle || g?.title || '').trim()
                  if (title) {
                    await logGoal({ title, description: (goalDescription || g?.description || '').trim() || undefined })
                  }
                  if (iGoal + 1 < goals.length) setIGoal(iGoal + 1)
                  else onOpenChange(false)
                }}
                disabled={!goalTitle.trim() && !(goals[iGoal]?.title ?? '').trim()}
              >
                Create goal
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )

  const dateFmt = new Date(dateId).toLocaleDateString(undefined, {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>General Journaling — {dateFmt}</DialogTitle>
          <DialogDescription>
            {step === 'write'
              ? 'Answer one quick prompt about your day.'
              : step === 'classify'
              ? 'Review suggestions, pick type(s), and include what you want.'
              : step === 'addActivities'
              ? 'Add extracted activities (prefilled).'
              : step === 'addTasks'
              ? 'Add extracted tasks (prefilled).'
              : 'Add extracted goals (prefilled).'}
          </DialogDescription>
        </DialogHeader>

        {step === 'write' && renderWrite}
        {step === 'classify' && renderClassify}
        {step === 'addActivities' && renderAddActivity}
        {step === 'addTasks' && renderAddTask}
        {step === 'addGoals' && renderAddGoal}
      </DialogContent>
    </Dialog>
  )
}
