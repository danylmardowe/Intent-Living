// src/app/(app)/objectives/page.tsx
'use client'

import { useMemo, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { useUserCollection } from '@/lib/useUserCollection'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import ObjectiveCard, { Objective } from '@/components/objectives/objective-card'

type Area = { id: string; name: string }
type Goal = { id: string; title: string }

const CADENCES: Objective['cadence'][] = ['daily', 'weekly', 'monthly', 'sixMonthly']

export default function ObjectivesPage() {
  const { data: objectives, loading } = useUserCollection<Objective>('objectives', 'title')
  const { data: areas } = useUserCollection<Area>('lifeAreas', 'name')
  const { data: goals } = useUserCollection<Goal>('goals', 'title')

  // Create
  const [title, setTitle] = useState('')
  const [cadence, setCadence] = useState<Objective['cadence']>('daily')
  const [lifeAreaId, setLifeAreaId] = useState<string | 'none'>('none')
  const [goalId, setGoalId] = useState<string | 'none'>('none')
  const [busy, setBusy] = useState(false)

  async function createObjective(e: React.FormEvent) {
    e.preventDefault()
    const uid = auth.currentUser?.uid
    if (!uid) return
    const t = title.trim()
    if (!t) return
    setBusy(true)
    try {
      const payload: any = {
        title: t,
        cadence,
        status: 'active',
        createdAt: serverTimestamp(),
        ...(lifeAreaId !== 'none' && { lifeAreaId }),
        ...(goalId !== 'none' && { goalId }),
      }
      await addDoc(collection(db, 'users', uid, 'objectives'), payload)
      setTitle(''); setCadence('daily'); setLifeAreaId('none'); setGoalId('none')
    } finally {
      setBusy(false)
    }
  }

  // Filters
  const [filterCadence, setFilterCadence] = useState<'all' | Objective['cadence']>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | Objective['status']>('all')
  const [filterArea, setFilterArea] = useState<'all' | string>('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return objectives.filter(o => {
      if (filterCadence !== 'all' && o.cadence !== filterCadence) return false
      if (filterStatus !== 'all' && o.status !== filterStatus) return false
      if (filterArea !== 'all' && (o.lifeAreaId ?? 'none') !== filterArea) return false
      if (q && !o.title.toLowerCase().includes(q)) return false
      return true
    })
  }, [objectives, filterCadence, filterStatus, filterArea, search])

  const byCadence = useMemo(() => {
    const groups: Record<Objective['cadence'], Objective[]> = {
      daily: [], weekly: [], monthly: [], sixMonthly: [],
    }
    filtered.forEach(o => groups[o.cadence].push(o))
    return groups
  }, [filtered])

  return (
    <main className="space-y-6">
      {/* Create */}
      <Card className="glass shadow-card">
        <CardHeader><CardTitle>Create Objective</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={createObjective} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:items-end">
            <div className="space-y-2 sm:col-span-2">
              <Label>Title</Label>
              <Input placeholder="e.g., Move my body daily" value={title} onChange={(e)=>setTitle(e.target.value)} />
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
              <Label>Life Area (optional)</Label>
              <Select value={lifeAreaId} onValueChange={(v)=>setLifeAreaId(v as any)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {areas.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Goal (optional)</Label>
              <Select value={goalId} onValueChange={(v)=>setGoalId(v as any)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {goals.map(g => <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Button type="submit" variant="gradient" disabled={!title.trim() || busy}>Add</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="glass shadow-card">
        <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 sm:items-end">
          <div className="space-y-2">
            <Label>Cadence</Label>
            <Select value={filterCadence} onValueChange={(v)=>setFilterCadence(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="sixMonthly">Six-Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={filterStatus} onValueChange={(v)=>setFilterStatus(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Life Area</Label>
            <Select value={filterArea} onValueChange={(v)=>setFilterArea(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {areas.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Search</Label>
            <Input placeholder="Search title…" value={search} onChange={(e)=>setSearch(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Grouped list */}
      {loading ? (
        <div className="p-4">Loading…</div>
      ) : (
        CADENCES.map(cad => (
          <div key={cad} className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground capitalize">{cad}</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {byCadence[cad].map(o => (
                <ObjectiveCard key={o.id} objective={o} areas={areas} goals={goals} />
              ))}
              {byCadence[cad].length === 0 && (
                <Card className="p-6 glass"><p className="text-muted-foreground text-sm">No objectives.</p></Card>
              )}
            </div>
          </div>
        ))
      )}
    </main>
  )
}
