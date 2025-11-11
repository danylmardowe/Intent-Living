// ✅ src/lib/firestore-admin.ts
// Server-side Firestore admin utilities for API routes and backend logic
// --------------------------------------------------------------------

import * as admin from "firebase-admin";

// --------------------------------------------------------------------
// 🚀 Initialize Admin SDK
// --------------------------------------------------------------------
// This file is used only on the server (e.g., in /api routes)
// Do NOT import this from client components.

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
      databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`,
    });
  } catch (err) {
    console.error("🔥 Error initializing Firebase Admin SDK:", err);
  }
}

export const adminDb = admin.firestore();

// --------------------------------------------------------------------
// 🧩 Type Imports (optional, reuse from firestore-schema.ts)
// --------------------------------------------------------------------
import type {
  Goal,
  Task,
  Reflection,
  Review,
  Mode,
  LifeArea,
  Memory,
} from "./firestore-schema";

// --------------------------------------------------------------------
// 🧰 Server Utilities
// --------------------------------------------------------------------

// Get a user document (root-level profile)
export async function getUserProfile(uid: string) {
  const ref = adminDb.doc(`users/${uid}`);
  const snap = await ref.get();
  return snap.exists ? snap.data() : null;
}

// Generic: get all docs from a subcollection
export async function getUserSubcollection<T>(uid: string, sub: string): Promise<T[]> {
  const snap = await adminDb.collection(`users/${uid}/${sub}`).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as T));
}

// Add doc to subcollection (server-side)
export async function addUserSubDoc<T>(
  uid: string,
  sub: string,
  data: T
): Promise<string> {
  const ref = await adminDb.collection(`users/${uid}/${sub}`).add({
    ...data,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return ref.id;
}

// Update document in subcollection
export async function updateUserSubDoc<T>(
  uid: string,
  sub: string,
  id: string,
  data: Partial<T>
) {
  const ref = adminDb.doc(`users/${uid}/${sub}/${id}`);
  await ref.update({
    ...data,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

// Delete a document
export async function deleteUserSubDoc(uid: string, sub: string, id: string) {
  const ref = adminDb.doc(`users/${uid}/${sub}/${id}`);
  await ref.delete();
}

// --------------------------------------------------------------------
// 🎯 Convenience Fetchers
// --------------------------------------------------------------------

export const getServerGoals = (uid: string) => getUserSubcollection<Goal>(uid, "goals");
export const getServerTasks = (uid: string) => getUserSubcollection<Task>(uid, "tasks");
export const getServerReflections = (uid: string) =>
  getUserSubcollection<Reflection>(uid, "reflections");
export const getServerReviews = (uid: string) => getUserSubcollection<Review>(uid, "reviews");
export const getServerModes = (uid: string) => getUserSubcollection<Mode>(uid, "modes");
export const getServerLifeAreas = (uid: string) =>
  getUserSubcollection<LifeArea>(uid, "lifeAreas");
export const getServerMemories = (uid: string) =>
  getUserSubcollection<Memory>(uid, "memories");

// --------------------------------------------------------------------
// 🧠 Reflection + Memory Helpers (for orchestrator.ts)
// --------------------------------------------------------------------

// Save AI reflection (Firestore + Pinecone link)
export async function saveReflectionToFirestore(uid: string, reflection: Reflection) {
  const ref = adminDb.collection(`users/${uid}/reflections`).doc();
  await ref.set({
    ...reflection,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return ref.id;
}

// Save embedding metadata for Pinecone vector
export async function saveMemoryToFirestore(uid: string, memory: Memory) {
  const ref = adminDb.collection(`users/${uid}/memories`).doc();
  await ref.set({
    ...memory,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return ref.id;
}

// --------------------------------------------------------------------
// 🧹 Example: Delete user (if needed)
// --------------------------------------------------------------------
export async function deleteUserData(uid: string) {
  const collections = [
    "goals",
    "tasks",
    "activities",
    "reflections",
    "reviews",
    "modes",
    "lifeAreas",
    "memories",
  ];

  const batch = adminDb.batch();
  for (const col of collections) {
    const snap = await adminDb.collection(`users/${uid}/${col}`).get();
    snap.docs.forEach((d) => batch.delete(d.ref));
  }

  // delete user root doc
  batch.delete(adminDb.doc(`users/${uid}`));
  await batch.commit();
  return true;
}

console.log("✅ Firestore Admin initialized successfully");
