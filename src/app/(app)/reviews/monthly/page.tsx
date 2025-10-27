// src/app/(app)/reviews/monthly/page.tsx
'use client'

import { useRef, useState } from 'react'
import ObjectiveRevision from '@/components/reviews/objective-revision'
import { submitReviewAndPdf } from '@/components/reviews/review-submit'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export default function MonthlyReviewPage() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ downloadURL?: string } | null>(null)

  async function submit() {
    if (!rootRef.current) return
    setSaving(true)
    try {
      const payload = { notes: notes.trim() || null }
      const res = await submitReviewAndPdf({
        cadence: 'monthly',
        data: payload,
        captureEl: rootRef.current,
      })
      setResult({ downloadURL: res.downloadURL })
      setNotes('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main ref={rootRef} className="space-y-6">
      <ObjectiveRevision cadencesToReview={['weekly','daily']} title="Review Weekly & Daily Objectives" />

      <Card className="glass shadow-card">
        <CardHeader><CardTitle>Monthly Strategy</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Label>High-level plans and adjustments for the month</Label>
          <Textarea rows={8} value={notes} onChange={(e)=>setNotes(e.target.value)} />
          <Button variant="gradient" onClick={submit} disabled={saving}>Submit Monthly Review & Generate PDF</Button>
          {result?.downloadURL && (
            <p className="text-sm mt-2">
              PDF: <a className="underline" href={result.downloadURL} target="_blank">Open</a>
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
