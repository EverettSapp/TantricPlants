import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

type Space = {
  id: number;
  name: string;
  space_type: string;
  direction: string | null;
  obstruction: string | null;
  humidity: string | null;
  near_vent: number;
  near_radiator: number;
  notes: string | null;
};

export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true });

  if (!env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const body = await req.json() as { name: string; species?: string; category: string };

  // Fetch all defined indoor spaces
  const { results: spaces } = await env.DB.prepare(
    "SELECT * FROM indoor_spaces ORDER BY space_type, name"
  ).all<Space>();

  // Fetch location city for context
  const cityRow = await env.DB.prepare(
    "SELECT value FROM app_settings WHERE key = 'location_city'"
  ).first<{ value: string }>();

  const spaceSummary = spaces.length
    ? spaces.map((s: Space) => {
        const parts = [
          `"${s.name}" (${s.space_type}`,
          s.direction ? `, ${s.direction}-facing` : "",
          s.obstruction ? `, ${s.obstruction}` : "",
          s.humidity ? `, ${s.humidity} humidity` : "",
          s.near_vent ? ", near vent" : "",
          s.near_radiator ? ", near radiator" : "",
          ")",
          s.notes ? ` — ${s.notes}` : "",
        ].join("");
        return `- ${parts}`;
      }).join("\n")
    : "No spaces defined yet.";

  const locationCtx = cityRow ? `Location: ${cityRow.value}` : "";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{
        role: "user",
        content: `You are a plant placement expert. Given a plant and the user's available spaces, recommend the best spot.

Plant: ${body.name}${body.species ? ` (${body.species})` : ""} — ${body.category}
${locationCtx}

Available spaces:
${spaceSummary}

Return ONLY valid JSON (no markdown):
{
  "recommended_space_id": <id or null if none fit>,
  "recommended_space_name": "<name or null>",
  "reason": "<1-2 sentence explanation>",
  "ideal_conditions": "<brief description of what this plant needs>"
}`,
      }],
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }

  const json = await res.json() as { content: { type: string; text: string }[] };
  let text = json.content[0]?.type === "text" ? json.content[0].text : "";
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();

  try {
    return NextResponse.json(JSON.parse(text));
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
  }
}
