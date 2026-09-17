import { Agent, fetch as undiciFetch } from "undici";

/**
 * MultiTech Conduit/rCell devices on the LAN present a self-signed
 * certificate. This dispatcher is only ever used for calls to those
 * devices - it is never installed as the global fetch dispatcher, so it
 * has no effect on any other outgoing request made by this app.
 */
const insecureDeviceAgent = new Agent({ connect: { rejectUnauthorized: false } });

export interface DeviceSession {
  baseUrl: string; // e.g. https://192.168.2.1/api
  token: string;
}

export class MultitechApiError extends Error {
  code?: number;

  constructor(message: string, code?: number) {
    super(message);
    this.name = "MultitechApiError";
    this.code = code;
  }
}

function normalizeBaseUrl(input: string): string {
  let url = input.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  url = url.replace(/\/+$/, "");
  if (!url.endsWith("/api")) {
    url = `${url}/api`;
  }
  return url;
}

function describeNetworkError(err: unknown): string {
  // undici's fetch wraps the real network error (ECONNREFUSED, ETIMEDOUT, cert errors, ...)
  // in a generic "fetch failed" TypeError with the actual cause nested underneath.
  let current: unknown = err;
  while (current instanceof Error) {
    if (current.message && current.message !== "fetch failed") return current.message;
    current = (current as { cause?: unknown }).cause;
  }
  return err instanceof Error ? err.message : String(err);
}

async function deviceFetch(url: string, init: RequestInit = {}) {
  let res: Response;
  try {
    res = (await undiciFetch(url, {
      ...init,
      dispatcher: insecureDeviceAgent,
    } as never)) as unknown as Response;
  } catch (cause) {
    throw new MultitechApiError(`Fikk ikke kontakt med enheten (${describeNetworkError(cause)})`);
  }

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    throw new MultitechApiError(`Enheten svarte med ugyldig JSON (HTTP ${res.status})`, res.status);
  }

  const parsed = body as { code?: number; status?: string; error?: string; result?: unknown };
  if (!res.ok || parsed?.status === "fail") {
    throw new MultitechApiError(parsed?.error ?? `Forespørsel feilet (HTTP ${res.status})`, parsed?.code ?? res.status);
  }

  return parsed;
}

export async function login(baseUrlInput: string, username: string, password: string): Promise<DeviceSession> {
  const baseUrl = normalizeBaseUrl(baseUrlInput);
  const url = `${baseUrl}/login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
  const body = await deviceFetch(url, { method: "GET" });
  const result = body.result as { token?: string } | undefined;
  const token = result?.token;
  if (!token) {
    throw new MultitechApiError("Enheten godtok forespørselen, men returnerte ikke noe token");
  }
  return { baseUrl, token };
}

export async function logout(session: DeviceSession): Promise<void> {
  const url = `${session.baseUrl}/logout?token=${encodeURIComponent(session.token)}`;
  await deviceFetch(url, { method: "GET" }).catch(() => {
    // Beste-innsats: enheten kan allerede ha utløpt tokenet.
  });
}

export async function whoami(session: DeviceSession) {
  return deviceRequest(session, "GET", "whoami");
}

export async function deviceRequest(
  session: DeviceSession,
  method: string,
  path: string,
  body?: unknown
) {
  const cleanPath = path.replace(/^\/+/, "");
  const url = new URL(`${session.baseUrl}/${cleanPath}`);
  url.searchParams.set("token", session.token);

  const init: RequestInit = { method };
  if (body !== undefined) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(body);
  }

  return deviceFetch(url.toString(), init);
}
