import { env } from "cloudflare:workers";

export async function POST(request: Request) {
  if (!env.OPENAI_API_KEY) {
    return Response.json({ error: "AI summaries are not configured on the public server yet." }, { status: 503 });
  }
  let payload: { text?: unknown };
  try { payload = await request.json() as { text?: unknown }; }
  catch { return Response.json({ error: "Send a valid thought to summarize." }, { status: 400 }); }
  const text = typeof payload.text === "string" ? payload.text.trim() : "";
  if (!text || text.length > 3000) return Response.json({ error: "Write a thought of up to 3,000 characters first." }, { status: 400 });
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { authorization: `Bearer ${env.OPENAI_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      instructions: "Turn the user's idea into one calm, vivid sleep intention. Keep its central meaning and concrete imagery. Use one short sentence, ideally under 16 words. Do not add claims, advice, or a preamble.",
      input: text,
      max_output_tokens: 80,
    }),
  });
  if (!response.ok) return Response.json({ error: "The AI summary service is unavailable right now." }, { status: 502 });
  const result = await response.json() as { output_text?: string };
  const summary = result.output_text?.trim();
  return summary ? Response.json({ summary }) : Response.json({ error: "The AI returned an empty summary." }, { status: 502 });
}
