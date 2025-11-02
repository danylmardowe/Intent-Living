'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  where,
  doc,
  setDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/auth-context'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type LifeArea = { id: string; name: string }
type ActivityType = { id: string; title: string; defaultLifeAreaId?: string | null }

export default function ActivitiesBankPage() {
  const { user } = useAuth()
  const [lifeAreas, setLifeAreas] = useState<LifeArea[]>([])
  const [types, setTypes] = useState<ActivityType[]>([])
  const [newTitle, setNewTitle] = useState('')

  useEffect(() => {
    if (!user) return
    const unsubAreas = onSnapshot(collection(db, 'users', user.uid, 'lifeAreas'), (snap) => {
      setLifeAreas(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as LifeArea[])
    })
    const unsubTypes = onSnapshot(collection(db, 'users', user.uid, 'activityTypes'), (snap) => {
      setTypes(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as ActivityType[])
    })
    return () => {
      unsubAreas()
      unsubTypes()
    }
  }, [user])

  async function addType() {
    if (!user || !newTitle.trim()) return
    await addDoc(collection(db, 'users', user.uid, 'activityTypes'), {
      title: newTitle.trim(),
      defaultLifeAreaId: null,
      createdAt: new Date(),
    })
    setNewTitle('')
  }

  async function updateType(t: ActivityType, patch: Partial<ActivityType>) {
    if (!user) return
    const ref = doc(db, 'users', user.uid, 'activityTypes', t.id)
    await setDoc(ref, patch, { merge: true })
  }

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Activities Bank</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="New activity type (e.g., Deep Work, Cardio, Reading)"
            />
            <Button onClick={addType}>Add</Button>
          </div>

          <div className="space-y-3">
            {types.length === 0 ? (
              <div className="text-sm text-muted-foreground">No activity types yet.</div>
            ) : (
              types.map((t) => (
                <div key={t.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center border rounded-md p-2">
                  <Input
                    value={t.title}
                    onChange={(e) => updateType(t, { title: e.target.value })}
                  />
                  <select
                    className="h-9 px-2 rounded-md border bg-background"
                    value={t.defaultLifeAreaId ?? ''}
                    onChange={(e) => updateType(t, { defaultLifeAreaId: e.target.value || null })}
                  >
                    <option value="">Unassigned</option>
                    {lifeAreas.map((la) => (
                      <option key={la.id} value={la.id}>
                        {la.name}
                      </option>
                    ))}
                  </select>
                  <div className="text-xs text-muted-foreground">
                    ID: <code>{t.id}</code>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
