import { allowWrite, database, jsonBody, validClientId } from "@/lib/community-api";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = await jsonBody<{ clientId?: unknown }>(request);
  if (!payload || !validClientId(payload.clientId)) return Response.json({ error: "A browser identity is required." }, { status: 400 });
  try {
    if (!await allowWrite(request, "delete", 10)) return Response.json({ error: "Please wait before trying again." }, { status: 429 });
    const db = database();
    const prompt = await db.prepare("SELECT id FROM prompts WHERE id = ? AND author_id = ?").bind(id, payload.clientId).first();
    if (!prompt) return Response.json({ error: "You can only remove your own intention." }, { status: 404 });
    await db.batch([
      db.prepare("DELETE FROM prompt_votes WHERE prompt_id = ?").bind(id),
      db.prepare("DELETE FROM prompt_reports WHERE prompt_id = ?").bind(id),
      db.prepare("DELETE FROM prompts WHERE id = ? AND author_id = ?").bind(id, payload.clientId),
    ]);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not remove the intention." }, { status: 503 });
  }
}
