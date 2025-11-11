// ✅ src/ai/memory/embed.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Represents an embedded text memory.
 */
export interface MemoryVector {
  text: string;
  vector: number[];
  meta?: Record<string, any>;
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

/**
 * Embeds text into a numeric vector using Gemini embeddings.
 */
export async function embedText(
  text: string,
  meta?: Record<string, any>
): Promise<MemoryVector> {
  if (!text || !text.trim()) {
    throw new Error("Cannot embed empty text.");
  }

  const res = await embedModel.embedContent(text);
  return {
    text,
    vector: res.embedding.values,
    meta,
  };
}
