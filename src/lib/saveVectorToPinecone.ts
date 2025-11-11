// ✅ src/lib/saveVectorToPinecone.ts
import { getPineconeIndex } from "@/lib/pinecone-client";
import { v4 as uuidv4 } from "uuid";
import { logger } from "@/lib/logger";

export async function saveVectorToPinecone(uid: string, text: string, embedding: number[]) {
  const index = getPineconeIndex();
  const id = `${uid}-${uuidv4()}`;
  await index.upsert([
    {
      id,
      values: embedding,
      metadata: { uid, text, timestamp: new Date().toISOString() },
    },
  ]);
  logger.info("Saved vector to Pinecone", { uid, id });
}
