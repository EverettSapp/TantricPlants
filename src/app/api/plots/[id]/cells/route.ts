import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { env } = await getCloudflareContext({ async: true });
  const { id } = await params;
  const { row_idx, col_idx, plant_id, label, notes } = await req.json();

  if (row_idx === undefined || col_idx === undefined) {
    return NextResponse.json({ error: "row_idx and col_idx required" }, { status: 400 });
  }

  // Clear cell if no plant_id and no label
  if (!plant_id && !label) {
    await env.DB.prepare(
      "DELETE FROM plot_cells WHERE plot_id = ? AND row_idx = ? AND col_idx = ?"
    ).bind(id, row_idx, col_idx).run();
    return NextResponse.json({ ok: true });
  }

  await env.DB.prepare(`
    INSERT INTO plot_cells (plot_id, row_idx, col_idx, plant_id, label, notes, planted_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(plot_id, row_idx, col_idx) DO UPDATE SET
      plant_id = excluded.plant_id,
      label = excluded.label,
      notes = excluded.notes,
      planted_at = datetime('now')
  `).bind(id, row_idx, col_idx, plant_id ?? null, label ?? null, notes ?? null).run();

  return NextResponse.json({ ok: true });
}
