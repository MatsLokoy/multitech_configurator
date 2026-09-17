"use client";

import { useState } from "react";

const SUGGESTED_ENDPOINTS = [
  "whoami",
  "devices",
  "lan",
  "wifi",
  "ppp",
  "firewall",
  "gps",
  "lora",
  "loranetwork",
  "apps",
  "sms",
];

type DeviceInfo = {
  user?: string;
  permission?: string;
  address?: string;
  [key: string]: unknown;
};

export default function Dashboard({
  baseUrl,
  whoami,
  onDisconnected,
}: {
  baseUrl: string;
  whoami: DeviceInfo;
  onDisconnected: () => void;
}) {
  const [path, setPath] = useState("whoami");
  const [method, setMethod] = useState<"GET" | "PUT" | "POST" | "DELETE">("GET");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<unknown>(null);

  async function sendRequest(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const init: RequestInit = { method };
      if (method === "PUT" || method === "POST") {
        init.headers = { "Content-Type": "application/json" };
        init.body = body.trim() ? body : "{}";
      }
      const res = await fetch(`/api/device/${path.replace(/^\/+/, "")}`, init);
      const data = await res.json();
      if (!res.ok || data.status === "fail") {
        throw new Error(data.error ?? "Forespørsel feilet");
      }
      setResponse(data.result ?? data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ukjent feil");
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    await fetch("/api/disconnect", { method: "POST" });
    onDisconnected();
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center justify-between border rounded px-4 py-3">
        <div>
          <p className="font-medium">{baseUrl}</p>
          <p className="text-sm opacity-70">
            Logget inn som {whoami.user ?? "?"} ({whoami.permission ?? "ukjent rolle"})
          </p>
        </div>
        <button onClick={handleDisconnect} className="text-sm underline">
          Koble fra
        </button>
      </div>

      <form onSubmit={sendRequest} className="flex flex-col gap-3 border rounded px-4 py-4">
        <p className="text-sm font-medium">Endepunkt-utforsker</p>
        <div className="flex gap-2">
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as typeof method)}
            className="border rounded px-2 py-2 bg-transparent"
          >
            <option value="GET">GET</option>
            <option value="PUT">PUT</option>
            <option value="POST">POST</option>
            <option value="DELETE">DELETE</option>
          </select>
          <input
            className="flex-1 border rounded px-3 py-2 bg-transparent"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="f.eks. lora"
            list="suggested-endpoints"
            required
          />
          <datalist id="suggested-endpoints">
            {SUGGESTED_ENDPOINTS.map((ep) => (
              <option key={ep} value={ep} />
            ))}
          </datalist>
        </div>

        {(method === "PUT" || method === "POST") && (
          <textarea
            className="w-full border rounded px-3 py-2 font-mono text-sm bg-transparent"
            rows={4}
            placeholder='{"enabled": true}'
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        )}

        <button
          type="submit"
          disabled={loading}
          className="self-start rounded bg-foreground text-background px-4 py-2 font-medium disabled:opacity-50"
        >
          {loading ? "Sender..." : "Send"}
        </button>
      </form>

      {error && (
        <div className="border border-red-400 rounded px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {response !== null && (
        <pre className="border rounded px-4 py-3 text-sm overflow-auto bg-black/5 dark:bg-white/5">
          {JSON.stringify(response, null, 2)}
        </pre>
      )}
    </div>
  );
}
