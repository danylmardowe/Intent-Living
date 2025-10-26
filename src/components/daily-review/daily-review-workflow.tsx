// src/components/daily-review/daily-review-workflow.tsx
'use client'

import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  where,
  limit,
  getDocs,
} from 'firebase/firestore'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useUserCollection } from '@/lib/useUserCollection'
import { Label } from '@/components/ui/label'
import { useActiveMode } from '@/lib/useActiveMode'

type Entry = { id: string; text: string; createdAt?: any; lifeAreaId?: string; kind?: 'general'|'life-area' }
type Area = { id: string; name: string; journalingCadence?: 'off'|'daily'|'weekly'|'monthly'|'custom' }

export default function DailyReviewWorkflow() {
  // GENERAL JOURNAL (3 prompts)
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const [p3, setP3] = useState('')
  const [savingGeneral, setSavingGeneral] = useState(false)

  async function saveGeneral() {
    const uid = auth.currentUser?.uid
    if (!uid) return
    const toSave = [p1, p2, p3].map(t => t.trim()).filter(Boolean)
    if (toSave.length === 0) return
    setSavingGeneral(true)
    try {
      for (const text of toSave) {
        await addDoc(collection(db, 'users', uid, 'journal'), {
          text,
          kind: 'general',
          createdAt: serverTimestamp(),
        })
      }
      setP1(''); setP2(''); setP3('')
    } finally {
      setSavingGeneral(false)
    }
  }

  // LIFE-AREA JOURNALING (active mode + cadence due)
  const { data: areas } = useUserCollection<Area>('lifeAreas', 'name')
  const activeMode = useActiveMode()
  const [due, setDue] = useState<Array<{area: Area; lastAt?: Date | null; reason: 'active'|'due'}>>([])
  const [laText, setLaText] = useState<Record<string, string>>({})
  const [savingLA, setSavingLA] = useState(false)

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid || areas.length === 0) return
    ;(async () => {
      const now = new Date()
      const list: Array<{area: Area; lastAt?: Date | null; reason: 'active'|'due'}> = []
      const activeIds = new Set(activeMode?.activeLifeAreaIds ?? [])

      // 1) Add ACTIVE areas
      for (const a of areas) {
        if (activeIds.has(a.id)) {
          list.push({ area: a, lastAt: null, reason: 'active' })
        }
      }

      // 2) Add cadence-due areas (avoid duplicates)
      for (const a of areas) {
        const cad = a.journalingCadence ?? 'off'
        if (cad === 'off') continue
        const jref = collection(db, 'users', uid, 'journal')
        const qref = query(jref, where('lifeAreaId', '==', a.id), orderBy('createdAt', 'desc'), limit(1))
        const snap = await getDocs(qref)
        const last = snap.docs[0]?.data()?.createdAt?.toDate?.() as Date | undefined
        const lastAt = last ?? null
        if (isCadenceDue(cad, lastAt, now)) {
          // don't double-add if already active
          if (!activeIds.has(a.id)) list.push({ area: a, lastAt, reason: 'due' })
        }
      }
      setDue(list)
    })()
  }, [areas, activeMode])

  async function saveLifeAreaJournals() {
    const uid = auth.currentUser?.uid
    if (!uid) return
    const pairs = Object.entries(laText)
      .map(([areaId, text]) => ({ areaId, text: text.trim() }))
      .filter(i => i.text.length > 0)
    if (pairs.length === 0) return
    setSavingLA(true)
    try {
      for (const { areaId, text } of pairs) {
        await addDoc(collection(db, 'users', uid, 'journal'), {
          text,
          lifeAreaId: areaId,
          kind: 'life-area',
          createdAt: serverTimestamp(),
        })
      }
      setLaText({})
    } finally {
      setSavingLA(false)
    }
  }

  // RECENT FEED (optional)
  const [recent, setRecent] = useState<Entry[]>([])
  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    const qref = query(collection(db, 'users', uid, 'journal'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(qref, snap => {
      setRecent(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })))
    })
    return () => unsub()
  }, [])

  return (
    <div className="space-y-6">
      {/* General journaling: 3 prompts */}
      <Card>
        <CardHeader><CardTitle>General Journaling</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <LabeledTextarea label="What did you get done today?" value={p1} onChange={setP1} />
          <LabeledTextarea label="How did today go in terms of tasks and goals?" value={p2} onChange={setP2} />
          <LabeledTextarea label="What will you do tomorrow?" value={p3} onChange={setP3} />
          <Button onClick={saveGeneral} disabled={savingGeneral}>Save</Button>
        </CardContent>
      </Card>

      {/* Life-Area journaling (Active + Due) */}
      {due.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Life-Area Journaling</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {due.map(({ area, lastAt, reason }) => (
              <div key={area.id} className="space-y-2">
                <Label>
                  {area.name}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {reason === 'active' ? '(active)' : `(due${lastAt ? `; last ${lastAt.toLocaleDateString()}` : ''})`}
                  </span>
                </Label>
                <Textarea
                  placeholder={`Reflect on ${area.name}…`}
                  value={laText[area.id] ?? ''}
                  onChange={(e) => setLaText(s => ({ ...s, [area.id]: e.target.value }))}
                  rows={3}
                />
              </div>
            ))}
            <Button onClick={saveLifeAreaJournals} disabled={savingLA}>Save life-area entries</Button>
          </CardContent>
        </Card>
      )}

      {/* Recent entries */}
      <Card>
        <CardHeader><CardTitle>Recent entries</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {recent.slice(0, 6).map(e => (
            <div key={e.id} className="text-sm">
              {e.lifeAreaId ? <span className="mr-2 px-2 py-0.5 rounded bg-muted text-muted-foreground">Area</span> : null}
              {e.text}
            </div>
          ))}
          {recent.length === 0 && <p className="text-sm text-muted-foreground">No entries yet.</p>}
        </CardContent>
      </Card>
    </div>
  )
}

function LabeledTextarea({ label, value, onChange }: { label: string; value: string; onChange: (s: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Textarea value={value} onChange={e => onChange(e.target.value)} rows={3} />
    </div>
  )
}

function isCadenceDue(
  cadence: 'off'|'daily'|'weekly'|'monthly'|'custom',
  lastAt: Date | null | undefined,
  now: Date
) {
  if (cadence === 'off') return false
  if (!lastAt) return true
  const days = (now.getTime() - lastAt.getTime()) / (1000*60*60*24)
  if (cadence === 'daily') return days >= 1
  if (cadence === 'weekly') return days >= 7
  if (cadence === 'monthly') return days >= 28
  return false // custom ignored for MVP
}
