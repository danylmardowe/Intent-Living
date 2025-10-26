// src/app/(app)/life-areas/page.tsx
'use client'

import { useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { useUserCollection } from '@/lib/useUserCollection'
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'

type Area = { id: string; name: string; score: number; createdAt?: any }

export default function LifeAreasPage() {
  const { data: areas, loading } = useUserCollection<Area>('lifeAreas', 'name')

  const [name, setName] = useState('')
  const [score, setScore] = useState<number>(50)
  const [busy, setBusy] = useState(false)

  async function addArea(e: React.FormEvent) {
    e.preventDefault()
    const uid = auth.currentUser?.uid
    if (!uid) return
    const trimmed = name.trim()
    if (!trimmed) return
    setBusy(true)
    try {
      await addDoc(collection(db, 'users', uid, 'lifeAreas'), {
        name: trimmed,
        score: clamp(score, 0, 100),
        createdAt: serverTimestamp(),
      })
      setName('')
      setScore(50)
    } finally {
      setBusy(false)
    }
  }

  async function updateAreaScore(id: string, next: number) {
    const uid = auth.currentUser?.uid
    if (!uid) return
    await updateDoc(doc(db, 'users', uid, 'lifeAreas', id), {
      score: clamp(next, 0, 100),
    })
  }

  async function renameArea(id: string, nextName: string) {
    const uid = auth.currentUser?.uid
    if (!uid) return
    const trimmed = nextName.trim()
    if (!trimmed) return
    await updateDoc(doc(db, 'users', uid, 'lifeAreas', id), { name: trimmed })
  }

  async function removeArea(id: string) {
    const uid = auth.currentUser?.uid
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid, 'lifeAreas', id))
  }

  return (
    <main className="space-y-6">
      {/* Create */}
      <Card>
        <CardHeader>
          <CardTitle>Add Life Area</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addArea} className="grid gap-4 sm:grid-cols-2 sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g., Health"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Score: {Math.round(score)}%</Label>
              <Slider
                value={[score]}
                min={0}
                max={100}
                step={1}
                onValueChange={(v) => setScore(v[0] ?? 0)}
              />
            </div>

            <div>
              <Button type="submit" disabled={busy || !name.trim()}>
                Add
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* List */}
      {loading ? (
        <div className="p-4">Loading…</div>
      ) : areas.length === 0 ? (
        <Card className="p-6">
          <p className="text-muted-foreground">No life areas yet. Add your first one above.</p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((a) => (
            <Card key={a.id} className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <EditableName
                  value={a.name}
                  onSubmit={(n) => renameArea(a.id, n)}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeArea(a.id)}
                  title="Delete"
                >
                  Delete
                </Button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Score</span>
                  <span className="text-sm">{Math.round(a.score ?? 0)}%</span>
                </div>
                <Progress value={clamp(a.score ?? 0, 0, 100)} className="h-2" />
                <Slider
                  value={[clamp(a.score ?? 0, 0, 100)]}
                  min={0}
                  max={100}
                  step={1}
                  onValueCommit={(v) => updateAreaScore(a.id, v[0] ?? 0)}
                />
              </div>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

function EditableName({
  value,
  onSubmit,
}: {
  value: string
  onSubmit: (next: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value)

  function save() {
    if (val.trim() && val.trim() !== value) onSubmit(val)
    setEditing(false)
  }

  return editing ? (
    <div className="flex items-center gap-2">
      <Input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => (e.key === 'Enter' ? save() : undefined)}
        autoFocus
        className="h-8 w-48"
      />
      <Button size="sm" onClick={save}>
        Save
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
        Cancel
      </Button>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <CardTitle className="text-base">{value}</CardTitle>
      <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
        Rename
      </Button>
    </div>
  )
}
