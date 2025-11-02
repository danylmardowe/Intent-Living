'use client'

import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/firebase'
import { useAuth } from '@/context/auth-context'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Activity, ActivityType } from '@/lib/types'

type LifeArea = { id: string; name: string }

export default function ActivityTypeDetailPage() {
  const { user } = useAuth()
  const params = useParams<{ typeId: string }>()
  const router = useRouter()
  const typeId = params?.typeId

  const [typeDoc, setTypeDoc] = useState<ActivityType | null>(null)
  const [lifeAreas, setLifeAreas] = useState<LifeArea[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  // Minimal create form: title + notes only (life area auto from type)
  const [createTitle, setCreateTitle] = useState('')
  const [createNotes, setCreateNotes] = useState('')

  useEffect(() => {
    if (!user || !typeId) return

    // Subscribe to the Activity Type
    const unsubType = onSnapshot(doc(db, 'users', user.uid, 'activityTypes', typeId), (snap) => {
      if (!snap.exists()) {
        setTypeDoc(null)
      } else {
        const data = snap.data() as any
        setTypeDoc({
          id: snap.id,
          title: data.title,
          defaultLifeAreaId: data.defaultLifeAreaId ?? null,
        })
      }
    })

    // Pull life areas (read-only display)
    const unsubAreas = onSnapshot(collection(db, 'users', user.uid, 'lifeAreas'), (snap) => {
      setLifeAreas(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as LifeArea[])
    })

    // Subscribe to all activities for this type (generic entries)
    // NOTE: no orderBy here — we sort client-side to avoid needing a composite index.
    const q = query(
      collection(db, 'users', user.uid, 'activities'),
      where('typeId', '==', typeId)
    )
    const unsubActs = onSnapshot(q, (snap) => {
      const rows = snap.docs.map((d) => {
        const raw = d.data() as any
        // createdAt may be a Timestamp or missing; normalize to Date (fallback to epoch)
        const createdAt: Date =
          raw.createdAt?.toDate?.() ??
          (raw.createdAt instanceof Date ? raw.createdAt : new Date(0))

        return {
          id: d.id,
          title: raw.title,
          typeId: raw.typeId,
          lifeAreaId: raw.lifeAreaId ?? null,
          // optional / absent for generic activities:
          startTime: raw.startTime?.toDate?.() ?? null,
          endTime: raw.endTime?.toDate?.() ?? null,
          durationMinutes: raw.durationMinutes ?? null,
          notes: raw.notes ?? null,
          createdAt,
        } as Activity
      })

      // Client-side sort: newest first
      rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

      setActivities(rows)
      setLoading(false)
    })

    return () => {
      unsubType()
      unsubAreas()
      unsubActs()
    }
  }, [user, typeId])

  const defaultLifeAreaName = useMemo(() => {
    if (!typeDoc?.defaultLifeAreaId) return 'Unassigned'
    return lifeAreas.find((la) => la.id === typeDoc.defaultLifeAreaId)?.name ?? 'Unassigned'
  }, [lifeAreas, typeDoc?.defaultLifeAreaId])

  // ----- Type CRUD -----
  async function saveTypeTitle(title: string) {
    if (!user || !typeDoc) return
    await updateDoc(doc(db, 'users', user.uid, 'activityTypes', typeDoc.id), { title })
  }

  async function saveTypeDefaultLifeArea(lifeAreaId: string | null) {
    if (!user || !typeDoc) return
    await updateDoc(doc(db, 'users', user.uid, 'activityTypes', typeDoc.id), {
      defaultLifeAreaId: lifeAreaId,
    })
  }

  async function deleteType(withCascade: boolean) {
    if (!user || !typeDoc) return
    const msg = withCascade
      ? `Delete type "${typeDoc.title}" AND ALL its ${activities.length} activities?`
      : `Delete type "${typeDoc.title}"? (Activities will remain.)`
    const ok = window.confirm(msg)
    if (!ok) return

    if (withCascade) {
      const q = query(
        collection(db, 'users', user.uid, 'activities'),
        where('typeId', '==', typeDoc.id)
      )
      const snap = await getDocs(q)
      const deletes = snap.docs.map((d) => deleteDoc(d.ref))
      await Promise.all(deletes)
    }

    await deleteDoc(doc(db, 'users', user.uid, 'activityTypes', typeDoc.id))
    router.push('/activities')
  }

  // ----- Activity CRUD (generic entries; auto lifeArea from type) -----
  async function createActivity() {
    if (!user || !typeDoc) return
    const title = (createTitle || typeDoc.title).trim()
    if (!title) return

    await addDoc(collection(db, 'users', user.uid, 'activities'), {
      title,
      typeId: typeDoc.id,
      lifeAreaId: typeDoc.defaultLifeAreaId || null, // auto-assign
      notes: createNotes.trim() || null,
      createdAt: serverTimestamp(), // server-side timestamp for consistent ordering
    })

    setCreateTitle('')
    setCreateNotes('')
  }

  async function updateActivity(a: Activity, patch: Partial<Activity>) {
    if (!user) return
    const ref = doc(db, 'users', user.uid, 'activities', a.id)
    const payload: any = { ...patch }

    if (typeof payload.title === 'string') payload.title = payload.title.trim()
    if (typeof payload.notes === 'string') payload.notes = payload.notes.trim()

    // Lock down fields not used on this screen
    delete payload.lifeAreaId
    delete payload.startTime
    delete payload.endTime
    delete payload.durationMinutes

    await updateDoc(ref, payload)
  }

  async function deleteActivity(a: Activity) {
    if (!user) return
    const ok = window.confirm(`Delete activity "${a.title}"?`)
    if (!ok) return
    await deleteDoc(doc(db, 'users', user.uid, 'activities', a.id))
  }

  if (!user) return <div className="p-4 max-w-3xl mx-auto">Please sign in.</div>
  if (loading && !typeDoc) return <div className="p-4 max-w-3xl mx-auto">Loading…</div>

  if (!typeDoc) {
    return (
      <div className="p-4 max-w-3xl mx-auto">
        <div className="mb-3">
          <Link href="/activities" className="underline">← Back to Activities Bank</Link>
        </div>
        <div className="text-sm text-muted-foreground">Activity Type not found.</div>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <div className="mb-2">
        <Link href="/activities" className="underline">← Back to Activities Bank</Link>
      </div>

      {/* TYPE CARD */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_240px] gap-3">
            <Input
              value={typeDoc.title}
              onChange={(e) => saveTypeTitle(e.target.value)}
              placeholder="Type title"
            />
            <select
              className="h-9 px-2 rounded-md border bg-background"
              value={typeDoc.defaultLifeAreaId ?? ''}
              onChange={(e) => saveTypeDefaultLifeArea(e.target.value || null)}
            >
              <option value="">Unassigned</option>
              {lifeAreas.map((la) => (
                <option key={la.id} value={la.id}>
                  {la.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="destructive" onClick={() => deleteType(false)}>
              Delete Type
            </Button>
            <Button variant="destructive" onClick={() => deleteType(true)}>
              Delete Type & Activities ({activities.length})
            </Button>
            <div className="text-xs text-muted-foreground ml-auto">
              Default Life Area: <span className="font-medium">{defaultLifeAreaName}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CREATE GENERIC ACTIVITY (no calendar, no life area) */}
      <Card>
        <CardHeader>
          <CardTitle>Add Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={createTitle}
            onChange={(e) => setCreateTitle(e.target.value)}
            placeholder={`Activity title (defaults to "${typeDoc.title}")`}
          />
          <Textarea
            placeholder="Notes (optional)"
            value={createNotes}
            onChange={(e) => setCreateNotes(e.target.value)}
          />
          <div className="text-xs text-muted-foreground">
            Life Area will be set to: <span className="font-medium">{defaultLifeAreaName}</span>
          </div>
          <Button onClick={createActivity}>Add Activity</Button>
        </CardContent>
      </Card>

      {/* ACTIVITIES LIST (no calendar, no life area control) */}
      <Card>
        <CardHeader>
          <CardTitle>Activities ({activities.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {activities.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No activities for this type yet.
            </div>
          ) : (
            activities.map((a) => (
              <div
                key={a.id}
                className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-start border rounded-md p-3"
              >
                <div className="space-y-2">
                  <Input
                    value={a.title}
                    onChange={(e) => updateActivity(a, { title: e.target.value })}
                  />
                  <Textarea
                    value={a.notes ?? ''}
                    onChange={(e) => updateActivity(a, { notes: e.target.value })}
                    placeholder="Notes"
                  />
                  <div className="text-xs text-muted-foreground">
                    Life Area: <span className="font-medium">
                      {a.lifeAreaId
                        ? lifeAreas.find((la) => la.id === a.lifeAreaId)?.name ?? 'Unassigned'
                        : 'Unassigned'}
                    </span>
                    {a.createdAt && (
                      <span className="ml-2">• Created {a.createdAt.toLocaleString()}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-start justify-end">
                  <Button variant="destructive" onClick={() => deleteActivity(a)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
