// src/components/objectives/objective-card.tsx
'use client'

import { useMemo, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

export type Objective = {
  id: string
  title: string
  cadence: 'daily' | 'weekly' | 'monthly' | 'sixMonthly'
  lifeAreaId?: string | null
  goalId?: string | null
  status: 'active' | 'paused' | 'retired'
  createdAt?: any
}

type Area = { id: string; name: string }
type Goal = { id: string; title: string }

export default function ObjectiveCard({
  objective,
  areas,
  goals,
}: {
  objective: Objective
  areas: Area[]
  goals: Goal[]
}) {
  const [title, setTitle] = useState(objective.title)
  const [cadence, setCadence] = useState<Objective['cadence']>(objective.cadence)
  const [status, setStatus] = useState<Objective['status']>(objective.status)
  const [lifeAreaId, setLifeAreaId] = useState<string | 'none'>(objective.lifeAreaId ?? 'none')
  const [goalId, setGoalId] = useState<string | 'none'>(objective.goalId ?? 'none')
  const [saving, setSaving] = useState(false)

  const areaMap = useMemo(() => new Map(areas.map(a => [a.id, a.name])), [areas])
  const goalMap = useMemo(() => new Map(goals.map(g => [g.id, g.title])), [goals])

  async function save() {
    const uid = auth.currentUser?.uid
    if (!uid) return
    setSaving(true)
    try {
      const payload: any = {
        title: title.trim() || 'Untitled',
        cadence,
        status,
        lifeAreaId: lifeAreaId === 'none' ? null : lifeAreaId,
        goalId: goalId === 'none' ? null : goalId,
      }
      await updateDoc(doc(db, 'users', uid, 'objectives', objective.id), payload)
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    const uid = auth.currentUser?.uid
    if (!uid) return
    if (!confirm('Delete this objective?')) return
    await deleteDoc(doc(db, 'users', uid, 'objectives', objective.id))
  }

  return (
    <Card className="p-4 glass shadow-card">
      <CardHeader className="p-0">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{objective.title}</CardTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="soft" onClick={save} disabled={saving}>Save</Button>
            <Button size="sm" variant="ghost" onClick={remove}>Delete</Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2 sm:col-span-2">
          <Label>Title</Label>
          <Input value={title} onChange={(e)=>setTitle(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>Cadence</Label>
          <Select value={cadence} onValueChange={(v)=>setCadence(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="sixMonthly">Six-Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v)=>setStatus(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="retired">Retired</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Life Area</Label>
          <Select value={lifeAreaId} onValueChange={(v)=>setLifeAreaId(v as any)}>
            <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {areas.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {lifeAreaId !== 'none' && <p className="text-xs text-muted-foreground">{areaMap.get(lifeAreaId as string)}</p>}
        </div>

        <div className="space-y-2">
          <Label>Goal</Label>
          <Select value={goalId} onValueChange={(v)=>setGoalId(v as any)}>
            <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {goals.map(g => <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>)}
            </SelectContent>
          </Select>
          {goalId !== 'none' && <p className="text-xs text-muted-foreground">{goalMap.get(goalId as string)}</p>}
        </div>
      </CardContent>
    </Card>
  )
}
