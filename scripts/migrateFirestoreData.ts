// ✅ scripts/migrateFirestoreData.ts
// --------------------------------------------------------------------
// This script migrates older Firestore data structures into the new unified schema.
// It uses Firebase Admin SDK for direct server access.
// --------------------------------------------------------------------

import * as admin from "firebase-admin";
import "dotenv/config";

console.log("🚀 Starting Firestore Migration...");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = admin.firestore();

// --------------------------------------------------------------------
// Utility helpers
// --------------------------------------------------------------------
async function migrateUser(uid: string) {
  console.log(`\n🧩 Migrating user: ${uid}`);

  const userRef = db.collection("users").doc(uid);
  const userSnap = await userRef.get();
  const userData = userSnap.data() || {};

  // 1️⃣ Create subcollections if missing
  const subcollections = [
    "modes",
    "lifeAreas",
    "goals",
    "tasks",
    "activities",
    "reflections",
    "reviews",
    "memories",
  ];

  for (const col of subcollections) {
    const colRef = userRef.collection(col);
    const snapshot = await colRef.limit(1).get();
    if (snapshot.empty) {
      await colRef.doc("_init").set({
        initializedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`✅ Created empty collection: ${col}`);
    }
  }

  // 2️⃣ Normalize data from old collections (if found)
  const legacyCollections = ["plans", "entries", "journals", "ai-insights"];

  for (const legacy of legacyCollections) {
    const legacyRef = userRef.collection(legacy);
    const legacySnap = await legacyRef.get();

    if (!legacySnap.empty) {
      console.log(`📦 Found legacy collection: ${legacy} (${legacySnap.size} docs)`);

      for (const doc of legacySnap.docs) {
        const data = doc.data();

        if (legacy === "plans") {
          // Convert to goal
          await userRef.collection("goals").add({
            title: data.title || "Untitled Goal",
            description: data.description || "",
            progress: data.progress ?? 0,
            confidence: data.confidence ?? 50,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        if (legacy === "entries") {
          // Convert to reflection
          await userRef.collection("reflections").add({
            summary: data.text || "No summary",
            insights: data.insights || [],
            suggested_actions: [],
            intent: data.intent || "daily_review",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        if (legacy === "ai-insights") {
          // Convert to memory
          await userRef.collection("memories").add({
            text: data.input || data.text || "",
            vectorId: data.vectorId || `legacy-${doc.id}`,
            source: "reflection",
            timestamp: new Date().toISOString(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }

        if (legacy === "journals") {
          // Convert to activity
          await userRef.collection("activities").add({
            name: data.title || "Journal Entry",
            type: "journal",
            duration: data.duration ?? 15,
            timestamp: data.timestamp || new Date().toISOString(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }

      console.log(`✅ Migrated ${legacySnap.size} docs from ${legacy}`);
    }
  }

  // 3️⃣ Update root user metadata
  await userRef.set(
    {
      migratedAt: admin.firestore.FieldValue.serverTimestamp(),
      schemaVersion: 2,
    },
    { merge: true }
  );

  console.log(`🎉 Migration complete for user: ${uid}`);
}

// --------------------------------------------------------------------
// Main migration routine
// --------------------------------------------------------------------
async function main() {
  const usersSnap = await db.collection("users").get();
  if (usersSnap.empty) {
    console.log("❌ No users found in Firestore.");
    return;
  }

  console.log(`\nFound ${usersSnap.size} users — starting migration...`);

  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    try {
      await migrateUser(uid);
    } catch (err) {
      console.error(`❌ Error migrating user ${uid}:`, err);
    }
  }

  console.log("\n✅ Migration finished for all users.");
  process.exit(0);
}

main();
