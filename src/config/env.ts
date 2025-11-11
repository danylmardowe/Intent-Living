// ✅ src/config/env.ts
import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.string().default("development"),

  // Gemini
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),

  // Pinecone
  PINECONE_API_KEY: z.string().optional(),
  PINECONE_INDEX: z.string().optional(),
  PINECONE_ENVIRONMENT: z.string().optional(),
  // Optional explicit host override (recommended, since it works for you)
  PINECONE_HOST: z.string().optional(),

  // Client Firebase (already in your .env.local)
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_USE_EMULATORS: z.string().optional(),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  const message = parsed.error.errors
    .map(e => `${e.path.join(".")}: ${e.message}`)
    .join(", ");
  throw new Error(`Env validation failed: ${message}`);
}

export const env = parsed.data;

export function pineconeHost(): string | null {
  if (!env.PINECONE_API_KEY || !env.PINECONE_INDEX) return null;
  if (env.PINECONE_HOST) return env.PINECONE_HOST; // explicit host wins
  if (env.PINECONE_ENVIRONMENT) {
    return `https://${env.PINECONE_INDEX}-${env.PINECONE_ENVIRONMENT}.svc.pinecone.io`;
  }
  return null;
}
