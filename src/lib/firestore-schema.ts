// ✅ src/lib/firestore-schema.ts
// Centralized Firestore schema, types, and data helpers
// --------------------------------------------------------------------

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Firestore,
} from "firebase/firestore";
import { db } from "./firebase";

// --------------------------------------------------------------------
// 🧩 Shared Base Types
// --------------------------------------------------------------------
export interface BaseDoc {
  id?: string;
  createdAt?: any;
  updatedAt?: any;
}

// --------------------------------------------------------------------
// 👤 User Profile & Settings
// --------------------------------------------------------------------
export interface UserProfile extends BaseDoc {
  displayName: string;
  email: string;
  avatarUrl?: string;
  lastLogin?: string;
}

export interface UserSettings extends BaseDoc {
  mode?: string; // active mode id
  preferences?: {
    theme?: "light" | "dark";
    cadence?: "daily" | "weekly" | "monthly";
    notifications?: boolean;
  };
}

// --------------------------------------------------------------------
// 🧘 Modes
// --------------------------------------------------------------------
export interface Mode extends BaseDoc {
  name: string;
  description?: string;
  color?: string;
}

// --------------------------------------------------------------------
// 🌿 Life Areas
// --------------------------------------------------------------------
export interface LifeArea extends BaseDoc {
  name: string;
  satisfaction: number;
  importance: number;
  focus: number;
  color?: string;
  modeId?: string;
}

// --------------------------------------------------------------------
// 🎯 Goals
// --------------------------------------------------------------------
export interface Milestone {
  id?: string;
  name: string;
  completed: boolean;
  dueDate?: string;
}

export interface Goal extends BaseDoc {
  title: string;
  description?: string;
  lifeAreaId?: string;
  modeId?: string;
  confidence?: number; // 0–100
  progress?: number; // 0–100
  dependencies?: string[];
  milestones?: Milestone[];
}

// --------------------------------------------------------------------
// ✅ Tasks
// --------------------------------------------------------------------
export interface Task extends BaseDoc {
  title: string;
  description?: string;
  goalId?: string;
  lifeAreaId?: string;
  modeId?: string;
  energy?: "low" | "medium" | "high";
  priority?: "low" | "medium" | "high";
  completed?: boolean;
}

// --------------------------------------------------------------------
// 🏃 Activities
// --------------------------------------------------------------------
export interface Activity extends BaseDoc {
  name: string;
  type: string;
  lifeAreaId?: string;
  modeId?: string;
  duration?: number; // minutes
  timestamp?: string;
}

// --------------------------------------------------------------------
// 💭 Reflections
// --------------------------------------------------------------------
export interface Reflection extends BaseDoc {
  summary: string;
  insights: string[];
  suggested_actions: string[];
  intent: "daily_review" | "weekly_review" | "monthly_review" | "annual";
  contextVectorId?: string;
}

// --------------------------------------------------------------------
// 🧠 Reviews
// --------------------------------------------------------------------
export interface Review extends BaseDoc {
  cadence: "daily" | "weekly" | "monthly" | "annual";
  narrativeSummary: string;
  contextualPrompts?: string[];
  aiVersion?: string;
}

// --------------------------------------------------------------------
// 🧩 Memories (Pinecone-linked embeddings)
// --------------------------------------------------------------------
export interface Memory extends BaseDoc {
  text: string;
  vectorId: string;
  source: "reflection" | "task" | "goal";
  timestamp: string;
}

// --------------------------------------------------------------------
// 🧰 Firestore Collection Helpers
// --------------------------------------------------------------------
export const userRef = (uid: string) => doc(db, "users", uid);
export const subCol = (uid: string, sub: string) =>
  collection(db, "users", uid, sub);

// Fetch all documents from a user subcollection
export async function getUserCollection<T>(uid: string, sub: string): Promise<T[]> {
  const colRef = subCol(uid, sub);
  const snap = await getDocs(colRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as T));
}

// Add a document to a subcollection
export async function addUserDoc<T>(uid: string, sub: string, data: T) {
  const colRef = subCol(uid, sub);
  const ref = await addDoc(colRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

// Update an existing document
export async function updateUserDoc<T>(
  uid: string,
  sub: string,
  id: string,
  data: Partial<T>
) {
  const docRef = doc(db, "users", uid, sub, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// --------------------------------------------------------------------
// 🧩 Convenience Getters
// --------------------------------------------------------------------
export const getUserModes = (uid: string) =>
  getUserCollection<Mode>(uid, "modes");

export const getUserLifeAreas = (uid: string) =>
  getUserCollection<LifeArea>(uid, "lifeAreas");

export const getUserGoals = (uid: string) =>
  getUserCollection<Goal>(uid, "goals");

export const getUserTasks = (uid: string) =>
  getUserCollection<Task>(uid, "tasks");

export const getUserActivities = (uid: string) =>
  getUserCollection<Activity>(uid, "activities");

export const getUserReflections = (uid: string) =>
  getUserCollection<Reflection>(uid, "reflections");

export const getUserReviews = (uid: string) =>
  getUserCollection<Review>(uid, "reviews");

export const getUserMemories = (uid: string) =>
  getUserCollection<Memory>(uid, "memories");

// --------------------------------------------------------------------
// ✅ Example Usage
// --------------------------------------------------------------------
// const goals = await getUserGoals(user.uid);
// await addUserDoc(user.uid, "tasks", { title: "Test Task", completed: false });

