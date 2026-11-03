import { env } from "cloudflare:workers";

const voices = new Set(["alloy", "ash", "ballad", "coral", "echo", "fable", "nova", "onyx", "sage", "shimmer", "verse", "marin", "cedar"]);

export async function POST(request: Request) {
  if (!env.OPENAI_API_KEY) return Response.json({ error: "Hosted speech is not configured; use a voice available on your device." }, { status: 503 });
  let payload: { text?: unknown; voice?: unknown };
  try { payload = await request.json() as { text?: unknown; voice?: unknown }; }
  catch { return Response.json({ error: "Send valid speech text." }, { status: 400 }); }
  const text = typeof payload.text === "string" ? payload.text.trim() : "";
  const voice = typeof payload.voice === "string" && voices.has(payload.voice) ? payload.voice : "marin";
  if (!text || text.length > 1000) return Response.json({ error: "Speech text must be between 1 and 1,000 characters." }, { status: 400 });
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { authorization: `Bearer ${env.OPENAI_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice,
      input: text,
      instructions: "Speak in an ordinary, clear, friendly conversational voice at a natural speaking pace. Pause only at punctuation. Do not whisper or use dramatic, eerie, breathy, or theatrical effects.",
      speed: 1,
      response_format: "mp3",
    }),
  });
  if (!response.ok || !response.body) return Response.json({ error: "Hosted speech is unavailable right now." }, { status: 502 });
  return new Response(response.body, { headers: { "content-type": "audio/mpeg", "cache-control": "no-store" } });
}
