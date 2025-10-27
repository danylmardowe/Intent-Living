// src/app/(app)/goals/page.tsx
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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import GoalTree from '@/components/goals/goal-tree'
import type { Task } from '@/components/tasks/task-card'

type Goal = {
  id: string
  title: string
  description?: string
  parentId?: string | null
  lifeAreaId?: string | null
  progress?: number
  progressMethod?: 'manual' | 'auto'
  status?: 'active' | 'paused' | 'completed'
  createdAt?: any
}

type Area = { id: string; name: string }

export default function GoalsPage() {
  const { data: goals, loading } = useUserCollection<Goal>('goals', 'title')
  const { data: tasks } = useUserCollection<Task>('tasks', 'createdAt')
  const { data: areas } = useUserCollection<Area>('lifeAreas', 'name')

  // Create goal
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [parentId, setParentId] = useState<string | 'none'>('none')
  const [lifeAreaId, setLifeAreaId] = useState<string | 'none'>('none')
  const [progressMethod, setProgressMethod] = useState<'manual'|'auto'>('manual')
  const [progress, setProgress] = useState<number>(0)
  const [busy, setBusy] = useState(false)

  const parentOptions = useMemo(() => goals.map(g => ({ id: g.id, title: g.title })), [goals])
  const areaOptions = useMemo(() => areas.map(a => ({ id: a.id, name: a.name })), [areas])

  async function addGoal(e: React.FormEvent) {
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
        status: 'active',
        progressMethod,
        createdAt: serverTimestamp(),
        ...(parentId !== 'none' && { parentId }),
        ...(lifeAreaId !== 'none' && { lifeAreaId }),
        ...(progressMethod === 'manual' && { progress: clamp(progress, 0, 100) }),
        ...(d && { description: d }),
      }
      await addDoc(collection(db, 'users', uid, 'goals'), payload)
      setTitle(''); setDescription(''); setParentId('none'); setLifeAreaId('none')
      setProgressMethod('manual'); setProgress(0)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Create Goal</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={addGoal} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:items-end">
            <div className="space-y-2 sm:col-span-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="e.g., Run 10K in under 60 minutes" />
            </div>
            <div className="space-y-2 sm:col-span-3">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e)=>setDescription(e.target.value)} rows={3} />
            </div>

            <div className="space-y-2">
              <Label>Parent goal</Label>
              <Select value={parentId} onValueChange={(v)=>setParentId(v as any)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {parentOptions.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                </SelectContent>
              </Select>
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
              <Label>Progress method</Label>
              <Select value={progressMethod} onValueChange={(v)=>setProgressMethod(v as 'manual'|'auto')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="auto">Auto (from children & tasks)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {progressMethod === 'manual' && (
              <div className="space-y-2">
                <Label>Progress: {Math.round(progress)}%</Label>
                <Slider value={[progress]} min={0} max={100} step={1} onValueChange={(v)=>setProgress(v[0] ?? 0)} />
              </div>
            )}

            <div>
              <Button type="submit" disabled={busy || !title.trim()}>Add</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <div className="p-4">Loading…</div>
      ) : (
        <GoalTree goals={goals} tasks={tasks} />
      )}
    </main>
  )
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}
