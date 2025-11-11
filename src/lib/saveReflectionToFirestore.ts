// ✅ src/lib/saveReflectionToFirestore.ts
import { getFirestore, collection, addDoc, Timestamp } from "firebase/firestore";
import { getApp, getApps, initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

/**
 * Save a reflection to Firestore; parse JSON block if present.
 */
export async function saveReflectionToFirestore(
  uid: string,
  intent: string,
  reflectionText: string,
  _rawOutput: any
) {
  try {
    const reflectionsRef = collection(db, "users", uid, "reflections");

    let structuredOutput: any = {};
    try {
      const jsonMatch = reflectionText.match(/\{[\s\S]*\}/);
      structuredOutput = jsonMatch ? JSON.parse(jsonMatch[0]) : { rawText: reflectionText };
    } catch {
      structuredOutput = { rawText: reflectionText };
    }

    await addDoc(reflectionsRef, {
      intent,
      reflection: reflectionText,
      structuredOutput,
      createdAt: Timestamp.now(),
    });

    console.log(`✅ Saved reflection to Firestore for ${uid}`);
  } catch (error: any) {
    console.error("❌ Error saving reflection to Firestore:", error.message);
  }
}
