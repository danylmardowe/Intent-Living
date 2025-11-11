// ✅ src/ai/memory/store.ts
import { db } from "../../lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { MemoryVector } from "./embed";

/**
 * Save a memory vector to Firestore under users/{uid}/memories
 */
export async function saveMemory(uid: string, memory: MemoryVector): Promise<void> {
  const ref = collection(db, "users", uid, "memories");
  await addDoc(ref, {
    ...memory,
    createdAt: Date.now(),
  });
}

/**
 * Fetch recent memories from Firestore.
 * Optionally limit results and sort by createdAt.
 */
export async function getMemories(uid: string, count = 20): Promise<MemoryVector[]> {
  const ref = collection(db, "users", uid, "memories");
  const q = query(ref, orderBy("createdAt", "desc"), limit(count));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as MemoryVector);
}
