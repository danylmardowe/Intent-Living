// src/app/(app)/reviews/daily/page.tsx
'use client'

import { useRef, useState } from 'react'
import DailyReviewWorkflow from '@/components/daily-review/daily-review-workflow'
import { submitReviewAndPdf } from '@/components/reviews/review-submit'
import { Button } from '@/components/ui/button'

export default function DailyPage() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)
  const [url, setUrl] = useState<string | null>(null)

  async function submitPdf() {
    if (!rootRef.current) return
    setSaving(true)
    try {
      const payload = { submitted: true }
      const res = await submitReviewAndPdf({
        cadence: 'daily',
        data: payload,
        captureEl: rootRef.current,
      })
      setUrl(res.downloadURL)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4" ref={rootRef}>
      <DailyReviewWorkflow />
      <div className="pt-2">
        <Button variant="gradient" onClick={submitPdf} disabled={saving}>
          Save Daily Review PDF
        </Button>
        {url && (
          <p className="text-sm mt-2">
            PDF: <a className="underline" href={url} target="_blank">Open</a>
          </p>
        )}
      </div>
    </div>
  )
}
