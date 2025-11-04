export async function POST(req: Request) {
  // TODO: Re-implement with your chosen provider (e.g., OpenAI)
  return new Response(JSON.stringify({ tasks: [], activities: [] }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
}
