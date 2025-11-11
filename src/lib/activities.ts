// ✅ src/lib/activities.ts
import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";

/* -------------------------------------------------------------------------- */
/*                               TYPE DEFINITIONS                              */
/* -------------------------------------------------------------------------- */

export type ActivityType =
  | "focus"
  | "learning"
  | "exercise"
  | "reflection"
  | "rest"
  | "social"
  | "creative"
  | "work";

export interface Activity {
  id?: string;
  uid: string;
  type: ActivityType;
  description: string;
  durationMinutes: number;
  lifeAreaId?: string;
  createdAt: Timestamp;
}

/* -------------------------------------------------------------------------- */
/*                                STATIC HELPERS                               */
/* -------------------------------------------------------------------------- */

/**
 * Returns all supported activity types.
 */
export function listActivityTypes(): ActivityType[] {
  return [
    "focus",
    "learning",
    "exercise",
    "reflection",
    "rest",
    "social",
    "creative",
    "work",
  ];
}

/**
 * Converts two timestamps to a readable duration in minutes.
 */
export function durationOf(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / 60000);
}

/* -------------------------------------------------------------------------- */
/*                                FIRESTORE OPS                                */
/* -------------------------------------------------------------------------- */

/**
 * Creates a new activity record in Firestore.
 */
export async function createActivity(data: Omit<Activity, "createdAt">) {
  const ref = collection(db, "activities");
  const docRef = await addDoc(ref, {
    ...data,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

/**
 * Fetches all activities for a specific user.
 */
export async function getUserActivities(uid: string): Promise<Activity[]> {
  const q = query(collection(db, "activities"), where("uid", "==", uid));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      } as Activity)
  );
}

/**
 * Simple helper for converting Firestore Timestamp → JS Date
 */
export function toDate(ts: Timestamp | null): Date | null {
  return ts ? ts.toDate() : null;
}
