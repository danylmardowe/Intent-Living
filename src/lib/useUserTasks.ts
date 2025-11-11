// ✅ src/lib/useUserTasks.ts
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

export interface Task {
  id: string;
  title: string;
  description?: string;
  energyLevel?: string; // low, medium, high
  status?: string; // todo, in-progress, done
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Realtime listener for user tasks
 */
export function useUserTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);
    const db = getFirestore(app);

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        setTasks([]);
        setLoading(false);
        return;
      }

      const tasksRef = collection(db, "users", user.uid, "tasks");
      const q = query(tasksRef, orderBy("createdAt", "desc"));

      const unsubSnapshot = onSnapshot(
        q,
        (snapshot) => {
          const docs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Task[];
          setTasks(docs);
          setLoading(false);
        },
        (error) => {
          console.error("❌ Error fetching tasks:", error);
          setLoading(false);
        }
      );

      return () => unsubSnapshot();
    });

    return () => unsubscribe();
  }, []);

  return { tasks, loading };
}
