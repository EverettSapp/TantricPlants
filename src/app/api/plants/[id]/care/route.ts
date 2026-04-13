import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { env } = await getCloudflareContext({ async: true });
  const { id } = await params;
  const { care_type, notes } = await req.json();

  if (!care_type) return NextResponse.json({ error: "care_type required" }, { status: 400 });

  await env.DB.prepare(
    "INSERT INTO care_logs (plant_id, care_type, notes) VALUES (?, ?, ?)"
  ).bind(id, care_type, notes ?? null).run();

  // Update last_done_at on the matching schedule if one exists
  await env.DB.prepare(
    `UPDATE care_schedules SET last_done_at = datetime('now'),
     next_due_at = datetime('now', '+' || interval_days || ' days')
     WHERE plant_id = ? AND care_type = ?`
  ).bind(id, care_type).run();

  return NextResponse.json({ ok: true }, { status: 201 });
}
