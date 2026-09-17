"use client";

import { useEffect, useState } from "react";
import ConnectFlow from "./components/ConnectFlow";
import Dashboard from "./components/Dashboard";

type SessionState =
  | { status: "loading" }
  | { status: "disconnected" }
  | { status: "connected"; baseUrl: string; whoami: Record<string, unknown> };

export default function Home() {
  const [session, setSession] = useState<SessionState>({ status: "loading" });

  async function refreshSession() {
    const res = await fetch("/api/session");
    const data = await res.json();
    if (data.connected) {
      setSession({ status: "connected", baseUrl: data.baseUrl, whoami: data.result });
    } else {
      setSession({ status: "disconnected" });
    }
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/session")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.connected) {
          setSession({ status: "connected", baseUrl: data.baseUrl, whoami: data.result });
        } else {
          setSession({ status: "disconnected" });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col gap-8 py-16 px-6">
        <div>
          <h1 className="text-2xl font-semibold">Multitech Configurator</h1>
          <p className="text-sm opacity-70">
            Koble til en MultiTech Conduit-enhet og utforsk konfigurasjons-APIet.
          </p>
        </div>

        {session.status === "loading" && <p>Laster...</p>}

        {session.status === "disconnected" && <ConnectFlow onConnected={refreshSession} />}

        {session.status === "connected" && (
          <Dashboard
            baseUrl={session.baseUrl}
            whoami={session.whoami}
            onDisconnected={() => setSession({ status: "disconnected" })}
          />
        )}
      </main>
    </div>
  );
}
