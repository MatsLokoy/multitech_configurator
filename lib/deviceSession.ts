import { cookies } from "next/headers";
import type { DeviceSession } from "./multitechClient";

const BASE_URL_COOKIE = "mtc_base_url";
const TOKEN_COOKIE = "mtc_token";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export async function setDeviceSession(session: DeviceSession): Promise<void> {
  const store = await cookies();
  store.set(BASE_URL_COOKIE, session.baseUrl, cookieOptions);
  store.set(TOKEN_COOKIE, session.token, cookieOptions);
}

export async function getDeviceSession(): Promise<DeviceSession | null> {
  const store = await cookies();
  const baseUrl = store.get(BASE_URL_COOKIE)?.value;
  const token = store.get(TOKEN_COOKIE)?.value;
  if (!baseUrl || !token) return null;
  return { baseUrl, token };
}

export async function clearDeviceSession(): Promise<void> {
  const store = await cookies();
  store.delete(BASE_URL_COOKIE);
  store.delete(TOKEN_COOKIE);
}
