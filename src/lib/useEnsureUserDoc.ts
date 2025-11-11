// ✅ src/lib/useEnsureUserDoc.ts
"use client";

import { useEffect } from "react";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { app } from "@/lib/firebase";

/**
 * Ensures that a Firestore user document exists for the current authenticated user.
 * Automatically runs after login and creates a default profile if one doesn’t exist.
 */
export function useEnsureUserDoc() {
  useEffect(() => {
    const auth = getAuth(app);
    const db = getFirestore(app);

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) return;

      try {
        const userRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userRef);

        if (!docSnap.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email ?? "",
            createdAt: new Date().toISOString(),
            displayName: user.displayName ?? "",
            photoURL: user.photoURL ?? "",
            lastLogin: new Date().toISOString(),
          });

          console.log(`✅ Created new Firestore user doc for ${user.email}`);
        } else {
          console.log(`✅ User doc already exists for ${user.email}`);
        }
      } catch (err) {
        console.error("❌ Error ensuring user doc:", err);
      }
    });

    return () => unsubscribe();
  }, []);
}
