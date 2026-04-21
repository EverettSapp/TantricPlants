export type CareType = "water" | "fertilize" | "mist" | "repot" | "prune";

export interface SuggestedSchedule {
  care_type: CareType;
  interval_days: number;
  ai_care_note: string;
}

export interface CareScheduleResponse {
  schedules: SuggestedSchedule[];
  plant_summary: string;
}

export async function generateCareSchedules(
  apiKey: string,
  plant: { name: string; species?: string | null; variety?: string | null; category: string; type: string }
): Promise<CareScheduleResponse> {
  const plantDesc = [
    plant.name,
    plant.species && plant.species !== plant.name ? `(${plant.species})` : null,
    plant.variety ? `— variety: ${plant.variety}` : null,
    `— ${plant.category} plant`,
  ]
    .filter(Boolean)
    .join(" ");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `You are a plant care expert. Given a plant, return a JSON care schedule.

Plant: ${plantDesc}

Return ONLY valid JSON in this exact shape (no markdown, no explanation):
{
  "schedules": [
    { "care_type": "water", "interval_days": 7, "ai_care_note": "brief tip" },
    { "care_type": "fertilize", "interval_days": 30, "ai_care_note": "brief tip" }
  ],
  "plant_summary": "1-2 sentence care overview"
}

Rules:
- Only include care types that apply: water, fertilize, mist, repot, prune
- interval_days must be realistic for this specific plant
- ai_care_note max 80 characters
- plant_summary max 120 characters
- Omit care types that don't apply (e.g. most plants don't need misting)`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }

  const json = await res.json() as { content: { type: string; text: string }[] };
  const text = json.content[0]?.type === "text" ? json.content[0].text : "";
  return JSON.parse(text) as CareScheduleResponse;
}
