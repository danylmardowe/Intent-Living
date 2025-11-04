// src/app/(app)/life-areas/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { useActiveMode } from '@/lib/useActiveMode'

type Area = {
  id: string
  name: string
  focus?: number
  // parentId is deprecated/ignored now, kept only so older docs still type-check
  parentId?: string | null
  journalingCadence?: 'off' | 'daily' | 'weekly' | 'monthly' | 'custom'
  createdAt?: any
}

export default function LifeAreasPage() {
  const { data: areas, loading } = useUserCollection<Area>('lifeAreas', 'name')
  const activeMode = useActiveMode()
  const activeIds = new Set(activeMode?.activeLifeAreaIds ?? [])

  // Create form state (Parent removed)
  const [name, setName] = useState('')
  const [focus, setFocus] = useState<number>(50)
  const [cadence, setCadence] = useState<Area['journalingCadence']>('off')
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
        focus: clamp(focus, 0, 100),
        journalingCadence: cadence ?? 'off',
        createdAt: serverTimestamp(),
      })
      setName('')
      setFocus(50)
      setCadence('off')
    } finally {
      setBusy(false)
    }
  }

  async function updateAreaFocus(id: string, next: number) {
    const uid = auth.currentUser?.uid
    if (!uid) return
    await updateDoc(doc(db, 'users', uid, 'lifeAreas', id), {
      focus: clamp(next, 0, 100),
    })
  }

  async function renameArea(id: string, nextName: string) {
    const uid = auth.currentUser?.uid
    if (!uid) return
    const trimmed = nextName.trim()
    if (!trimmed) return
    await updateDoc(doc(db, 'users', uid, 'lifeAreas', id), { name: trimmed })
  }

  async function setAreaCadence(id: string, c: Area['journalingCadence']) {
    const uid = auth.currentUser?.uid
    if (!uid) return
    await updateDoc(doc(db, 'users', uid, 'lifeAreas', id), { journalingCadence: c ?? 'off' })
  }

  async function removeArea(id: string) {
    const uid = auth.currentUser?.uid
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid, 'lifeAreas', id))
  }

  return (
    <main className="space-y-6">
      {/* Create (Parent field removed) */}
      <Card>
        <CardHeader>
          <CardTitle>Add Life Area</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={addArea}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:items-end"
          >
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
              <Label>Focus: {Math.round(focus)}%</Label>
              <div className="flex items-center gap-3">
                <Slider
                  value={[focus]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(v) => setFocus(v[0] ?? 0)}
                />
                <Input
                  type="number"
                  className="w-20"
                  value={Math.round(focus)}
                  min={0}
                  max={100}
                  onChange={(e) => setFocus(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Journaling cadence</Label>
              <Select value={cadence} onValueChange={(v) => setCadence(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="off">Off</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="custom">Custom (future)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Button type="submit" disabled={busy || !name.trim()}>
                Add
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* List (Parent controls removed) */}
      {loading ? (
        <div className="p-4">Loading…</div>
      ) : areas.length === 0 ? (
        <Card className="p-6">
          <p className="text-muted-foreground">
            No life areas yet. Add your first one above.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((a) => (
            <Card key={a.id} className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">{a.name}</CardTitle>
                  {activeIds.has(a.id) && (
                    <span className="text-xs rounded-full px-2 py-0.5 bg-brand-gradient text-white">
                      Active
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/life-areas/${a.id}`}>Open</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeArea(a.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              {/* Focus */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Focus</span>
                  <span className="text-sm">{Math.round(a.focus ?? 0)}%</span>
                </div>
                <Progress value={clamp(a.focus ?? 0, 0, 100)} className="h-2" />
                <Slider
                  value={[clamp(a.focus ?? 0, 0, 100)]}
                  min={0}
                  max={100}
                  step={1}
                  onValueCommit={(v) => updateAreaFocus(a.id, v[0] ?? 0)}
                />
              </div>

              {/* Cadence */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Journaling cadence</Label>
                <Select
                  value={a.journalingCadence ?? 'off'}
                  onValueChange={(v) => setAreaCadence(a.id, v as any)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="off">Off</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="custom" disabled>Custom (soon)</SelectItem>
                  </SelectContent>
                </Select>
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
