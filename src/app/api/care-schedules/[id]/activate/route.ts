import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// POST /api/care-schedules/[id]/activate — Start Care Clock
// Activates ALL suggested schedules for this plant at once (id = plant_id here)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { env } = await getCloudflareContext({ async: true });
  const { id: plantId } = await params;

  // Set all suggested schedules for this plant to active, starting the clock now
  await env.DB.prepare(`
    UPDATE care_schedules
    SET
      status = 'active',
      last_done_at = datetime('now'),
      next_due_at = datetime('now', '+' || interval_days || ' days')
    WHERE plant_id = ? AND status = 'suggested'
  `).bind(plantId).run();

  return NextResponse.json({ ok: true });
}
