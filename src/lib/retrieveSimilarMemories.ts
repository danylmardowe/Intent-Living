// ✅ src/lib/retrieveSimilarMemories.ts
import { getPineconeIndex } from "@/lib/pinecone-client";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "@/config/env";

export async function retrieveSimilarMemories(uid: string, query: string, topK = 5) {
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const embedResult = await embedModel.embedContent(query);
  const vector = embedResult.embedding.values;

  const index = getPineconeIndex();
  const results = await index.query({
    topK,
    vector,
    filter: { uid },
    includeMetadata: true,
  });

  return results.matches?.map((m) => ({
    id: m.id,
    score: m.score,
    text: (m.metadata?.text as string) || "",
    timestamp: (m.metadata?.timestamp as string) || "",
  })) ?? [];
}
