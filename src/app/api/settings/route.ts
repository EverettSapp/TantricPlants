import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { geocodeCity } from "@/lib/weather";

export async function GET() {
  const { env } = await getCloudflareContext({ async: true });
  const { results } = await env.DB.prepare("SELECT key, value FROM app_settings").all<{ key: string; value: string }>();
  const settings: Record<string, string> = {};
  for (const row of results) settings[row.key] = row.value;
  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true });
  const body = await req.json() as { location_city?: string };

  if (body.location_city) {
    const geo = await geocodeCity(body.location_city);
    if (!geo) {
      return NextResponse.json({ error: "City not found. Try a more specific name." }, { status: 400 });
    }

    await env.DB.batch([
      env.DB.prepare("INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('location_city', ?, datetime('now'))").bind(geo.display_name),
      env.DB.prepare("INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('location_lat', ?, datetime('now'))").bind(String(geo.lat)),
      env.DB.prepare("INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES ('location_lng', ?, datetime('now'))").bind(String(geo.lng)),
    ]);

    return NextResponse.json({ ok: true, city: geo.display_name, lat: geo.lat, lng: geo.lng });
  }

  return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
}
