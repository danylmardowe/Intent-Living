'use client'

import { useEffect } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/auth-context'

export function useEnsureUserDoc() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const ref = doc(db, 'users', user.uid)
      const snap = await getDoc(ref)
      if (!snap.exists()) {
        await setDoc(ref, {
          createdAt: serverTimestamp(),
          email: user.email ?? null,
        })
      }
    })()
  }, [user])
}
