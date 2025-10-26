'use client'

import { doc, updateDoc } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'

export type Task = {
  id: string
  title: string
  description?: string
  done: boolean
  status?: 'todo' | 'in_progress' | 'done'
  urgent?: boolean
  important?: boolean
}

export default function TaskCard({ task }: { task: Task }) {
  async function toggleDone() {
    const uid = auth.currentUser?.uid
    if (!uid) return
    await updateDoc(doc(db, 'users', uid, 'tasks', task.id), { done: !task.done })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Checkbox checked={task.done} onCheckedChange={toggleDone} />
          <CardTitle className={task.done ? 'line-through text-muted-foreground' : ''}>
            {task.title}
          </CardTitle>
        </div>
        {/* example action */}
        <Button variant="ghost" size="sm">⋯</Button>
      </CardHeader>
      {task.description ? <CardContent>{task.description}</CardContent> : null}
    </Card>
  )
}
