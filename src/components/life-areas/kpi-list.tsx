// src/components/life-areas/kpi-list.tsx
'use client'

import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import {
  collection, addDoc, onSnapshot, orderBy, query,
  doc, updateDoc, deleteDoc, serverTimestamp
} from 'firebase/firestore'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type KPI = { id: string; name: string; unit?: string; value?: number; target?: number; updatedAt?: any }

export default function KPIList({ areaId }: { areaId: string }) {
  const [items, setItems] = useState<KPI[]>([])
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('')
  const [target, setTarget] = useState<number | ''>('')

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    const qref = query(collection(db, 'users', uid, 'lifeAreas', areaId, 'kpis'), orderBy('updatedAt'))
    const unsub = onSnapshot(qref, (snap) => {
      setItems(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })))
    })
    return () => unsub()
  }, [areaId])

  async function addKpi(e: React.FormEvent) {
    e.preventDefault()
    const uid = auth.currentUser?.uid
    if (!uid || !name.trim()) return
    const payload: any = {
      name: name.trim(),
      value: 0,
      updatedAt: serverTimestamp(),
    }
    const u = unit.trim()
    if (u) payload.unit = u
    if (target !== '' && !Number.isNaN(Number(target))) payload.target = Number(target)
    await addDoc(collection(db, 'users', uid, 'lifeAreas', areaId, 'kpis'), payload)
    setName(''); setUnit(''); setTarget('')
  }

  async function setValue(id: string, value: number) {
    const uid = auth.currentUser?.uid
    if (!uid) return
    await updateDoc(doc(db, 'users', uid, 'lifeAreas', areaId, 'kpis', id), {
      value: Number(value),
      updatedAt: serverTimestamp(),
    })
  }

  async function setTargetValue(id: string, next: number) {
    const uid = auth.currentUser?.uid
    if (!uid) return
    await updateDoc(doc(db, 'users', uid, 'lifeAreas', areaId, 'kpis', id), {
      target: Number(next),
      updatedAt: serverTimestamp(),
    })
  }

  async function remove(id: string) {
    const uid = auth.currentUser?.uid
    if (!uid) return
    await deleteDoc(doc(db, 'users', uid, 'lifeAreas', areaId, 'kpis', id))
  }

  return (
    <Card>
      <CardHeader><CardTitle>KPIs</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={addKpi} className="grid gap-3 sm:grid-cols-3 sm:items-end">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e)=>setName(e.target.value)} placeholder="e.g., Weekly workouts" />
          </div>
          <div>
            <Label>Unit (optional)</Label>
            <Input value={unit} onChange={(e)=>setUnit(e.target.value)} placeholder="e.g., sessions/week" />
          </div>
          <div>
            <Label>Target (optional)</Label>
            <Input type="number" value={target} onChange={(e)=>setTarget(e.target.value === '' ? '' : Number(e.target.value))} />
          </div>
          <div className="sm:col-span-3">
            <Button type="submit" disabled={!name.trim()}>Add KPI</Button>
          </div>
        </form>

        <div className="space-y-2">
          {items.map(k => (
            <div key={k.id} className="grid gap-2 sm:grid-cols-5 items-center">
              <div className="sm:col-span-2 font-medium">{k.name}</div>
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Value</Label>
                <Input type="number" className="w-28" defaultValue={k.value ?? 0} onBlur={(e)=>setValue(k.id, Number(e.target.value))} />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Target</Label>
                <Input type="number" className="w-28" defaultValue={k.target ?? ''} onBlur={(e)=>setTargetValue(k.id, Number(e.target.value))} />
              </div>
              <div className="text-right">
                <Button variant="ghost" size="sm" onClick={()=>remove(k.id)}>Delete</Button>
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="text-sm text-muted-foreground">No KPIs yet.</p>}
        </div>
      </CardContent>
    </Card>
  )
}
