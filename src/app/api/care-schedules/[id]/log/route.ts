import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

type HealthStatus = "thriving" | "good" | "stressed" | "dormant";

const HEALTH_MULTIPLIERS: Record<HealthStatus, number> = {
  thriving: 1,
  good: 1,
  stressed: 0.75,  // more frequent care
  dormant: 2,      // less frequent care
};

const OBSERVATION_ADJUSTMENTS: Record<string, Record<string, number>> = {
  water: {
    soil_wet: 3,    // push watering out +3 days
    soil_dry: -2,   // pull watering in -2 days
  },
};

// POST /api/care-schedules/[id]/log — Log with observations, then complete
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { env } = await getCloudflareContext({ async: true });
  const { id } = await params;
  const body = await req.json() as {
    observations?: string[];
    notes?: string;
    health_status?: HealthStatus;
  };

  const schedule = await env.DB.prepare(
    "SELECT * FROM care_schedules WHERE id = ?"
  ).bind(id).first<{ id: number; plant_id: number; care_type: string; interval_days: number }>();

  if (!schedule) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const observations: string[] = body.observations ?? [];
  const healthStatus: HealthStatus = body.health_status ?? "good";
  const notes: string | null = body.notes ?? null;

  // Calculate adjusted interval
  let adjustedDays = schedule.interval_days;

  // Apply health status multiplier
  adjustedDays = Math.round(adjustedDays * HEALTH_MULTIPLIERS[healthStatus]);

  // Apply observation adjustments for this care type
  const obsAdjustments = OBSERVATION_ADJUSTMENTS[schedule.care_type] ?? {};
  for (const obs of observations) {
    if (obsAdjustments[obs] !== undefined) {
      adjustedDays += obsAdjustments[obs];
    }
  }

  adjustedDays = Math.max(1, adjustedDays); // never less than 1 day

  const now = new Date().toISOString();
  const nextDue = new Date(Date.now() + adjustedDays * 86400000).toISOString();

  await env.DB.batch([
    // Log the care event with observations
    env.DB.prepare(
      `INSERT INTO care_logs (plant_id, care_type, notes, observations, health_status, logged_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`
    ).bind(
      schedule.plant_id,
      schedule.care_type,
      notes,
      observations.length > 0 ? JSON.stringify(observations) : null,
      body.health_status ?? null
    ),
    // Reset schedule timer with adjusted next due
    env.DB.prepare(
      `UPDATE care_schedules SET last_done_at = ?, next_due_at = ? WHERE id = ?`
    ).bind(now, nextDue, id),
    // Update plant health status if provided
    ...(body.health_status
      ? [env.DB.prepare(
          `UPDATE plants SET health_status = ?, updated_at = datetime('now') WHERE id = ?`
        ).bind(body.health_status, schedule.plant_id)]
      : []),
  ]);

  return NextResponse.json({ ok: true, next_due_at: nextDue, adjusted_days: adjustedDays });
}
