// ✅ src/app/api/ai/orchestrate/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { runAIChain } from "@/ai/orchestrator";
import { rateLimit } from "@/lib/rateLimit";
import { logger } from "@/lib/logger";
import { ValidationError } from "@/lib/errors";

const BodySchema = z.object({
  uid: z.string().min(1),
  intent: z.string().min(1),
  input: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "local";
    const rl = rateLimit(ip, 30, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });
    }

    const json = await req.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      throw new ValidationError("Invalid request body", parsed.error.flatten());
    }

    const { uid, intent, input } = parsed.data;
    const data = await runAIChain(uid, intent, input);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    logger.error("orchestrate error", { err: err?.message });
    const status = err.status ?? 500;
    return NextResponse.json({ success: false, error: err.message ?? "Internal error" }, { status });
  }
}
