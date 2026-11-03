import { allowWrite, database, jsonBody, validClientId } from "@/lib/community-api";

type PromptRow = { id: string; text: string; kind: string; created: number; likes: number; dislikes: number; vote: "up" | "down" | null };

export async function GET(request: Request) {
  const url = new URL(request.url);
  const clientId = url.searchParams.get("clientId");
  if (!validClientId(clientId)) return Response.json({ error: "A browser identity is required." }, { status: 400 });
  try {
    const result = await database().prepare(`
      SELECT p.id, p.text, p.kind, p.created,
        SUM(CASE WHEN v.vote = 'up' THEN 1 ELSE 0 END) AS likes,
        SUM(CASE WHEN v.vote = 'down' THEN 1 ELSE 0 END) AS dislikes,
        MAX(CASE WHEN v.client_id = ? THEN v.vote ELSE NULL END) AS vote
      FROM prompts p LEFT JOIN prompt_votes v ON v.prompt_id = p.id
      GROUP BY p.id ORDER BY p.created DESC LIMIT 100
    `).bind(clientId).all<PromptRow>();
    return Response.json({ prompts: result.results.map((row) => ({
      ...row,
      author: "Dreamer",
      mine: false,
      likes: row.likes || 0,
      dislikes: row.dislikes || 0,
    })) }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Community server unavailable.";
    return Response.json({ error: message }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const payload = await jsonBody<{ text?: unknown; kind?: unknown; clientId?: unknown }>(request);
  if (!payload) return Response.json({ error: "Send a valid intention." }, { status: 400 });
  const text = typeof payload.text === "string" ? payload.text.trim() : "";
  if (!validClientId(payload.clientId)) return Response.json({ error: "A browser identity is required." }, { status: 400 });
  if (!text || text.length > 120) return Response.json({ error: "Write an intention of up to 120 characters." }, { status: 400 });
  if (payload.kind !== "word" && payload.kind !== "phrase") return Response.json({ error: "Choose word or phrase." }, { status: 400 });
  try {
    if (!await allowWrite(request, "publish", 5)) return Response.json({ error: "Please wait a minute before sharing another intention." }, { status: 429 });
    const id = `p-${crypto.randomUUID()}`;
    const created = Date.now();
    await database().prepare("INSERT INTO prompts (id, text, kind, author_id, created) VALUES (?, ?, ?, ?, ?)")
      .bind(id, text, payload.kind, payload.clientId, created).run();
    return Response.json({ prompt: { id, text, kind: payload.kind, author: "You", mine: true, created, likes: 0, dislikes: 0, vote: null } }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not share this intention." }, { status: 503 });
  }
}
