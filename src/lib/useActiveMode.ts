"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, collection, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "@/context/auth-context";

export interface Mode {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isActive?: boolean;
}

/**
 * Hook that manages the user's active mode & syncs mode list in real time.
 */
export function useActiveMode() {
  const { user } = useAuth();
  const [mode, setMode] = useState<string | null>(null);
  const [availableModes, setAvailableModes] = useState<Mode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const modesRef = collection(db, "users", user.uid, "modes");

    // Live listener for all modes
    const unsubModes = onSnapshot(modesRef, (snapshot) => {
      const modesList = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Mode)
      );
      setAvailableModes(modesList);
    });

    const fetchActiveMode = async () => {
      const settingsRef = doc(db, "users", user.uid, "settings", "mode");
      const snap = await getDoc(settingsRef);

      if (snap.exists()) {
        setMode(snap.data().currentMode);
      } else {
        setMode(null);
      }

      setLoading(false);
    };

    fetchActiveMode();

    return () => unsubModes();
  }, [user]);

  const updateMode = async (newMode: string) => {
    if (!user) return;
    try {
      const ref = doc(db, "users", user.uid, "settings", "mode");
      await setDoc(ref, { currentMode: newMode }, { merge: true });
      setMode(newMode);
    } catch (error) {
      console.error("Error updating mode:", error);
    }
  };

  return { mode, updateMode, availableModes, loading };
}
