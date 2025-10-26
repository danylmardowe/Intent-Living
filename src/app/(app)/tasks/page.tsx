// src/app/(app)/tasks/page.tsx
'use client'

import { useMemo, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { useUserCollection } from '@/lib/useUserCollection'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import KanbanBoard from '@/components/tasks/kanban-board'
import EisenhowerMatrix from '@/components/tasks/eisenhower-matrix'
import type { Task } from '@/components/tasks/task-card'

type Area = { id: string; name: string }
type Goal = { id: string; title: string }

export default function TasksPage() {
  const { data: tasks, loading } = useUserCollection<Task>('tasks', 'createdAt')
  const { data: lifeAreas } = useUserCollection<Area>('lifeAreas', 'name')
  const { data: goals } = useUserCollection<Goal>('goals', 'title')

  // Create form
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [lifeAreaId, setLifeAreaId] = useState<string | 'none'>('none')
  const [goalId, setGoalId] = useState<string | 'none'>('none')
  const [dueDate, setDueDate] = useState<string>('')      // yyyy-mm-dd
  const [startDate, setStartDate] = useState<string>('')  // yyyy-mm-dd
  const [importance, setImportance] = useState(50)
  const [urgency, setUrgency] = useState(40)
  const [busy, setBusy] = useState(false)

  async function addTask(e: React.FormEvent) {
    e.preventDefault()
    const uid = auth.currentUser?.uid
    if (!uid) return
    const t = title.trim()
    const d = description.trim()
    if (!t) return
    setBusy(true)
    try {
      const payload: any = {
        title: t,
        status: 'backlog', // backlog | scheduled | today | in_progress | blocked | done | archived
        importance,
        urgency,
        lifeAreaId: lifeAreaId === 'none' ? null : lifeAreaId,
        goalId: goalId === 'none' ? null : goalId,
        done: false,
        progress: 0,
        createdAt: serverTimestamp(),
        ...(d && { description: d }),
        ...(startDate && { startAt: new Date(startDate) }),
        ...(dueDate && { dueAt: new Date(dueDate) }),
      }
      await addDoc(collection(db, 'users', uid, 'tasks'), payload)
      // reset
      setTitle(''); setDescription(''); setLifeAreaId('none'); setGoalId('none')
      setDueDate(''); setStartDate(''); setImportance(50); setUrgency(40)
    } finally {
      setBusy(false)
    }
  }

  const areaOptions = useMemo(() => lifeAreas.map(a => ({ id: a.id, name: a.name })), [lifeAreas])
  const goalOptions = useMemo(() => goals.map(g => ({ id: g.id, title: g.title })), [goals])

  return (
    <main className="space-y-6">
      {/* Create Task */}
      <Card>
        <CardHeader><CardTitle>Create Task</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={addTask} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:items-end">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="t-title">Title</Label>
              <Input id="t-title" value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="e.g., Plan weekly workout schedule" />
            </div>
            <div className="space-y-2 sm:col-span-3">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e)=>setDescription(e.target.value)} rows={3} />
            </div>

            <div className="space-y-2">
              <Label>Life Area</Label>
              <Select value={lifeAreaId} onValueChange={(v)=>setLifeAreaId(v as any)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {areaOptions.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Goal</Label>
              <Select value={goalId} onValueChange={(v)=>setGoalId(v as any)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {goalOptions.map(g => <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Start date</Label>
              <Input type="date" value={startDate} onChange={(e)=>setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Due date</Label>
              <Input type="date" value={dueDate} onChange={(e)=>setDueDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Importance: {importance}</Label>
              <Slider value={[importance]} min={0} max={100} step={1} onValueChange={(v)=>setImportance(v[0] ?? 0)} />
            </div>
            <div className="space-y-2">
              <Label>Urgency: {urgency}</Label>
              <Slider value={[urgency]} min={0} max={100} step={1} onValueChange={(v)=>setUrgency(v[0] ?? 0)} />
            </div>

            <div>
              <Button type="submit" disabled={busy || !title.trim()}>Add</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Views */}
      {loading ? (
        <div className="p-4">Loading…</div>
      ) : (
        <Tabs defaultValue="kanban">
          <TabsList>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="matrix">Eisenhower Matrix</TabsTrigger>
          </TabsList>
          <TabsContent value="kanban" className="mt-4">
            <KanbanBoard tasks={tasks} />
          </TabsContent>
          <TabsContent value="matrix" className="mt-4">
            <EisenhowerMatrix tasks={tasks} />
          </TabsContent>
        </Tabs>
      )}
    </main>
  )
}
