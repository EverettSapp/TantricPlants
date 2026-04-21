import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { env } = await getCloudflareContext({ async: true });
  const { id } = await params;
  await env.DB.prepare("DELETE FROM indoor_spaces WHERE id = ?").bind(id).run();
  return NextResponse.json({ ok: true });
}
