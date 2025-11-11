// src/components/daily-review/general-journaling-card.tsx
'use client'

import * as React from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import GeneralJournalingModal from './general-journaling-modal'
import type { GenerateResponse } from '@/lib/ai-extraction-types'

type Props = {
  onExtractComplete?: (result: GenerateResponse, entryId: string | null) => void
}

export default function GeneralJournalingCard({ onExtractComplete }: Props) {
  const { user } = useAuth()
  const params = useParams()

  const dateId = React.useMemo(() => {
    const raw = Array.isArray(params?.dateId) ? params?.dateId[0] : (params?.dateId as string | undefined)
    return raw ?? new Date().toISOString().slice(0, 10)
  }, [params?.dateId])

  const storageKey = React.useMemo(() => `gj_open_${dateId}`, [dateId])
  const [open, setOpen] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    try { return window.sessionStorage.getItem(storageKey) === '1' } catch { return false }
  })

  const handleOpenChange = React.useCallback((v: boolean) => {
    setOpen(v)
    if (typeof window !== 'undefined') {
      try { v ? sessionStorage.setItem(storageKey, '1') : sessionStorage.removeItem(storageKey) } catch {}
    }
  }, [storageKey])

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>General Journaling</CardTitle>
          <CardDescription>We’ll save your prompt and answer for this date.</CardDescription>
        </CardHeader>
        <CardContent />
        <CardFooter>
          <Button onClick={() => handleOpenChange(true)} disabled={!user?.uid}>Write now</Button>
        </CardFooter>
      </Card>

      <GeneralJournalingModal
        open={open}
        onOpenChange={handleOpenChange}
        dateId={dateId}
        onExtractComplete={onExtractComplete}
      />
    </>
  )
}
