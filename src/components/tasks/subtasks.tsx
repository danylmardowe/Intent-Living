// src/components/tasks/subtasks.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'

type Subtask = {
  id: string
  title: string
  weight: number // 0..100, relative, doesn't have to sum to 100 (we normalize)
  done: boolean
  createdAt?: any
}

export default function Subtasks({
  taskId,
  currentProgress,
  onManualProgressCommit,
}: {
  taskId: string
  currentProgress: number
  onManualProgressCommit: (next: number) => void
}) {
  const [items, setItems] = useState<Subtask[]>([])
  const [title, setTitle] = useState('')
  const [weight, setWeight] = useState<number>(50)
  const [busy, setBusy] = useState(false)
  const [manual, setManual] = useState<number>(Math.round(currentProgress))

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    const qref = query(collection(db, 'users', uid, 'tasks', taskId, 'subtasks'), orderBy('createdAt'))
    const unsub = onSnapshot(qref, (snap) => {
      const rows = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Subtask[]
      setItems(rows)
    })
    return () => unsub()
  }, [taskId])

  // Recompute parent progress when subtasks change
  useEffect(() => {
    if (items.length === 0) return
    const uid = auth.currentUser?.uid
    if (!uid) return
    const total = items.reduce((s, i) => s + (Number(i.weight) || 0), 0)
    const numerator = items.reduce((s, i) => s + ((Number(i.weight) || 0) * (i.done ? 1 : 0)), 0)
    const progress = total > 0 ? Math.round((numerator / total) * 100) : Math.round((items.filter(i=>i.done).length / items.length) * 100)
    ;(async () => {
      await updateDoc(doc(db, 'users', uid, 'tasks', taskId), {
        progress,
        done: progress >= 100,
        status: progress >= 100 ? 'done' : undefined,
      } as any)
    })()
  }, [items, taskId])

  const hasSubtasks = items.length > 0

  async function add(e: React.FormEvent) {
    e.preventDefault()
    const uid = auth.currentUser?.uid
    if (!uid) return
    const t = title.trim()
    if (!t) return
    setBusy(true)
    try {
      const payload: any = {
        title: t,
        weight: Number(weight) || 0,
        done: false,
        createdAt: serverTimestamp(),
      }
      await addDoc(collection(db, 'users', uid, 'tasks', taskId, 'subtasks'), payload)
      setTitle('')
      setWeight(50)
    } finally {
      setBusy(false)
    }
  }

  async function toggle(id: string, next: boolean) {
    const uid = auth.currentUser?.uid
    if (!uid) return
    await updateDoc(doc(db, 'users', uid, 'tasks', taskId, 'subtasks', id), { done: next })
  }

  async function setW(id: string, next: number) {
    const uid = auth.currentUser?.uid
    if (!uid) return
    await updateDoc(doc(db, 'users', uid, 'tasks', taskId, 'subtasks', id), { weight: Number(next) || 0 })
  }

  async function remove(id: string) {
    const uid = auth.currentUser?.uid
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid, 'tasks', taskId, 'subtasks', id))
  }

  return hasSubtasks ? (
    <div className="space-y-3">
      <div className="font-medium">Subtasks</div>
      <form onSubmit={add} className="grid gap-2 sm:grid-cols-3 sm:items-end">
        <div>
          <Label>Title</Label>
          <Input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="e.g., Book track" />
        </div>
        <div>
          <Label>Weight</Label>
          <Input type="number" value={weight} onChange={(e)=>setWeight(Number(e.target.value))} />
        </div>
        <div>
          <Button type="submit" disabled={!title.trim() || busy}>Add subtask</Button>
        </div>
      </form>

      <div className="space-y-2">
        {items.map(s => (
          <div key={s.id} className="grid gap-2 sm:grid-cols-5 items-center">
            <div className="sm:col-span-2 flex items-center gap-2">
              <Checkbox checked={!!s.done} onCheckedChange={(v)=>toggle(s.id, !!v)} />
              <span>{s.title}</span>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">Weight</Label>
              <Input type="number" className="w-24" defaultValue={s.weight} onBlur={(e)=>setW(s.id, Number(e.target.value))} />
            </div>
            <div className="text-right sm:col-span-2">
              <Button variant="ghost" size="sm" onClick={()=>remove(s.id)}>Delete</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  ) : (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm text-muted-foreground">Progress</Label>
        <span className="text-sm">{Math.round(manual)}%</span>
      </div>
      <Slider value={[manual]} min={0} max={100} step={1} onValueChange={(v)=>setManual(Math.round(v[0] ?? 0))} onValueCommit={(v)=>onManualProgressCommit(Math.round(v[0] ?? 0))} />
      <div className="text-xs text-muted-foreground">
        Add subtasks to switch this task to <em>automatic</em> progress (weighted by subtask weights).
      </div>

      <form onSubmit={add} className="grid gap-2 sm:grid-cols-3 sm:items-end pt-2">
        <div>
          <Label>Subtask title</Label>
          <Input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="e.g., First step" />
        </div>
        <div>
          <Label>Weight</Label>
          <Input type="number" value={weight} onChange={(e)=>setWeight(Number(e.target.value))} />
        </div>
        <div>
          <Button type="submit" disabled={!title.trim() || busy}>Add subtask</Button>
        </div>
      </form>
    </div>
  )
}
