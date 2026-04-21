import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// GET /api/care — dashboard data ordered by next_due_at
export async function GET() {
  const { env } = await getCloudflareContext({ async: true });

  // Active schedules joined with plant info, ordered by next_due_at
  const { results: active } = await env.DB.prepare(`
    SELECT
      cs.id,
      cs.plant_id,
      cs.care_type,
      cs.interval_days,
      cs.last_done_at,
      cs.next_due_at,
      cs.ai_care_note,
      p.name AS plant_name,
      p.category,
      p.health_status
    FROM care_schedules cs
    JOIN plants p ON p.id = cs.plant_id
    WHERE cs.status = 'active'
    ORDER BY cs.next_due_at ASC NULLS FIRST
  `).all();

  // Suggested (not yet started) schedules grouped by plant
  const { results: suggested } = await env.DB.prepare(`
    SELECT
      cs.id,
      cs.plant_id,
      cs.care_type,
      cs.interval_days,
      cs.ai_care_note,
      cs.source,
      p.name AS plant_name,
      p.category,
      p.health_status
    FROM care_schedules cs
    JOIN plants p ON p.id = cs.plant_id
    WHERE cs.status = 'suggested'
    ORDER BY p.name ASC, cs.care_type ASC
  `).all();

  // Recent care logs — last 30 entries across all plants
  const { results: recentLogs } = await env.DB.prepare(`
    SELECT
      cl.id,
      cl.plant_id,
      cl.care_type,
      cl.notes,
      cl.observations,
      cl.health_status,
      cl.logged_at,
      p.name AS plant_name
    FROM care_logs cl
    JOIN plants p ON p.id = cl.plant_id
    ORDER BY cl.logged_at DESC
    LIMIT 30
  `).all();

  return NextResponse.json({ active, suggested, recentLogs });
}
