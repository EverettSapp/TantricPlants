import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// POST /api/care-schedules/[id]/complete — Quick complete, all good assumed
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { env } = await getCloudflareContext({ async: true });
  const { id } = await params;

  const schedule = await env.DB.prepare(
    "SELECT * FROM care_schedules WHERE id = ?"
  ).bind(id).first<{ id: number; plant_id: number; care_type: string; interval_days: number }>();

  if (!schedule) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const now = new Date().toISOString();
  const nextDue = new Date(Date.now() + schedule.interval_days * 86400000).toISOString();

  await env.DB.batch([
    // Log the care event
    env.DB.prepare(
      `INSERT INTO care_logs (plant_id, care_type, logged_at) VALUES (?, ?, datetime('now'))`
    ).bind(schedule.plant_id, schedule.care_type),
    // Reset the schedule timer
    env.DB.prepare(
      `UPDATE care_schedules SET last_done_at = ?, next_due_at = ? WHERE id = ?`
    ).bind(now, nextDue, id),
  ]);

  return NextResponse.json({ ok: true, next_due_at: nextDue });
}
