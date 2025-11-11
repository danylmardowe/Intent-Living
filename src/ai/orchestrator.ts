// ✅ src/ai/orchestrator.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "@/config/env";
import { logger } from "@/lib/logger";
import { retrieveSimilarMemories } from "@/lib/retrieveSimilarMemories";
import { saveVectorToPinecone } from "@/lib/saveVectorToPinecone";
import { saveReflectionToFirestore } from "@/lib/saveReflectionToFirestore";

export async function runAIChain(uid: string, intent: string, input: string) {
  logger.info("Orchestrator start", { uid, intent });

  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: env.GEMINI_MODEL });

  // Recall memories
  const similar = await retrieveSimilarMemories(uid, input, 5);
  const memoryContext = similar.length
    ? similar.map((m, i) => `Memory #${i + 1} (${m.timestamp}): ${m.text.slice(0, 400)}`).join("\n\n")
    : "No previous reflections.";

  // Build prompt
  const prompt = `
You are a personal AI assistant helping the user with self-reflection.

User ID: ${uid}
Intent: ${intent}

Recent input:
"${input}"

Relevant past reflections:
${memoryContext}

Provide an insightful new reflection that builds on the user's previous experiences.
Return a concise JSON-style summary with keys: summary, insights, and suggested_actions.
`;

  // Generate response
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  logger.debug("Gemini output", { text });

  // Embed and persist
  const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const embed = await embedModel.embedContent(text);
  const vector = embed.embedding.values;

  await Promise.all([
    saveVectorToPinecone(uid, text, vector),
    saveReflectionToFirestore(uid, intent, text, null),
  ]);

  logger.info("Orchestrator done", { uid, intent });

  return {
    intent,
    output: text,
    recalledMemories: similar,
  };
}
