import 'dotenv/config'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

const serviceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
}

const app = initializeApp({ credential: cert(serviceAccount as any) })
const db = getFirestore(app)

async function initUser(uid: string, email: string, displayName?: string) {
  const userRef = db.collection('users').doc(uid)
  const userSnap = await userRef.get()

  if (!userSnap.exists) {
    console.log(`Creating user ${uid}`)
    await userRef.set({
      email,
      displayName: displayName || 'Test User',
      createdAt: Timestamp.now(),
      lastLogin: Timestamp.now(),
    })
  }

  // Ensure subcollections exist
  const collections = ['modes', 'activities', 'areas', 'reflections']
  for (const c of collections) {
    const ref = userRef.collection(c)
    const snap = await ref.limit(1).get()
    if (snap.empty) {
      console.log(`→ Seeding ${c}`)
      if (c === 'modes') {
        await ref.add({
          name: 'Default Mode',
          description: 'Initial mode placeholder',
          createdAt: Timestamp.now(),
        })
      } else if (c === 'areas') {
        await ref.add({
          name: 'General Well-being',
          focus: 70,
          updatedAt: Timestamp.now(),
        })
      }
    }
  }

  console.log(`✅ Initialized Firestore schema for ${uid}`)
}

initUser('test-user-123', 'test@example.com').then(() => {
  console.log('🎉 Schema initialization complete.')
  process.exit(0)
})
