"use client";

import { useState } from "react";

interface CommissioningStepResult {
  status?: string;
  error?: string;
  result?: {
    aasDone?: boolean;
    aasID?: string;
    aasMsg?: string;
    [key: string]: unknown;
  };
}

async function step(baseUrl: string, username: string, aasID: string, aasAnswer: string) {
  const res = await fetch("/api/commissioning/step", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ baseUrl, username, aasID, aasAnswer }),
  });
  const data = (await res.json()) as CommissioningStepResult;
  if (!res.ok) {
    throw new Error(data.error ?? "Uventet feil mot enheten");
  }
  return data;
}

export default function CommissionForm({
  baseUrl,
  onBack,
  onCommissioned,
}: {
  baseUrl: string;
  onBack: () => void;
  onCommissioned: () => void;
}) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError("Passord kan ikke være tomt");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passordene er ikke like");
      return;
    }

    setLoading(true);
    try {
      setStatus("Starter oppsett...");
      const init = await step(baseUrl, username, "", "");
      if (init.status !== "success") {
        throw new Error(init.error ?? init.result?.aasMsg ?? "Enheten avviste forespørselen");
      }
      let aasID = init.result?.aasID;
      if (!aasID) {
        throw new Error("Fikk ikke en sesjons-ID (aasID) tilbake fra enheten");
      }

      setStatus("Setter passord...");
      const setPass = await step(baseUrl, username, aasID, password);
      if (setPass.status !== "success") {
        throw new Error(setPass.error ?? setPass.result?.aasMsg ?? "Enheten avviste passordet");
      }
      aasID = setPass.result?.aasID ?? aasID;

      setStatus("Bekrefter passord...");
      const confirm = await step(baseUrl, username, aasID, password);
      if (confirm.status !== "success" || confirm.result?.aasDone === false) {
        throw new Error(confirm.error ?? confirm.result?.aasMsg ?? "Kunne ikke bekrefte passordet");
      }

      setStatus("Logger inn...");
      const loginRes = await fetch("/api/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl, username, password }),
      });
      const loginData = await loginRes.json();
      if (!loginRes.ok || loginData.status === "fail") {
        throw new Error(
          loginData.error ?? "Admin-brukeren ble opprettet, men automatisk innlogging feilet. Prøv å logge inn manuelt."
        );
      }

      onCommissioned();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ukjent feil under oppsett");
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm">
      <div>
        <p className="text-sm font-medium">Enheten er ikke satt opp ennå</p>
        <p className="text-sm opacity-70">
          {baseUrl} venter på at admin-brukeren opprettes (commissioning-modus). Gjør det her i stedet for i
          enhetens eget web-grensesnitt.
        </p>
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
        <label className="block text-sm font-medium mb-1">Nytt passord</label>
        <input
          type="password"
          className="w-full border rounded px-3 py-2 bg-transparent"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Bekreft passord</label>
        <input
          type="password"
          className="w-full border rounded px-3 py-2 bg-transparent"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>
      {status && !error && <p className="text-sm opacity-70">{status}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-foreground text-background px-4 py-2 font-medium disabled:opacity-50"
        >
          {loading ? "Setter opp..." : "Opprett admin-bruker"}
        </button>
        <button type="button" onClick={onBack} className="text-sm underline">
          Endre IP-adresse
        </button>
      </div>
    </form>
  );
}
