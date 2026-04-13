import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { env } = await getCloudflareContext({ async: true });
  const { id } = await params;

  const plant = await env.DB.prepare("SELECT * FROM plants WHERE id = ?").bind(id).first();
  if (!plant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [logs, schedules, photos] = await Promise.all([
    env.DB.prepare("SELECT * FROM care_logs WHERE plant_id = ? ORDER BY logged_at DESC LIMIT 20").bind(id).all(),
    env.DB.prepare("SELECT * FROM care_schedules WHERE plant_id = ?").bind(id).all(),
    env.DB.prepare("SELECT * FROM photos WHERE plant_id = ? ORDER BY taken_at DESC").bind(id).all(),
  ]);

  return NextResponse.json({ plant, logs: logs.results, schedules: schedules.results, photos: photos.results });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { env } = await getCloudflareContext({ async: true });
  const { id } = await params;
  const body = await req.json();

  const fields = ["name", "type", "species", "variety", "batch_size", "location", "date_started", "notes"];
  const updates = fields.filter((f) => f in body);
  if (updates.length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  const sql = `UPDATE plants SET ${updates.map((f) => `${f} = ?`).join(", ")}, updated_at = datetime('now') WHERE id = ?`;
  await env.DB.prepare(sql).bind(...updates.map((f) => body[f] ?? null), id).run();

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { env } = await getCloudflareContext({ async: true });
  const { id } = await params;

  await env.DB.prepare("DELETE FROM plants WHERE id = ?").bind(id).run();
  return NextResponse.json({ ok: true });
}
