// src/app/(app)/modes/page.tsx
'use client'

import { useMemo, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { useUserCollection } from '@/lib/useUserCollection'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import ModeCard, { Mode } from '@/components/modes/mode-card'

type Area = { id: string; name: string }

export default function ModesPage() {
  const { data: modes, loading } = useUserCollection<Mode>('modes', 'name')
  const { data: lifeAreas } = useUserCollection<Area>('lifeAreas', 'name')

  // Create form
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  async function createMode(e: React.FormEvent) {
    e.preventDefault()
    const uid = auth.currentUser?.uid
    if (!uid) return
    const n = name.trim()
    const d = description.trim()
    if (!n) return

    const payload: any = {
      name: n,
      isActive: modes.length === 0, // first mode becomes active
      activeLifeAreaIds: [],
      mindsets: [],
      attitudes: [],
      createdAt: serverTimestamp(),
      ...(d && { description: d }),
    }
    await addDoc(collection(db, 'users', uid, 'modes'), payload)
    setName(''); setDescription('')
  }

  const activeId = useMemo(() => modes.find(m => m.isActive)?.id, [modes])

  return (
    <main className="space-y-6">
      <Card className="glass shadow-card">
        <CardHeader>
          <CardTitle>Create Mode</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createMode} className="grid gap-4 sm:grid-cols-2 sm:items-end">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input placeholder="e.g., Deep Work" value={name} onChange={(e)=>setName(e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Description (optional)</Label>
              <Textarea rows={3} value={description} onChange={(e)=>setDescription(e.target.value)} />
            </div>
            <div>
              <Button type="submit" variant="gradient" disabled={!name.trim()}>Add Mode</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <div className="p-4">Loading…</div>
      ) : modes.length === 0 ? (
        <Card className="p-6 glass shadow-card">
          <p className="text-muted-foreground">No modes yet. Create your first mode above.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {modes.map((m) => (
            <ModeCard key={m.id} mode={m} lifeAreas={lifeAreas} />
          ))}
        </div>
      )}

      {activeId && (
        <p className="text-sm text-muted-foreground">
          Active mode ID: <span className="font-mono">{activeId}</span>
        </p>
      )}
    </main>
  )
}
