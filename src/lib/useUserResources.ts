// ✅ src/lib/useUserResources.ts
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

export interface Resource {
  id: string;
  title: string;
  category?: string; // e.g. reading, course, finance, support
  type?: string; // e.g. article, book, podcast
  url?: string;
  notes?: string;
  cost?: number;
  createdAt?: string;
}

/**
 * Realtime listener for user resources
 */
export function useUserResources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth(app);
    const db = getFirestore(app);

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        setResources([]);
        setLoading(false);
        return;
      }

      const resRef = collection(db, "users", user.uid, "resources");
      const q = query(resRef, orderBy("createdAt", "desc"));

      const unsubSnapshot = onSnapshot(
        q,
        (snapshot) => {
          const docs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Resource[];
          setResources(docs);
          setLoading(false);
        },
        (error) => {
          console.error("❌ Error fetching resources:", error);
          setLoading(false);
        }
      );

      return () => unsubSnapshot();
    });

    return () => unsubscribe();
  }, []);

  return { resources, loading };
}
