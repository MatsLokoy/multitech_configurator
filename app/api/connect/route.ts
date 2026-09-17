import { NextResponse } from "next/server";
import { login, whoami, MultitechApiError } from "@/lib/multitechClient";
import { setDeviceSession } from "@/lib/deviceSession";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { baseUrl, username, password } = (await request.json()) as {
    baseUrl?: string;
    username?: string;
    password?: string;
  };

  if (!baseUrl || !username || !password) {
    return NextResponse.json(
      { status: "fail", error: "IP/vertsnavn, brukernavn og passord er påkrevd" },
      { status: 400 }
    );
  }

  try {
    const session = await login(baseUrl, username, password);
    await setDeviceSession(session);
    const info = await whoami(session);
    return NextResponse.json({ status: "success", result: info.result });
  } catch (err) {
    const message = err instanceof MultitechApiError ? err.message : "Uventet feil ved tilkobling";
    const status = err instanceof MultitechApiError && err.code && err.code < 600 ? err.code : 502;
    return NextResponse.json({ status: "fail", error: message }, { status });
  }
}
