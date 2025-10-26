'use client'

import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import {
  collection, addDoc, onSnapshot, query, orderBy,
  serverTimestamp, updateDoc, doc, deleteDoc
} from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'

export default function FirestoreTestPage() {
  const router = useRouter()
  const [uid, setUid] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [tasks, setTasks] = useState<Array<{id:string; title:string; done:boolean}>>([])

  // Ensure user is signed in, otherwise send to /sign-in
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(user => {
      if (!user) router.replace('/sign-in?next=/firestore-test')
      else setUid(user.uid)
      setLoading(false)
    })
    return () => unsub()
  }, [router])

  // Live subscribe to this user's tasks
  useEffect(() => {
    if (!uid) return
    const q = query(collection(db, 'users', uid, 'tasks'), orderBy('createdAt'))
    const unsub = onSnapshot(q, snap => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })))
    })
    return () => unsub()
  }, [uid])

  async function addTask() {
    if (!uid || !title.trim()) return
    await addDoc(collection(db, 'users', uid, 'tasks'), {
      title: title.trim(),
      done: false,
      createdAt: serverTimestamp(),
    })
    setTitle('')
  }

  async function toggle(id: string, done: boolean) {
    if (!uid) return
    await updateDoc(doc(db, 'users', uid, 'tasks', id), { done: !done })
  }

  async function remove(id: string) {
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid, 'tasks', id))
  }

  if (loading) return <div className="p-6">Loading…</div>
  if (!uid) return null

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-6">
      <Card>
        <CardHeader><CardTitle>Your Tasks (private)</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="New task..." />
            <Button onClick={addTask}>Add</Button>
          </div>
          <ul className="mt-4 space-y-2">
            {tasks.map(t => (
              <li key={t.id} className="flex items-center gap-2">
                <Checkbox checked={!!t.done} onCheckedChange={() => toggle(t.id, !!t.done)} />
                <span className={t.done ? 'line-through text-muted-foreground' : ''}>{t.title}</span>
                <Button variant="ghost" size="sm" onClick={() => remove(t.id)}>Delete</Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </main>
  )
}
