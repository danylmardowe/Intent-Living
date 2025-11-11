// ✅ src/lib/useUserGoals.ts
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

export interface Goal {
  id: string;
  title: string;
  description?: string;
  lifeArea?: string;
  milestones?: string[];
  confidence?: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Realtime listener for user goals
 */
export function useUserGoals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);
    const db = getFirestore(app);

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        setGoals([]);
        setLoading(false);
        return;
      }

      const goalsRef = collection(db, "users", user.uid, "goals");
      const q = query(goalsRef, orderBy("createdAt", "desc"));

      const unsubSnapshot = onSnapshot(
        q,
        (snapshot) => {
          const docs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Goal[];
          setGoals(docs);
          setLoading(false);
        },
        (error) => {
          console.error("❌ Error fetching goals:", error);
          setLoading(false);
        }
      );

      return () => unsubSnapshot();
    });

    return () => unsubscribe();
  }, []);

  return { goals, loading };
}
