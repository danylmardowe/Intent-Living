// src/components/tasks/subtasks.tsx
'use client'

import { useEffect, useState } from 'react'
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
import { Subtask } from '@/lib/types'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Trash2Icon } from 'lucide-react'

export default function Subtasks({
  taskId,
  currentProgress,
}: {
  taskId: string
  currentProgress: number
}) {
  const [items, setItems] = useState<Subtask[]>([])
  const [title, setTitle] = useState('')
  const [weight, setWeight] = useState<number>(50)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    const qref = query(collection(db, 'users', uid, 'tasks', taskId, 'subtasks'), orderBy('createdAt'))
    const unsub = onSnapshot(qref, (snap) => {
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() } as Subtask))
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
    const numerator = items.reduce((s, i) => s + (i.done ? (Number(i.weight) || 0) : 0), 0)
    const progress = total > 0 ? Math.round((numerator / total) * 100) : 0

    updateDoc(doc(db, 'users', uid, 'tasks', taskId), {
      progress,
      done: progress >= 100,
      status: progress >= 100 ? 'done' : 'in_progress',
    })
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
      await addDoc(collection(db, 'users', uid, 'tasks', taskId, 'subtasks'), {
        title: t,
        weight: Number(weight) || 50,
        done: false,
        createdAt: serverTimestamp(),
      })
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

  async function remove(id: string) {
    const uid = auth.currentUser?.uid
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid, 'tasks', taskId, 'subtasks', id))
  }

  return (
    <div className="space-y-4">
      <h4 className="font-semibold">Subtasks</h4>
      
      {hasSubtasks && (
        <div className="space-y-2">
          {items.map(s => (
            <div key={s.id} className="flex items-center gap-2 rounded-md bg-muted/50 p-2">
              <Checkbox checked={!!s.done} onCheckedChange={(v) => toggle(s.id, !!v)} />
              <span className={`flex-grow ${s.done ? 'text-muted-foreground line-through' : ''}`}>{s.title}</span>
              <span className="text-xs text-muted-foreground"> (Weight: {s.weight})</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => remove(s.id)}>
                <Trash2Icon className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={add} className="grid grid-cols-1 gap-2 rounded-lg border p-3 sm:grid-cols-3 sm:items-end">
        <div className="sm:col-span-2">
          <Label htmlFor={`new-subtask-${taskId}`} className="text-xs">New Subtask Title</Label>
          <Input 
            id={`new-subtask-${taskId}`} 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="e.g., Book track" 
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`new-weight-${taskId}`} className="text-xs">Weight</Label>
          <Input 
            id={`new-weight-${taskId}`} 
            type="number" 
            value={weight} 
            onChange={(e) => setWeight(Number(e.target.value))} 
          />
        </div>
        <div className="sm:col-span-3">
          <Button type="submit" size="sm" className="w-full" disabled={!title.trim() || busy}>
            Add Subtask
          </Button>
        </div>
      </form>
    </div>
  )
}