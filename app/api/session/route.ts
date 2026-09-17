import { NextResponse } from "next/server";
import { whoami, MultitechApiError } from "@/lib/multitechClient";
import { getDeviceSession, clearDeviceSession } from "@/lib/deviceSession";

export const runtime = "nodejs";

export async function GET() {
  const session = await getDeviceSession();
  if (!session) {
    return NextResponse.json({ connected: false });
  }

  try {
    const info = await whoami(session);
    return NextResponse.json({ connected: true, baseUrl: session.baseUrl, result: info.result });
  } catch (err) {
    // Tokenet er ikke lenger gyldig (utløpt, enheten restartet, e.l.)
    await clearDeviceSession();
    const message = err instanceof MultitechApiError ? err.message : "Sesjonen er ikke lenger gyldig";
    return NextResponse.json({ connected: false, error: message });
  }
}
