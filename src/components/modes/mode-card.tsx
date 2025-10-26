// src/components/modes/mode-card.tsx
'use client'

import { useMemo, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

export type Mode = {
  id: string
  name: string
  description?: string
  duration?: 'weekly' | 'monthly' | 'custom'
  startAt?: any
  activeLifeAreaIds?: string[]
  mindsets?: string[]
  attitudes?: string[]
  isActive?: boolean
}

type Area = { id: string; name: string }

export default function ModeCard({
  mode,
  lifeAreas,
}: {
  mode: Mode
  lifeAreas: Area[]
}) {
  const [name, setName] = useState(mode.name ?? '')
  const [description, setDescription] = useState(mode.description ?? '')
  const [duration, setDuration] = useState<Mode['duration']>(mode.duration ?? 'weekly')
  const [startDate, setStartDate] = useState<string>(mode.startAt?.toDate?.()?.toISOString?.().slice(0, 10) ?? '')
  const [mindsetsText, setMindsetsText] = useState((mode.mindsets ?? []).join('\n'))
  const [attitudesText, setAttitudesText] = useState((mode.attitudes ?? []).join('\n'))
  const [selectedAreas, setSelectedAreas] = useState<string[]>(mode.activeLifeAreaIds ?? [])

  const areaMap = useMemo(() => new Set(selectedAreas), [selectedAreas])

  function toggleArea(id: string, checked: boolean) {
    setSelectedAreas((prev) => {
      const set = new Set(prev)
      if (checked) set.add(id)
      else set.delete(id)
      return Array.from(set)
    })
  }

  async function save() {
    const uid = auth.currentUser?.uid
    if (!uid) return
    const payload: any = {
      name: name.trim() || 'Untitled Mode',
      duration,
      activeLifeAreaIds: selectedAreas,
      ...(description.trim() && { description: description.trim() }),
      ...(startDate && { startAt: new Date(startDate) }),
      mindsets: mindsetsText
        .split('\n').map((s) => s.trim()).filter(Boolean),
      attitudes: attitudesText
        .split('\n').map((s) => s.trim()).filter(Boolean),
    }
    await updateDoc(doc(db, 'users', uid, 'modes', mode.id), payload)
  }

  async function activate() {
    const uid = auth.currentUser?.uid
    if (!uid) return
    const modesRef = collection(db, 'users', uid, 'modes')

    // make sure only one is active
    const qref = query(modesRef, where('isActive', '==', true), limit(10))
    const snap = await getDocs(qref)

    const batch = writeBatch(db)
    snap.forEach((d) => batch.update(d.ref, { isActive: false }))
    batch.update(doc(db, 'users', uid, 'modes', mode.id), { isActive: true })
    await batch.commit()
  }

  async function remove() {
    const uid = auth.currentUser?.uid
    if (!uid) return
    if (!confirm('Delete this mode?')) return
    await deleteDoc(doc(db, 'users', uid, 'modes', mode.id))
  }

  return (
    <Card className="glass shadow-card animate-slide-up">
      <CardHeader className="flex items-center justify-between gap-4 sm:flex-row">
        <CardTitle className="text-lg flex items-center gap-2">
          {mode.name}
          {mode.isActive && <span className="text-xs rounded-full px-2 py-0.5 bg-brand-gradient text-white">Active</span>}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="soft" onClick={save}>Save</Button>
          {!mode.isActive && <Button variant="gradient" onClick={activate}>Activate</Button>}
          <Button variant="ghost" onClick={remove}>Delete</Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input value={name} onChange={(e)=>setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Duration</Label>
          <Select value={duration} onValueChange={(v)=>setDuration(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Start date</Label>
          <Input type="date" value={startDate} onChange={(e)=>setStartDate(e.target.value)} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label>Description</Label>
          <Textarea rows={3} value={description} onChange={(e)=>setDescription(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>Mindsets (one per line)</Label>
          <Textarea rows={5} value={mindsetsText} onChange={(e)=>setMindsetsText(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Attitudes (one per line)</Label>
          <Textarea rows={5} value={attitudesText} onChange={(e)=>setAttitudesText(e.target.value)} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label>Active Life Areas</Label>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 rounded-md border p-3">
            {lifeAreas.map((a) => {
              const checked = areaMap.has(a.id)
              return (
                <label key={a.id} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={checked} onCheckedChange={(v)=>toggleArea(a.id, !!v)} />
                  {a.name}
                </label>
              )
            })}
            {lifeAreas.length === 0 && <p className="text-sm text-muted-foreground">No life areas yet.</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
