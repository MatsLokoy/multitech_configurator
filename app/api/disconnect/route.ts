import { NextResponse } from "next/server";
import { logout } from "@/lib/multitechClient";
import { getDeviceSession, clearDeviceSession } from "@/lib/deviceSession";

export const runtime = "nodejs";

export async function POST() {
  const session = await getDeviceSession();
  if (session) {
    await logout(session);
  }
  await clearDeviceSession();
  return NextResponse.json({ status: "success" });
}
