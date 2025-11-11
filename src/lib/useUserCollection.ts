// ✅ src/lib/useUserCollection.ts
"use client";

import { useEffect, useState } from "react";
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { app } from "@/lib/firebase";

/**
 * Realtime listener for any user subcollection.
 * Example: useUserCollection("lifeAreas"), useUserCollection("goals")
 */
export function useUserCollection<T = any>(collectionName: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);
    const db = getFirestore(app);

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        setData([]);
        setLoading(false);
        return;
      }

      const colRef = collection(db, "users", user.uid, collectionName);
      const q = query(colRef, orderBy("createdAt", "desc"));

      const unsubSnapshot = onSnapshot(
        q,
        (snapshot) => {
          const docs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as T[];
          setData(docs);
          setLoading(false);
        },
        (error) => {
          console.error(`❌ Error fetching ${collectionName}:`, error);
          setLoading(false);
        }
      );

      return () => unsubSnapshot();
    });

    return () => unsubscribe();
  }, [collectionName]);

  return { data, loading };
}
