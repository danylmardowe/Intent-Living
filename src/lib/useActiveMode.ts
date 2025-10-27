// src/lib/useActiveMode.ts
'use client'

import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import {
  collection,
  onSnapshot,
  query,
  where,
  limit,
} from 'firebase/firestore'

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

export function useActiveMode() {
  const [mode, setMode] = useState<Mode | null>(null)

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return

    const qref = query(
      collection(db, 'users', uid, 'modes'),
      where('isActive', '==', true),
      limit(1)
    )

    const unsub = onSnapshot(qref, (snap) => {
      const doc = snap.docs[0]
      setMode(doc ? ({ id: doc.id, ...(doc.data() as any) }) : null)
    })
    return () => unsub()
  }, [])

  return mode
}
