// ✅ src/ai/memory/recall.ts
import { MemoryVector } from "./embed";

/**
 * Compute cosine similarity between two vectors.
 */
function cosineSim(a: number[], b: number[]): number {
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const normA = Math.sqrt(a.reduce((s, ai) => s + ai * ai, 0));
  const normB = Math.sqrt(b.reduce((s, bi) => s + bi * bi, 0));
  return dot / (normA * normB);
}

/**
 * Finds the top K most similar memories to a given query.
 */
export function recallSimilar(
  query: MemoryVector,
  memories: MemoryVector[],
  topK = 5
): MemoryVector[] {
  if (!memories.length) return [];

  return memories
    .map((m) => ({
      ...m,
      score: cosineSim(query.vector, m.vector),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
