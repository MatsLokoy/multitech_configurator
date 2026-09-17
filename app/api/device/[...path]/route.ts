import { NextResponse } from "next/server";
import { deviceRequest, MultitechApiError } from "@/lib/multitechClient";
import { getDeviceSession } from "@/lib/deviceSession";

export const runtime = "nodejs";

async function handle(request: Request, ctx: RouteContext<"/api/device/[...path]">, method: string) {
  const session = await getDeviceSession();
  if (!session) {
    return NextResponse.json({ status: "fail", error: "Ikke tilkoblet noen enhet" }, { status: 401 });
  }

  const { path } = await ctx.params;
  const devicePath = path.join("/");

  let body: unknown;
  if (method === "POST" || method === "PUT") {
    try {
      body = await request.json();
    } catch {
      body = undefined;
    }
  }

  try {
    const result = await deviceRequest(session, method, devicePath, body);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof MultitechApiError ? err.message : "Uventet feil mot enheten";
    const status = err instanceof MultitechApiError && err.code && err.code < 600 ? err.code : 502;
    return NextResponse.json({ status: "fail", error: message }, { status });
  }
}

export async function GET(request: Request, ctx: RouteContext<"/api/device/[...path]">) {
  return handle(request, ctx, "GET");
}

export async function POST(request: Request, ctx: RouteContext<"/api/device/[...path]">) {
  return handle(request, ctx, "POST");
}

export async function PUT(request: Request, ctx: RouteContext<"/api/device/[...path]">) {
  return handle(request, ctx, "PUT");
}

export async function DELETE(request: Request, ctx: RouteContext<"/api/device/[...path]">) {
  return handle(request, ctx, "DELETE");
}
