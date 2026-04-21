import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getLightProfile } from "@/lib/sunlight";

// GET /api/spaces/light-profile?direction=S&obstruction=open
export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true });
  const { searchParams } = new URL(req.url);
  const direction = searchParams.get("direction");
  const obstruction = searchParams.get("obstruction");

  if (!direction || !obstruction) {
    return NextResponse.json({ error: "direction and obstruction required" }, { status: 400 });
  }

  const [latRow, lngRow] = await Promise.all([
    env.DB.prepare("SELECT value FROM app_settings WHERE key = 'location_lat'").first<{ value: string }>(),
    env.DB.prepare("SELECT value FROM app_settings WHERE key = 'location_lng'").first<{ value: string }>(),
  ]);

  if (!latRow || !lngRow) {
    return NextResponse.json({ error: "Location not set — add your city in Settings first" }, { status: 400 });
  }

  const profile = await getLightProfile(
    parseFloat(latRow.value),
    parseFloat(lngRow.value),
    direction,
    obstruction
  );

  if (!profile) {
    return NextResponse.json({ error: "Could not fetch light data" }, { status: 500 });
  }

  return NextResponse.json(profile);
}
