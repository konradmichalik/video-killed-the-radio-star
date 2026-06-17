# Connected-Mode Feedback — Fix-Plan

Feedback aus einer realen Connected-Mode-Session (Host = TV, Clients = Handys).
Reihenfolge = Bearbeitungsreihenfolge. Jeder Punkt wird einzeln umgesetzt + verifiziert.

---

## 1. Reveal-Button wechselt die Farbe nicht, wenn alle geraten haben

**Analyse**

- Es gibt **zwei** Reveal-Buttons:
  - `HostRoomView.svelte` (im aufgeklappten GameSheet) — hat bereits die
    `.ready`-Klasse (`everyoneReady` → bug-yellow + Glow).
  - `FloatingControls.svelte` (Bottom-Bar bei **geschlossenem** Sheet) — die
    Bar, mit der man real spielt. Hier zeigt der Button nur
    `Reveal (n/m)` **ohne** jeden Ready-Zustand.
- Während des Spiels ist das Sheet zu → man sieht nur die FloatingControls →
  der Button ändert nie die Farbe. **Das ist die Ursache.**
- Latenter Nebenfehler: `connectedCount` wird inkonsistent berechnet:
  - `FloatingControls`: `p.connected !== false`
  - `GameSheet`/`HostRoomView`: `p.connected` (truthy)

**Fix**

- [x] In `FloatingControls.svelte` `everyoneReady` ableiten
      (`connectedCount > 0 && submittedCount >= connectedCount`) und am
      Reveal-Button eine `class:ready` setzen (bug-yellow + Glow-Puls,
      analog zu HostRoomView, mit `prefers-reduced-motion`-Fallback).
- [x] `connectedCount`-Berechnung über beide Komponenten angleichen.

---

## 2. Auto-Start (AUTO NEXT ROUND) startet die nächste Runde nicht zuverlässig

**Analyse**

- `maybeAutoAdvance` (App.svelte) feuert erst, wenn YouTube **von selbst** vom
  Runden-Track weg wechselt (`videoId !== roundTrackId` && `!adPlaying`).
- Der Trackwechsel passiert nur über den End-Preempt (`END_PREEMPT_S` vor
  Songende), der während `guessing` blockiert ist und erst nach `reveal`
  greift. Wird **früh** revealt, läuft der Song noch Minuten → gefühlt
  „startet nicht“. Es fehlt ein **expliziter** Trigger nach dem Reveal.

**Fix**

- [x] Neue Konstante `AUTO_ADVANCE_REVEAL_MS` (~6000) in `constants.js`.
- [x] In App.svelte: bei `phase === 'revealed'` + `autoAdvanceRound` einen
      One-Shot-Timer armen, der `next()` aufruft (frischer Track). Der
      bestehende `maybeAutoAdvance` erkennt dann den neuen `video_id` und
      startet die Guessing-Runde. Timer beim Verlassen von `revealed`/Toggle-Off
      sauber clearen (kein Doppel-Advance).

---

## 3. Host verliert die Verbindung — kein Reconnect möglich

**Analyse**

- `hostRoom()` (peer.js) hat **keinen** `peer.on('disconnected')`-Handler.
  Fällt der Socket des Hosts zum PeerJS-Broker aus (Netz-Blip, Standby),
  re-registriert peerjs die Host-ID nie wieder → der Raumcode löst auf dem
  Broker nicht mehr auf → **kein Client kann mehr beitreten**, egal wie oft
  neu geladen wird. Genau das beschriebene Symptom.
- Clients erholen sich bereits (Backoff + persistente Identity) — aber nur,
  wenn der Host erreichbar ist.
- Die Host-Peer-ID ist deterministisch (`VKTRS-<code>`) → derselbe Code lässt
  sich wieder hosten.

**Fix (primär — Recovery ohne Reload)**

- [x] In `hostRoom()` `peer.on('disconnected', () => peer.reconnect())`
      ergänzen (registriert dieselbe ID neu, Code bleibt gültig, Clients
      reconnecten automatisch). Gegen `close()`/`destroy()` absichern, Retry
      begrenzen.
- [x] Broker-Status nach oben geben (`onBrokerStatus`: open | reconnecting |
      unreachable) und in HostRoomView/NetworkBadge sichtbar machen.

**Fix (sekundär — Host-Reload übersteht den Raum) — bewusst offen**

- [ ] `{ code, session, players }` während der Connected-Session in
      localStorage persistieren; beim App-Start (ohne `?join`) denselben Code
      neu hosten + Raumzustand wiederherstellen. Clients rejoinen via
      Backoff + persistenter Identity automatisch. > Zurückgestellt: Der primäre Auto-Reconnect deckt den gemeldeten Fall > (Host verliert Broker-Link ohne Reload) bereits ab. Reload-Resume ist > größer (gameMode/Session/Players persistieren + Auto-Rehost beim Mount) > — erst bauen, wenn real benötigt (YAGNI).

---

## 4. Gewinner-Hervorhebung soll im Design-Rot erfolgen

**Analyse**

- `RevealOverlay.svelte`: die `.winner`-Zeile (Punktegewinner der Runde) nutzt
  `--bug-yellow`; nur der Exact-Bonus-Fall nutzt `--accent` (das Design-Rot
  `#ff2e63`).
- Gewünscht: der **aktuelle Punktegewinner** wird immer im Design-Rot
  hervorgehoben.

**Fix**

- [x] `.winner` (Border/Shadow + `winner-pulse`) auf `--accent` umstellen.
- [x] Exact-Bonus weiterhin unterscheidbar halten (Badge/Stärke), aber im
      roten Farbraum bleiben.

---

## Abschluss

- [x] `npm run lint` + `npm run check` grün.
- [x] `npm test` grün (121/121).
- [ ] Manuell gegen echte Connected-Session prüfen (zwei Geräte).
