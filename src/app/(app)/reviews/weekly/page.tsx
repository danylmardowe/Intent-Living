// src/app/(app)/reviews/weekly/page.tsx
'use client'

import { useRef, useState } from 'react'
import ObjectiveRevision from '@/components/reviews/objective-revision'
import { submitReviewAndPdf } from '@/components/reviews/review-submit'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export default function WeeklyReviewPage() {
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
        cadence: 'weekly',
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
      <ObjectiveRevision cadencesToReview={['daily']} title="Review Daily Objectives" />

      <Card className="glass shadow-card">
        <CardHeader><CardTitle>Weekly Strategy</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Label>What tactical changes will you make this week?</Label>
          <Textarea rows={6} value={notes} onChange={(e)=>setNotes(e.target.value)} />
          <Button variant="gradient" onClick={submit} disabled={saving}>Submit Weekly Review & Generate PDF</Button>
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
