import { NextResponse } from "next/server";
import { commissioningStatus, MultitechApiError } from "@/lib/multitechClient";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { baseUrl } = (await request.json()) as { baseUrl?: string };
  if (!baseUrl) {
    return NextResponse.json({ error: "IP-adresse / vertsnavn er påkrevd" }, { status: 400 });
  }

  try {
    const { active, raw } = await commissioningStatus(baseUrl);
    return NextResponse.json({ commissioningActive: active, raw });
  } catch (err) {
    const message = err instanceof MultitechApiError ? err.message : "Uventet feil ved sjekk av enheten";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
