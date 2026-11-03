import { env } from "cloudflare:workers";

export function GET() {
  return Response.json({
    aiAvailable: Boolean(env.OPENAI_API_KEY),
    communityAvailable: Boolean(env.DB),
    localVoices: [],
  }, { headers: { "cache-control": "no-store" } });
}
