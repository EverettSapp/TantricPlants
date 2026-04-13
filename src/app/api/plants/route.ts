import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true });
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  let query = "SELECT * FROM plants ORDER BY name ASC";
  const params: string[] = [];

  if (category) {
    query = "SELECT * FROM plants WHERE category = ? ORDER BY name ASC";
    params.push(category);
  }

  const { results } = await env.DB.prepare(query).bind(...params).all();
  return NextResponse.json(results);
}

export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true });
  const body = await req.json();
  const { name, category, type, species, variety, batch_size, location, date_started, notes } = body;

  if (!name || !type || !category) {
    return NextResponse.json({ error: "name, type, and category are required" }, { status: 400 });
  }

  const result = await env.DB.prepare(
    `INSERT INTO plants (name, category, type, species, variety, batch_size, location, date_started, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(name, category, type, species ?? null, variety ?? null, batch_size ?? 1, location ?? null, date_started ?? null, notes ?? null)
    .run();

  return NextResponse.json({ id: result.meta.last_row_id }, { status: 201 });
}
