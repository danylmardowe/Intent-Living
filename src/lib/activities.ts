// Centralized types + Firestore helpers for Activities & ActivityTypes

import {
  collection,
  addDoc,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export type ActivitySource = 'manual' | 'aiRecall'

export interface Activity {
  id?: string
  title: string
  startAt: Timestamp
  endAt: Timestamp
  duration: number // milliseconds
  notes?: string
  tags?: string[]
  lifeAreaId?: string
  goalId?: string
  taskId?: string
  energyLevel?: number // 0..10
  mood?: string
  source?: ActivitySource
  createdAt?: Timestamp
}

// In the new spec, ActivityType is a **reusable activity** preset.
// Keep it intentionally minimal: just a title and optional default duration.
export interface ActivityType {
  id?: string
  title: string
  defaultDuration?: number // ms, optional
  usageCount?: number
  createdAt?: Timestamp
}

export function durationOf(start: Date, end: Date) {
  return Math.max(0, end.getTime() - start.getTime())
}

const activitiesCol = (uid: string) => collection(db, 'users', uid, 'activities')
const activityTypesCol = (uid: string) => collection(db, 'users', uid, 'activityTypes')

// ---- Activities ----
export async function listActivities(uid: string, opts?: { from?: Date; to?: Date }) {
  const constraints = []
  if (opts?.from) constraints.push(where('startAt', '>=', Timestamp.fromDate(opts.from)))
  if (opts?.to) constraints.push(where('startAt', '<=', Timestamp.fromDate(opts.to)))
  const q = query(activitiesCol(uid), ...constraints, orderBy('startAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Activity) }))
}

export async function createActivity(uid: string, data: Omit<Activity, 'id' | 'createdAt'>) {
  const docRef = await addDoc(activitiesCol(uid), {
    ...data,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updateActivity(uid: string, id: string, patch: Partial<Activity>) {
  await updateDoc(doc(activitiesCol(uid), id), patch)
}

export async function deleteActivity(uid: string, id: string) {
  await deleteDoc(doc(activitiesCol(uid), id))
}

export async function getActivity(uid: string, id: string) {
  const snap = await getDoc(doc(activitiesCol(uid), id))
  return snap.exists() ? ({ id: snap.id, ...(snap.data() as Activity) }) : null
}

// ---- Activity Types (Reusable Activities Bank) ----
export async function listActivityTypes(uid: string) {
  const q = query(activityTypesCol(uid), orderBy('title'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as ActivityType) }))
}

export async function createActivityType(
  uid: string,
  data: Omit<ActivityType, 'id' | 'createdAt' | 'usageCount'>
) {
  const ref = await addDoc(activityTypesCol(uid), {
    ...data,
    usageCount: 0,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function updateActivityType(uid: string, id: string, patch: Partial<ActivityType>) {
  await updateDoc(doc(activityTypesCol(uid), id), patch)
}

export async function deleteActivityType(uid: string, id: string) {
  await deleteDoc(doc(activityTypesCol(uid), id))
}
