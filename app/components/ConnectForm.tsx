"use client";

import { useState } from "react";

export default function ConnectForm({ onConnected }: { onConnected: () => void }) {
  const [baseUrl, setBaseUrl] = useState("192.168.2.1");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl, username, password }),
      });
      const data = await res.json();
      if (!res.ok || data.status === "fail") {
        throw new Error(data.error ?? "Tilkobling feilet");
      }
      onConnected();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ukjent feil");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm">
      <div>
        <label className="block text-sm font-medium mb-1">IP-adresse / vertsnavn</label>
        <input
          className="w-full border rounded px-3 py-2 bg-transparent"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="192.168.2.1"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Brukernavn</label>
        <input
          className="w-full border rounded px-3 py-2 bg-transparent"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Passord</label>
        <input
          type="password"
          className="w-full border rounded px-3 py-2 bg-transparent"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded bg-foreground text-background px-4 py-2 font-medium disabled:opacity-50"
      >
        {loading ? "Kobler til..." : "Koble til"}
      </button>
    </form>
  );
}
