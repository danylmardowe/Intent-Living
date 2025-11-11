// ✅ src/app/api/health/route.ts
import { NextResponse } from "next/server";
import { env, pineconeHost } from "@/config/env";

export async function GET() {
  return NextResponse.json({
    ok: true,
    model: env.GEMINI_MODEL,
    gemini: !!env.GEMINI_API_KEY,
    pinecone: !!env.PINECONE_API_KEY && !!pineconeHost(),
  });
}
