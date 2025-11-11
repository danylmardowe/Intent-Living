// src/app/(app)/life-areas/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import KPIList from '@/components/life-areas/kpi-list'

type Area = {
  name: string
  vision?: string
  principles?: string[] // bullets
  focus?: number
  journalingCadence?: 'off'|'daily'|'weekly'|'monthly'|'custom'
  parentId?: string | null
}

export default function LifeAreaDetail({ params }: { params: { id: string } }) {
  const [area, setArea] = useState<Area | null>(null)
  const [principlesText, setPrinciplesText] = useState('') // 1 per line
  const [vision, setVision] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    ;(async () => {
      const ref = doc(db, 'users', uid, 'lifeAreas', params.id)
      const snap = await getDoc(ref)
      if (snap.exists()) {
        const a = snap.data() as Area
        setArea(a)
        setVision(a.vision ?? '')
        setPrinciplesText((a.principles ?? []).join('\n'))
      }
    })()
  }, [params.id])

  async function saveMeta() {
    const uid = auth.currentUser?.uid
    if (!uid || !area) return
    setSaving(true)
    try {
      const principles = principlesText
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean)
      await updateDoc(doc(db, 'users', uid, 'lifeAreas', params.id), {
        vision,
        principles,
      })
    } finally {
      setSaving(false)
    }
  }

  if (!area) return <div className="p-6">Loading…</div>

  return (
    <main className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{area.name}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Vision</Label>
            <Textarea value={vision} onChange={(e)=>setVision(e.target.value)} rows={6} />
          </div>
          <div className="space-y-2">
            <Label>Guiding Principles (one per line)</Label>
            <Textarea value={principlesText} onChange={(e)=>setPrinciplesText(e.target.value)} rows={6} />
          </div>
          <div className="sm:col-span-2">
            <Button onClick={saveMeta} disabled={saving}>Save</Button>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <KPIList areaId={params.id} />
    </main>
  )
}
