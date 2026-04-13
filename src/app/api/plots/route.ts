import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET() {
  const { env } = await getCloudflareContext({ async: true });
  const { results } = await env.DB.prepare("SELECT * FROM plots ORDER BY created_at DESC").all();
  return NextResponse.json(results);
}

export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true });
  const body = await req.json();
  const {
    name, plot_type,
    tray_rows, tray_cols,
    length_ft, width_ft, height_in,
    soil_type, sun_exposure, irrigation, irrigation_type, notes,
  } = body;

  if (!name || !plot_type) {
    return NextResponse.json({ error: "name and plot_type required" }, { status: 400 });
  }

  const result = await env.DB.prepare(`
    INSERT INTO plots (name, plot_type, tray_rows, tray_cols, length_ft, width_ft, height_in, soil_type, sun_exposure, irrigation, irrigation_type, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    name, plot_type,
    tray_rows ?? null, tray_cols ?? null,
    length_ft ?? null, width_ft ?? null, height_in ?? null,
    soil_type ?? null, sun_exposure ?? null,
    irrigation ? 1 : 0, irrigation_type ?? null,
    notes ?? null,
  ).run();

  return NextResponse.json({ id: result.meta.last_row_id }, { status: 201 });
}
