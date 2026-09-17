import { NextResponse } from "next/server";
import { commissioningStep, MultitechApiError } from "@/lib/multitechClient";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { baseUrl, username, aasID, aasAnswer } = (await request.json()) as {
    baseUrl?: string;
    username?: string;
    aasID?: string;
    aasAnswer?: string;
  };

  if (!baseUrl || !username || aasID === undefined || aasAnswer === undefined) {
    return NextResponse.json({ error: "Mangler felt i forespørselen" }, { status: 400 });
  }

  try {
    const result = await commissioningStep(baseUrl, { username, aasID, aasAnswer });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof MultitechApiError ? err.message : "Uventet feil mot enheten";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
