import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { generateCareSchedules } from "@/lib/claude";

export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true });
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  let query = "SELECT * FROM plants ORDER BY name ASC";
  const params: string[] = [];

  if (category) {
    query = "SELECT * FROM plants WHERE category = ? ORDER BY name ASC";
    params.push(category);
  }

  const { results } = await env.DB.prepare(query).bind(...params).all();
  return NextResponse.json(results);
}

export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true });
  const body = await req.json();
  const { name, category, type, species, variety, batch_size, location, date_started, notes } = body;

  if (!name || !type || !category) {
    return NextResponse.json({ error: "name, type, and category are required" }, { status: 400 });
  }

  const result = await env.DB.prepare(
    `INSERT INTO plants (name, category, type, species, variety, batch_size, location, date_started, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(name, category, type, species ?? null, variety ?? null, batch_size ?? 1, location ?? null, date_started ?? null, notes ?? null)
    .run();

  const plantId = result.meta.last_row_id;

  // Generate AI care schedules in the background — don't block the response
  if (env.ANTHROPIC_API_KEY) {
    try {
      const careData = await generateCareSchedules(env.ANTHROPIC_API_KEY, {
        name,
        species: species ?? null,
        variety: variety ?? null,
        category,
        type,
      });

      const inserts = careData.schedules.map((s) =>
        env.DB.prepare(
          `INSERT INTO care_schedules (plant_id, care_type, interval_days, status, source, ai_care_note)
           VALUES (?, ?, ?, 'suggested', 'ai', ?)`
        ).bind(plantId, s.care_type, s.interval_days, s.ai_care_note)
      );

      if (inserts.length > 0) {
        await env.DB.batch(inserts);
      }
    } catch {
      // Don't fail the plant creation if AI schedule generation fails
    }
  }

  return NextResponse.json({ id: plantId }, { status: 201 });
}
