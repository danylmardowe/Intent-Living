// src/app/(app)/reviews/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import Link from 'next/link'

type Report = { id: string; dayId: string; downloadURL?: string; createdAt?: any }

export default function ReviewsIndexPage() {
  const [daily, setDaily] = useState<Report[]>([])
  const [weekly, setWeekly] = useState<Report[]>([])
  const [monthly, setMonthly] = useState<Report[]>([])
  const [six, setSix] = useState<Report[]>([])

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return

    const wire = (cadence: string, set: (x: Report[]) => void) => {
      const qref = query(collection(db, 'users', uid, 'reviews', cadence), orderBy('dayId', 'desc'))
      return onSnapshot(qref, (snap) => set(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))))
    }

    const u1 = wire('daily', setDaily)
    const u2 = wire('weekly', setWeekly)
    const u3 = wire('monthly', setMonthly)
    const u4 = wire('sixMonthly', setSix)
    return () => { u1?.(); u2?.(); u3?.(); u4?.() }
  }, [])

  return (
    <main className="space-y-6">
      <Section title="Daily" items={daily} />
      <Section title="Weekly" items={weekly} />
      <Section title="Monthly" items={monthly} />
      <Section title="Six-Monthly" items={six} />
    </main>
  )
}

function Section({ title, items }: { title: string; items: Report[] }) {
  return (
    <Card className="glass shadow-card">
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {items.slice(0, 20).map(r => (
          <div key={r.id} className="flex items-center justify-between">
            <span className="text-sm">{r.dayId}</span>
            {r.downloadURL
              ? <a className="text-sm underline" href={r.downloadURL} target="_blank">Open PDF</a>
              : <span className="text-xs text-muted-foreground">Generating…</span>}
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground">No reports yet.</p>}
      </CardContent>
    </Card>
  )
}
