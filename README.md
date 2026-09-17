# Multitech Configurator

Web-verktøy for å koble til og konfigurere MultiTech Conduit (AEP/mPower) enheter via deres innebygde RESTful JSON API. rCell/MTR-enheter bruker samme API og støttes derfor også.

## Status

Første versjon: koble til én enhet, logg inn, og utforsk/endre konfigurasjon via et generisk endepunkt-panel. Egne skjemaer per innstilling (nettverk, LoRa, GPS, brannmur osv.) kommer etter hvert som vi har verifisert flyten mot en ekte enhet.

## Kom i gang

```bash
npm install
npm run dev
```

Åpne [http://localhost:3000](http://localhost:3000). Du må ha nettverkstilgang til enheten (typisk `https://192.168.2.1`) fra maskinen du kjører appen på.

## Arkitektur

- **Next.js (App Router, TypeScript)** – én kodebase for UI og backend.
- Nettleseren snakker aldri direkte med enheten. Alle kall går via Next sine Route Handlers under `app/api/*`, som proxyer mot enhetens API (`lib/multitechClient.ts`).
- Enhetens session-token lagres server-side i en `httpOnly`-cookie (`lib/deviceSession.ts`) – aldri i nettleser-JS.
- Enhetene bruker som regel et selvsignert TLS-sertifikat. Dette håndteres med en dedikert `undici`-agent som kun brukes for kall til enheten (`insecureDeviceAgent`), uten å svekke sikkerheten for andre forespørsler appen måtte gjøre.

## API-referanse

Verktøyet bygger på MultiTechs offisielle dokumentasjon:

- https://www.multitech.net/developer/software/aep/conduit-aep-api/
- https://www.multitech.net/developer/software/aep/
- https://www.multitech.net/developer/software/mtr-software/mtr-api-reference/

Oppsummert: alle kall returnerer JSON med `code`/`status`, innlogging skjer via `GET /api/login?username=...&password=...` og gir et `token` som sendes med som query-parameter (`?token=...`) på påfølgende kall. Konfigurasjon leses/skrives via "collection endpoints" som `lan`, `wifi`, `firewall`, `gps`, `lora`, `apps` m.fl.
