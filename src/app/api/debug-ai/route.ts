import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { generateCareSchedules } from "@/lib/claude";

export async function GET() {
  const { env } = await getCloudflareContext({ async: true });

  if (!env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 });
  }

  try {
    const result = await generateCareSchedules(env.ANTHROPIC_API_KEY, {
      name: "Monstera",
      species: "Monstera deliciosa",
      variety: null,
      category: "indoor",
      type: "indoor",
    });
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
