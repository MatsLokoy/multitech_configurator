"use client";

import { useState } from "react";
import CommissionForm from "./CommissionForm";
import ConnectForm from "./ConnectForm";

type Phase =
  | { step: "address" }
  | { step: "checking" }
  | { step: "commission"; baseUrl: string }
  | { step: "login"; baseUrl: string };

export default function ConnectFlow({ onConnected }: { onConnected: () => void }) {
  const [baseUrl, setBaseUrl] = useState("192.168.2.1");
  const [phase, setPhase] = useState<Phase>({ step: "address" });
  const [error, setError] = useState<string | null>(null);

  async function checkAddress(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPhase({ step: "checking" });
    try {
      const res = await fetch("/api/commissioning/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Klarte ikke å sjekke enheten");
      }
      setPhase(data.commissioningActive ? { step: "commission", baseUrl } : { step: "login", baseUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ukjent feil");
      setPhase({ step: "address" });
    }
  }

  function reset() {
    setError(null);
    setPhase({ step: "address" });
  }

  if (phase.step === "commission") {
    return <CommissionForm baseUrl={phase.baseUrl} onBack={reset} onCommissioned={onConnected} />;
  }

  if (phase.step === "login") {
    return <ConnectForm initialBaseUrl={phase.baseUrl} onBack={reset} onConnected={onConnected} />;
  }

  return (
    <form onSubmit={checkAddress} className="flex flex-col gap-4 max-w-sm">
      <div>
        <label className="block text-sm font-medium mb-1">IP-adresse / vertsnavn</label>
        <input
          className="w-full border rounded px-3 py-2 bg-transparent"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="192.168.2.1"
          required
        />
        <p className="text-sm opacity-70 mt-1">
          Vi sjekker automatisk om enheten trenger førstegangsoppsett (commissioning) eller vanlig innlogging.
        </p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={phase.step === "checking"}
        className="self-start rounded bg-foreground text-background px-4 py-2 font-medium disabled:opacity-50"
      >
        {phase.step === "checking" ? "Sjekker..." : "Fortsett"}
      </button>
    </form>
  );
}
