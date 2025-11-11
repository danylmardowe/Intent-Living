// src/app/(app)/goals/page.tsx
'use client'

import { useMemo, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { useUserCollection } from '@/lib/useUserCollection'
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  writeBatch,
  getDocs,
  query,
  where,
  updateDoc,
} from 'firebase/firestore'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import GoalTree from '@/components/goals/goal-tree'
import GoalForm, { GoalFormValues } from '@/components/goals/goal-form'
import { useToast } from '@/hooks/use-toast'
import type { Task } from '@/lib/types' // Corrected import path

export type Goal = {
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
  const { toast } = useToast()
  const { data: goals, loading } = useUserCollection<Goal>('goals', 'title')
  const { data: tasks } = useUserCollection<Task>('tasks', 'createdAt')
  const { data: areas } = useUserCollection<Area>('lifeAreas', 'name')

  // ---- Quick create (top card) ----
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [parentId, setParentId] = useState<string | 'none'>('none')
  const [lifeAreaId, setLifeAreaId] = useState<string | 'none'>('none')
  const [progressMethod, setProgressMethod] = useState<'manual' | 'auto'>('manual')
  const [progress, setProgress] = useState<number>(0)
  const [busy, setBusy] = useState(false)

  // ---- Edit / add-child modal state ----
  const [editOpen, setEditOpen] = useState(false)
  const [editInitial, setEditInitial] = useState<GoalFormValues | null>(null)
  const [editId, setEditId] = useState<string | null>(null)

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
      toast({ title: 'Goal created' })
    } catch (e: any) {
      toast({ title: 'Failed to create goal', description: e?.message })
    } finally {
      setBusy(false)
    }
  }

  // ---- Edit handlers (open modal prefilled) ----
  function openEdit(goal: Goal) {
    setEditId(goal.id)
    setEditInitial({
      title: goal.title,
      description: goal.description ?? '',
      parentId: goal.parentId ?? 'none',
      lifeAreaId: goal.lifeAreaId ?? 'none',
      progressMethod: (goal.progressMethod ?? 'manual') as 'manual' | 'auto',
      progress: typeof goal.progress === 'number' ? goal.progress : 0,
      status: (goal.status ?? 'active') as GoalFormValues['status'],
    })
    setEditOpen(true)
  }

  function openAddChild(parent: Goal) {
    setEditId(null)
    setEditInitial({
      title: '',
      description: '',
      parentId: parent.id,
      lifeAreaId: parent.lifeAreaId ?? 'none',
      progressMethod: 'manual',
      progress: 0,
      status: 'active',
    })
    setEditOpen(true)
  }

  // ---- Persist form (create or update) ----
  async function saveGoal(values: GoalFormValues) {
    const uid = auth.currentUser?.uid
    if (!uid) return
    const data: any = {
      title: values.title.trim(),
      description: values.description.trim() || null,
      parentId: values.parentId === 'none' ? null : values.parentId,
      lifeAreaId: values.lifeAreaId === 'none' ? null : values.lifeAreaId,
      progressMethod: values.progressMethod,
      status: values.status,
      ...(values.progressMethod === 'manual' ? { progress: clamp(values.progress, 0, 100) } : { progress: null }),
    }
    try {
      if (editId) {
        await updateDoc(doc(db, 'users', uid, 'goals', editId), data)
        toast({ title: 'Goal updated' })
      } else {
        await addDoc(collection(db, 'users', uid, 'goals'), {
          ...data,
          createdAt: serverTimestamp(),
        })
        toast({ title: 'Goal created' })
      }
      setEditOpen(false)
      setEditId(null)
      setEditInitial(null)
    } catch (e: any) {
      toast({ title: 'Failed to save goal', description: e?.message })
    }
  }

  // ---- Delete with cascade: remove goal & descendants; detach their tasks ----
  async function deleteGoalCascade(rootId: string) {
    const uid = auth.currentUser?.uid
    if (!uid) return
    // Build descendant set from current state
    const ids = new Set<string>()
    const childrenIndex = new Map<string, string[]>()
    goals.forEach(g => {
      if (g.parentId) {
        const arr = childrenIndex.get(g.parentId) ?? []
        arr.push(g.id)
        childrenIndex.set(g.parentId, arr)
      }
    })
    const stack = [rootId]
    while (stack.length) {
      const id = stack.pop()!
      if (ids.has(id)) continue
      ids.add(id)
      const kids = childrenIndex.get(id) ?? []
      kids.forEach(k => stack.push(k))
    }

    // Detach tasks referencing any of these goals
    const tasksRef = collection(db, 'users', uid, 'tasks')
    const affectedTasks: Task[] = []
    // We can't query "in" for >10 IDs easily; do multiple queries in chunks of 10
    const idList = Array.from(ids)
    const chunks: string[][] = []
    for (let i = 0; i < idList.length; i += 10) chunks.push(idList.slice(i, i + 10))
    for (const chunk of chunks) {
      const qref = query(tasksRef, where('goalId', 'in', chunk))
      const snap = await getDocs(qref)
      snap.docs.forEach(d => affectedTasks.push({ id: d.id, ...(d.data() as any) }))
    }

    const batch = writeBatch(db)
    affectedTasks.forEach(t => {
      batch.update(doc(db, 'users', uid, 'tasks', t.id), { goalId: null })
    })
    // Delete goals (leaf-first is not required by Firestore; order is fine)
    ids.forEach(id => {
      batch.delete(doc(db, 'users', uid, 'goals', id))
    })
    try {
      await batch.commit()
      toast({ title: 'Goal deleted', description: `${ids.size} goal(s) removed; ${affectedTasks.length} task(s) detached.` })
    } catch (e: any) {
      toast({ title: 'Failed to delete', description: e?.message })
    }
  }

  return (
    <main className="space-y-6">
      {/* Quick create */}
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

      {/* Tree with CRUD actions */}
      {loading ? (
        <div className="p-4">Loading…</div>
      ) : (
        <GoalTree
          goals={goals}
          tasks={tasks}
          onEdit={openEdit}
          onAddChild={openAddChild}
          onDelete={(g) => deleteGoalCascade(g.id)}
        />
      )}

      {/* Create/Edit modal */}
      <GoalForm
        open={editOpen}
        onOpenChange={setEditOpen}
        allGoals={goals}
        areas={areas}
        initialValues={editInitial}
        // exclude self/descendants in parent list when editing
        editingGoalId={editId}
        onSubmit={saveGoal}
      />
    </main>
  )
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}