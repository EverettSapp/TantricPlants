import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { env } = await getCloudflareContext({ async: true });
  const { id } = await params;

  const plot = await env.DB.prepare("SELECT * FROM plots WHERE id = ?").bind(id).first();
  if (!plot) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { results: cells } = await env.DB.prepare(`
    SELECT pc.*, p.name as plant_name, p.type as plant_type, p.variety as plant_variety
    FROM plot_cells pc
    LEFT JOIN plants p ON pc.plant_id = p.id
    WHERE pc.plot_id = ?
  `).bind(id).all();

  return NextResponse.json({ plot, cells });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { env } = await getCloudflareContext({ async: true });
  const { id } = await params;
  const body = await req.json();

  const fields = ["name", "plot_type", "tray_rows", "tray_cols", "length_ft", "width_ft", "height_in", "soil_type", "sun_exposure", "irrigation", "irrigation_type", "notes"];
  const updates = fields.filter((f) => f in body);
  if (updates.length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  const sql = `UPDATE plots SET ${updates.map((f) => `${f} = ?`).join(", ")} WHERE id = ?`;
  await env.DB.prepare(sql).bind(...updates.map((f) => body[f] ?? null), id).run();
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { env } = await getCloudflareContext({ async: true });
  const { id } = await params;
  await env.DB.prepare("DELETE FROM plots WHERE id = ?").bind(id).run();
  return NextResponse.json({ ok: true });
}
