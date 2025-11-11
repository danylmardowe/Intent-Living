// ✅ src/lib/user-context.ts
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { getApp, getApps, initializeApp } from "firebase/app";
import firebaseConfig from "./firebase"; // ✅ FIXED import

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export async function getUserContext(uid: string) {
  const context: any = {};

  const collections = ["modes", "goals", "lifeAreas"];
  for (const name of collections) {
    const snap = await getDocs(collection(db, "users", uid, name));
    context[name] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  return context;
}
