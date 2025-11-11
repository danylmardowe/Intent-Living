// ✅ src/lib/pinecone-client.ts
import { Pinecone } from "@pinecone-database/pinecone";
import { env, pineconeHost } from "@/config/env";
import { logger } from "@/lib/logger";

let client: Pinecone | null = null;
let hostCache: string | null = null;

export function getPineconeClient() {
  if (!client) {
    if (!env.PINECONE_API_KEY) throw new Error("PINECONE_API_KEY not set");
    client = new Pinecone({ apiKey: env.PINECONE_API_KEY });
  }
  return client;
}

export function getPineconeIndex() {
  if (!env.PINECONE_INDEX) throw new Error("PINECONE_INDEX not set");
  const c = getPineconeClient();
  if (!hostCache) {
    hostCache = pineconeHost();
    if (!hostCache) throw new Error("Unable to resolve Pinecone host; set PINECONE_HOST or PINECONE_ENVIRONMENT");
    logger.info("Using Pinecone host", { host: hostCache });
  }
  return c.Index(env.PINECONE_INDEX, hostCache);
}
