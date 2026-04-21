import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// POST /api/care-schedules/[id]/activate — Start Care Clock
// id = plant_id. Activates ALL suggested schedules for this plant.
// Body: { last_done: { care_type: ISO date string } } — optional per-type last action dates
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { env } = await getCloudflareContext({ async: true });
  const { id: plantId } = await params;

  const body = await req.json().catch(() => ({})) as { last_done?: Record<string, string> };
  const lastDone = body.last_done ?? {};

  // Fetch suggested schedules for this plant
  const { results: schedules } = await env.DB.prepare(
    "SELECT id, care_type, interval_days FROM care_schedules WHERE plant_id = ? AND status = 'suggested'"
  ).bind(plantId).all<{ id: number; care_type: string; interval_days: number }>();

  if (schedules.length === 0) return NextResponse.json({ ok: true, activated: 0 });

  const updates = schedules.map((s: { id: number; care_type: string; interval_days: number }) => {
    const lastDoneAt = lastDone[s.care_type]
      ? new Date(lastDone[s.care_type]).toISOString()
      : new Date().toISOString();
    const nextDueAt = new Date(
      new Date(lastDoneAt).getTime() + s.interval_days * 86400000
    ).toISOString();

    return env.DB.prepare(
      `UPDATE care_schedules SET status = 'active', last_done_at = ?, next_due_at = ? WHERE id = ?`
    ).bind(lastDoneAt, nextDueAt, s.id);
  });

  await env.DB.batch(updates);
  return NextResponse.json({ ok: true, activated: schedules.length });
}
