'use client'

import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where, addDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/auth-context'
import type { Activity } from '@/lib/types'

export function useActivities() {
  const { user } = useAuth()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const q = query(
      collection(db, 'users', user.uid, 'activities'),
      where('startTime', '>=', Timestamp.fromDate(todayStart))
    )
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        startTime: d.data().startTime?.toDate?.() ?? new Date(),
        endTime: d.data().endTime?.toDate?.() ?? null,
        createdAt: d.data().createdAt?.toDate?.() ?? new Date(),
      })) as Activity[]
      setActivities(data)
      setLoading(false)
    })
    return () => unsub()
  }, [user])

  async function addActivity(partial: Omit<Activity, 'id' | 'createdAt'>) {
    if (!user) return
    await addDoc(collection(db, 'users', user.uid, 'activities'), {
      ...partial,
      createdAt: new Date(),
    })
  }

  return { activities, loading, addActivity }
}
