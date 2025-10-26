// src/lib/useUserCollection.ts
'use client'

import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/auth-context'

export function useUserCollection<T = any>(subpath: string, sortBy?: string) {
  const { user } = useAuth()
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const ref = collection(db, 'users', user.uid, subpath)
    const q = sortBy ? query(ref, orderBy(sortBy)) : ref
    const unsub = onSnapshot(q, (snap) => {
      setData(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
      setLoading(false)
    })
    return () => unsub()
  }, [user, subpath, sortBy])

  return { data, loading }
}
