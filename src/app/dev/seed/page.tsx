'use client'

import { auth, db } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import { collection, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function SeedPage() {
  const router = useRouter()

  async function seed() {
    const uid = auth.currentUser?.uid
    if (!uid) {
      router.replace('/sign-in?next=/dev/seed')
      return
    }

    await setDoc(doc(db, 'users', uid), { seededAt: serverTimestamp(), email: auth.currentUser?.email ?? null }, { merge: true })

    const tasks = [
      { title: 'Plan weekly review', done: false, status: 'todo', urgent: true,  important: true },
      { title: 'Deep work session',  done: false, status: 'in_progress', urgent: false, important: true },
      { title: 'Email cleanup',      done: true,  status: 'done', urgent: true,  important: false },
      { title: 'Unsubscribe spam',   done: false, status: 'todo', urgent: false, important: false },
    ]
    for (const t of tasks) await addDoc(collection(db, 'users', uid, 'tasks'), { ...t, createdAt: serverTimestamp() })

    const g1 = await addDoc(collection(db, 'users', uid, 'goals'), { title: 'Get fitter', progress: 35 })
    await addDoc(collection(db, 'users', uid, 'goals'), { title: 'Run 5k',        parentId: g1.id, progress: 20 })
    await addDoc(collection(db, 'users', uid, 'goals'), { title: 'Gym 3x/week',   parentId: g1.id, progress: 50 })

    const objectives = [
      { title: 'Complete Q4 planning', description: 'Outline key outcomes for Q4' },
      { title: 'Refresh portfolio',    description: 'Update case studies and visuals' },
    ]
    for (const o of objectives) await addDoc(collection(db, 'users', uid, 'objectives'), { ...o, createdAt: serverTimestamp() })

    const lifeAreas = [
      { name: 'Health',        score: 68 },
      { name: 'Career',        score: 72 },
      { name: 'Relationships', score: 80 },
      { name: 'Finance',       score: 55 },
      { name: 'Learning',      score: 64 },
      { name: 'Fun',           score: 45 },
    ]
    for (const a of lifeAreas) await addDoc(collection(db, 'users', uid, 'lifeAreas'), a)

    const modes = [
      { name: 'Focus',   description: 'Minimize distractions for deep work', enabled: true },
      { name: 'Recharge',description: 'Slow down and recover',               enabled: false },
      { name: 'Admin',   description: 'Email, errands, logistics',           enabled: false },
    ]
    for (const m of modes) await addDoc(collection(db, 'users', uid, 'modes'), m)

    await addDoc(collection(db, 'users', uid, 'journal'), {
      text: 'First daily review entry — looks great!',
      createdAt: serverTimestamp(),
    })

    alert('Seeded! Visit /dashboard, /tasks, /goals, etc.')
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <Card>
        <CardHeader><CardTitle>Seed Demo Data</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Adds sample data to <strong>your</strong> account so the UI looks like it used to (no mock-data).
          </p>
          <Button onClick={seed}>Seed my account</Button>
        </CardContent>
      </Card>
    </main>
  )
}
