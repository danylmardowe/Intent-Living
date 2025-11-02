'use client'

import * as React from 'react'
import { useEffect, useState } from 'react'
import {
  addDoc,
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore'
import Link from 'next/link'
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

  async function updateTypeTitle(t: ActivityType, title: string) {
    if (!user) return
    const ref = doc(db, 'users', user.uid, 'activityTypes', t.id)
    await updateDoc(ref, { title })
  }

  async function updateTypeDefaultArea(t: ActivityType, lifeAreaId: string | null) {
    if (!user) return
    const ref = doc(db, 'users', user.uid, 'activityTypes', t.id)
    await updateDoc(ref, { defaultLifeAreaId: lifeAreaId })
  }

  async function deleteType(t: ActivityType) {
    if (!user) return
    const ok = window.confirm(
      `Delete activity type "${t.title}"?\n\nNote: Activities linked to this type are NOT deleted here. Use the type detail page if you want to cascade delete.`
    )
    if (!ok) return
    const ref = doc(db, 'users', user.uid, 'activityTypes', t.id)
    await deleteDoc(ref)
  }

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
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

          <div className="grid gap-3">
            {types.length === 0 ? (
              <div className="text-sm text-muted-foreground">No activity types yet.</div>
            ) : (
              types.map((t) => (
                <div
                  key={t.id}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_240px_220px] gap-2 items-center border rounded-md p-3"
                >
                  <Input
                    value={t.title}
                    onChange={(e) => updateTypeTitle(t, e.target.value)}
                  />
                  <select
                    className="h-9 px-2 rounded-md border bg-background"
                    value={t.defaultLifeAreaId ?? ''}
                    onChange={(e) =>
                      updateTypeDefaultArea(t, e.target.value ? e.target.value : null)
                    }
                  >
                    <option value="">Unassigned</option>
                    {lifeAreas.map((la) => (
                      <option key={la.id} value={la.id}>
                        {la.name}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-2">
                    {/* This is the path the detail page will register */}
                    <Link href={`/activities/types/${t.id}`} prefetch={false}>
                      <Button variant="default">Open</Button>
                    </Link>
                    <Button variant="destructive" onClick={() => deleteType(t)}>
                      Delete
                    </Button>
                    <div className="text-xs text-muted-foreground ml-auto">
                      ID: <code>{t.id}</code>
                    </div>
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
