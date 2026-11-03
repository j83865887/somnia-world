import { allowWrite, database, jsonBody, validClientId } from "@/lib/community-api";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = await jsonBody<{ clientId?: unknown; vote?: unknown }>(request);
  if (!payload || !validClientId(payload.clientId)) return Response.json({ error: "A browser identity is required." }, { status: 400 });
  if (payload.vote !== "up" && payload.vote !== "down" && payload.vote !== null) return Response.json({ error: "Choose like or dislike." }, { status: 400 });
  try {
    if (!await allowWrite(request, "vote", 60)) return Response.json({ error: "Please wait before voting again." }, { status: 429 });
    const db = database();
    if (!await db.prepare("SELECT id FROM prompts WHERE id = ?").bind(id).first()) return Response.json({ error: "That intention no longer exists." }, { status: 404 });
    if (payload.vote === null) await db.prepare("DELETE FROM prompt_votes WHERE prompt_id = ? AND client_id = ?").bind(id, payload.clientId).run();
    else await db.prepare(`
      INSERT INTO prompt_votes (prompt_id, client_id, vote) VALUES (?, ?, ?)
      ON CONFLICT(prompt_id, client_id) DO UPDATE SET vote = excluded.vote
    `).bind(id, payload.clientId, payload.vote).run();
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not record your vote." }, { status: 503 });
  }
}
