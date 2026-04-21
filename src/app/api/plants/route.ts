import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { generateCareSchedules } from "@/lib/claude";
import { getCurrentWeather } from "@/lib/weather";

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
  const { name, category, type, species, variety, batch_size, location, date_started, notes, pot_type, inner_pot, in_decorative_pot, soil_type } = body;

  if (!name || !type || !category) {
    return NextResponse.json({ error: "name, type, and category are required" }, { status: 400 });
  }

  const result = await env.DB.prepare(
    `INSERT INTO plants (name, category, type, species, variety, batch_size, location, date_started, notes, pot_type, inner_pot, in_decorative_pot, soil_type)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      name, category, type,
      species ?? null, variety ?? null, batch_size ?? 1,
      location ?? null, date_started ?? null, notes ?? null,
      pot_type ?? null, inner_pot ?? null, in_decorative_pot ? 1 : 0, soil_type ?? null
    )
    .run();

  const plantId = result.meta.last_row_id;

  if (env.ANTHROPIC_API_KEY) {
    try {
      // Fetch location + weather context
      const [latRow, lngRow, cityRow] = await Promise.all([
        env.DB.prepare("SELECT value FROM app_settings WHERE key = 'location_lat'").first<{ value: string }>(),
        env.DB.prepare("SELECT value FROM app_settings WHERE key = 'location_lng'").first<{ value: string }>(),
        env.DB.prepare("SELECT value FROM app_settings WHERE key = 'location_city'").first<{ value: string }>(),
      ]);

      let weather = null;
      if (latRow && lngRow) {
        weather = await getCurrentWeather(parseFloat(latRow.value), parseFloat(lngRow.value));
        if (weather && cityRow) weather.city = cityRow.value;
      }

      const careData = await generateCareSchedules(
        env.ANTHROPIC_API_KEY,
        {
          name,
          species: species ?? null,
          variety: variety ?? null,
          category,
          type,
          pot_type: pot_type ?? null,
          inner_pot: inner_pot ?? null,
          in_decorative_pot: !!in_decorative_pot,
          soil_type: soil_type ?? null,
        },
        weather
      );

      const inserts = careData.schedules.map((s) =>
        env.DB.prepare(
          `INSERT INTO care_schedules (plant_id, care_type, interval_days, status, source, ai_care_note)
           VALUES (?, ?, ?, 'suggested', 'ai', ?)`
        ).bind(plantId, s.care_type, s.interval_days, s.ai_care_note)
      );

      if (inserts.length > 0) {
        await env.DB.batch(inserts);
      }
    } catch (err) {
      console.error("Care schedule generation failed:", err);
    }
  }

  return NextResponse.json({ id: plantId }, { status: 201 });
}
