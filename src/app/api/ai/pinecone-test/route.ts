// ✅ src/app/api/ai/pinecone-test/route.ts
import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";

export async function GET() {
  try {
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });

    // Use your **exact host** from Pinecone dashboard
    const host = "https://intent-memory-ejh69us.svc.aped-4627-b74a.pinecone.io";

    // The index name from your dashboard
    const indexName = "intent-memory";

    const index = pinecone.Index(indexName, host);

    await index.upsert([
      {
        id: `test-${Date.now()}`,
        values: Array(768).fill(0.5),
        metadata: { test: true, text: "Pinecone connectivity test" },
      },
    ]);

    return NextResponse.json({
      success: true,
      message: `✅ Vector successfully upserted into index "${indexName}".`,
    });
  } catch (err: any) {
    console.error("Pinecone test failed:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
