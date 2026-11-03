import { allowWrite, database, jsonBody, validClientId } from "@/lib/community-api";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = await jsonBody<{ clientId?: unknown; reason?: unknown }>(request);
  if (!payload || !validClientId(payload.clientId)) return Response.json({ error: "A browser identity is required." }, { status: 400 });
  const reason = typeof payload.reason === "string" ? payload.reason.slice(0, 40) : "inappropriate";
  try {
    if (!await allowWrite(request, "report", 10)) return Response.json({ error: "Please wait before sending another report." }, { status: 429 });
    await database().prepare("INSERT OR IGNORE INTO prompt_reports (prompt_id, client_id, reason, created) VALUES (?, ?, ?, ?)")
      .bind(id, payload.clientId, reason, Date.now()).run();
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not report this intention." }, { status: 503 });
  }
}
