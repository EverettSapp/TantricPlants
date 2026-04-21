import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET() {
  const { env } = await getCloudflareContext({ async: true });
  const { results } = await env.DB.prepare(
    "SELECT * FROM indoor_spaces ORDER BY space_type ASC, name ASC"
  ).all();
  return NextResponse.json(results);
}

export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true });
  const body = await req.json() as {
    name: string;
    space_type: string;
    direction?: string;
    obstruction?: string;
    humidity?: string;
    near_vent?: boolean;
    near_radiator?: boolean;
    notes?: string;
  };

  if (!body.name || !body.space_type) {
    return NextResponse.json({ error: "name and space_type are required" }, { status: 400 });
  }

  const result = await env.DB.prepare(
    `INSERT INTO indoor_spaces (name, space_type, direction, obstruction, humidity, near_vent, near_radiator, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    body.name,
    body.space_type,
    body.direction ?? null,
    body.obstruction ?? null,
    body.humidity ?? null,
    body.near_vent ? 1 : 0,
    body.near_radiator ? 1 : 0,
    body.notes ?? null
  ).run();

  return NextResponse.json({ id: result.meta.last_row_id }, { status: 201 });
}
