// ✅ src/lib/useUserLifeAreas.ts
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

export interface LifeArea {
  id: string;
  name: string;
  focus?: number; // % focus or time allocation
  color?: string;
  createdAt?: string;
}

/**
 * Realtime listener for user life areas
 */
export function useUserLifeAreas() {
  const [areas, setAreas] = useState<LifeArea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);
    const db = getFirestore(app);

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        setAreas([]);
        setLoading(false);
        return;
      }

      const areasRef = collection(db, "users", user.uid, "lifeAreas");
      const q = query(areasRef, orderBy("createdAt", "desc"));

      const unsubSnapshot = onSnapshot(
        q,
        (snapshot) => {
          const docs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as LifeArea[];
          setAreas(docs);
          setLoading(false);
        },
        (error) => {
          console.error("❌ Error fetching life areas:", error);
          setLoading(false);
        }
      );

      return () => unsubSnapshot();
    });

    return () => unsubscribe();
  }, []);

  return { areas, loading };
}
