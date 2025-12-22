# CampusRallyeApp – Premium/Trust Bead Plan (v3)

> Zweck: Dieses Dokument ist unser „Planungsraum“-Artefakt: ein selbstdokumentierender, fein granularer Backlog aus Arbeitspaketen („Beads“), der uns hilft, die App spürbar hochwertiger („premium“) und zuverlässiger („trustworthy“) zu machen – bevor wir Code schreiben.
>
> Stand: 2025-12-18  
> Branch-Empfehlung: Umsetzung auf Feature-Branches (aktuell: `codex-exp`)

## Produktentscheidungen (fixiert für diesen Plan)

- **Offline-Foto-Uploads:** **NEIN**  
  Konsequenz: Foto-Aufgaben sind **online-only** mit klarer UX („Upload benötigt Internet“). Keine persistente Foto-Outbox.
- **Join-Schutz (Passwort):** **Soft-Barrier, bewusst „untrusted“**  
  Konsequenz: Rallyes können **optional** ein Passwort haben – bei `NULL`/`''` joinen Nutzer:innen ohne Eingabe, sonst mit Passwort (clientseitige Prüfung). „Echter“ Join-Schutz (serverseitig per RPC/RLS + später QR-Join) ist **Roadmap** und steht separat in `docs/JOIN_SECURITY_PLAN.md`.

Diese Entscheidungen schneiden bewusst Komplexität, Risiko und Implementationszeit weg, ohne die **wichtigsten Nutzerziele** (Rallye spielen, Antworten abgeben, Ergebnisse sehen) zu schwächen.

---

## Zielbild („Premium + Trust“)

### North Star
Die App fühlt sich so zuverlässig und souverän an, dass Nutzer:innen niemals zweifeln:
„Hat die App meine Antwort wirklich gespeichert?“ / „Was passiert gerade?“

### Leitprinzipien
1. **Trust first:** Jede Action hat klaren Zustand (idle → loading → success/queued/failure).
2. **Consistency:** Tokens + Komponenten statt Einmal-Styles.
3. **Progressive disclosure:** Orientierung ohne Überfrachtung (Rallye/Team/Timer/Progress/Punkte).
4. **A11y + i18n:** Mindeststandard für Labels/Roles/Hit targets; Strings zentral.
5. **Low risk iterations:** Kleine, lieferbare Beads; keine Mega-Refactors ohne Messpunkt.

---

## Bewertungsmaßstab (für Priorisierung/Matrix)

- **Impact:** H/M/L (User spürt es). Tags: **T** (Trust), **P** (Premium).
- **Risk:** H/M/L (Regression/Unklarheit/Scope).
- **Cost:** XS/S/M/L/XL (relativ: <0,5d / ~1d / 2–4d / 1–2w / >2w).
- **Decision:** **NOW** (muss), **NEXT** (direkt danach), **LATER**, **CUT**.

---

## Kompakter Umsetzungsplan (Critical Path)

1. **Stabilität & Kern-Trust:** `B00 → B01 → B02 → B11`
2. **Join & Session-Verständlichkeit:** `B04 → B05`
3. **Offline-Outbox (nur SAVE_ANSWER) + einheitliche Submission:** `B06 → B07 → B09 → B10`
4. **UI-Fundament:** `B12 → B14 → B13 → B15 → B16a → B17`
5. **Journey-Polish mit hohem Hebel:** `B19 → B20 → B22 → B24 → B27`
6. **Resilience + Accessibility:** `B31a → B34`

---

## Risiko-/Kosten-Matrix (Summary)

| Bead | Kurzname | Impact | Risk | Cost | Decision |
|---|---|---:|---:|---:|---|
| B00 | Quality Gates | H (T) | L | S | NOW |
| B01 | Hook-Order + Unknown-Type Skip | H (T) | L | S | NOW |
| B02 | UIButton Contract | H (T+P) | M | S–M | NOW |
| B04 | Join UX (optional Passwort) | H (P+T) | L–M | S–M | NOW |
| B05 | Session/Resume/Logout Semantik | H (T) | M | M | NOW |
| B06 | Offline Outbox (SAVE_ANSWER only) | H (T) | M | M | NOW |
| B07 | Outbox: SAVE_ANSWER idempotent | H (T) | M | M | NOW |
| B09 | Offline UX (Sync Status sichtbar) | H (T+P) | L–M | S | NOW |
| B10 | Unified Answer Pipeline | H (T) | H | L | NOW |
| B11 | Startup Readiness (kein Blank Screen) | M–H (P+T) | L | S | NOW |
| B12 | Screen Scaffold (SafeArea/Layout/Keyboard) | H (P+T) | M | M | NEXT |
| B13 | Typo Tokens (MVP) | M–H (P) | L | M | NEXT |
| B14 | Semantic Colors/Surfaces (MVP) | H (P) | M | M | NEXT |
| B15 | Button/Link System (Variants) | H (P+T) | M | M | NEXT |
| B16a | Confirm API zentral (Alert-basiert) | M (T+P) | L | S | NEXT |
| B17 | i18n minimal + Persistenz + Default Locale | M–H (P+T) | M | M | NEXT |
| B19 | Welcome States (Loading/Offline/Empty) | H (P+T) | M | M | NEXT |
| B20 | Rallye-Auswahl Premium List | M–H (P) | L | S–M | NEXT |
| B22 | Rallye HUD (Progress/Points/Timer) | H (P+T) | M | M | NEXT |
| B24 | Hint Scoring Model (klar + nicht mutierend) | H (T) | M | M | NEXT |
| B27 | Photo UX online-only (Permission/Preview/Retry) | M–H (T+P) | M | M | NEXT |
| B31a | A11y Minimum Pass | H (T+P) | M | M | NEXT |
| B34 | Error Boundary + Recovery UX | H (T) | M | S–M | NEXT |
| B25 | Hint UX (Badge/Copy/SafeArea FAB) | M (P+T) | L | S–M | LATER |
| B26 | QR Scan UX (Overlay/Rescan/Success) | M (P) | M | M | LATER |
| B28 | Voting Polish | M (P+T) | M | M | LATER |
| B29 | Scoreboard Polish | M–H (P) | M | M | LATER |
| B30 | Tour End Summary | M (P) | L | S | LATER |
| B32a | Targeted Data Correctness/Perf | M–H (T) | M | M | LATER |
| B08 | Offline Photo Outbox | – | – | – | CUT |
| B16b | Themed ConfirmSheet | – | – | – | CUT |
| B18 | Theme Mode UI | – | – | – | CUT |
| B21 | Team Setup Delight (Edit/Shuffle) | – | – | – | CUT |
| B23 | Micro-Polish/Haptics | – | – | – | CUT |
| B32b | Deep Typing as Goal | – | – | – | CUT |
| B33 | Separate Media Perf Epic | – | – | – | CUT |

---

## Bead-Katalog (Details)

> Format pro Bead: Outcome → Why → Scope/Non-scope → Dependencies → Tasks/Subtasks → Acceptance Criteria.
> Checkboxes sind absichtlich enthalten: sie erlauben „Plan ↔ Umsetzung“ ohne Kontextverlust.

### B00 — Quality Gates & Safety Net (**NOW**, **T**)
**Status (codex-exp):** DONE (2025-12-17)  
**Outcome:** Keine Lint-Errors, klare „Release-Disziplin“; regressions werden früh sichtbar.  
**Why:** Premium entsteht aus Vorhersagbarkeit. Lint-Errors sind ein Signal für potenziell zufälliges Runtime-Verhalten.  
**Dependencies:** –  
**Scope:** Lint-Errors fixen/blocken; Warnings triagieren.  
**Non-scope:** Vollständige Warning-Elimination um jeden Preis.

**Tasks**
- [x] T00.1 Policy: „0 Lint-Errors“ als Blocker definieren.
- [x] T00.3 Warnings in Kategorien clustern und auf Beads verlinken (z.B. Hook deps → B32a).

**Acceptance**
- [x] AC00.1 `npm run lint` liefert 0 Errors.
- [x] AC00.2 Es gibt eine kurze, priorisierte Warning-/Debt-Liste.

**Debt / Warnings (Stand: 2025-12-17)**
- `react-hooks/exhaustive-deps` in `app/(tabs)/rallye/index.tsx`, `app/(tabs)/rallye/question-renderer.tsx`, `app/(tabs)/rallye/scoreboard.tsx`, `app/(tabs)/rallye/voting.tsx` → Kandidat für `B32a` (gezielte Korrektheit/Perf), weil Fixes hier oft Refactors benötigen (useCallback/Stable-Refs).
- `no-unused-vars` in `app/(tabs)/infos/index.jsx`, `app/(tabs)/rallye/states/NoQuestions.tsx`, `app/(tabs)/rallye/states/Preparation.tsx`, `app/(tabs)/rallye/team-setup.tsx`, `app/(tabs)/rallye/voting.tsx` → low-risk Cleanup (kann opportunistisch mit `B12`/Screen-Scaffold mitgezogen werden).

---

### B01 — Hook-Order fix + Unknown-Type ist kein Dead-End (**NOW**, **T**)
**Status (codex-exp):** DONE (2025-12-17)  
**Outcome:** Keine Hook-Rule-Verletzung; unbekannte Frage-Typen blockieren die Rallye nicht.  
**Why:** Crash/White-Screen oder „festhängen“ zerstört Vertrauen sofort.  
**Dependencies:** B00

**Tasks**
- [x] T01.1 Hooks in `QuestionRenderer` immer ausführen (kein Early Return vor Hooks).
- [x] T01.2 Fallback-UI für unbekannte Typen (themed, verständlich).
- [x] T01.3 CTA „Frage überspringen“ (damit Nutzer:innen weiterkommen).
- [x] T01.4 Logging: `question.id`, `question_type` (debuggability ohne Cloud).

**Acceptance**
- [x] AC01.1 Lint: keine Hook-Errors.
- [x] AC01.2 Unknown-Type zeigt verständliche UI + Skip führt zur nächsten Frage.

---

### B02 — `UIButton` als verlässlicher Primitive (**NOW**, **T+P**)
**Status (codex-exp):** DONE (2025-12-17)  
**Outcome:** Buttons sind konsistent (Layout/States/A11y), verhindern Double-Submits, fühlen sich „premium“ an.  
**Why:** CTA-Qualität prägt die gesamte App. Wenn Buttons „wackeln“, wirkt alles billig.  
**Dependencies:** B00

**Tasks**
- [x] T02.1 `style` (container) + `textStyle` als Props unterstützen.
- [x] T02.2 `loading` State: Spinner + disabled + verhindert Mehrfachpress.
- [x] T02.3 Outline/Ghost Icon-Farbe korrekt (nicht immer weiß).
- [x] T02.4 Pressed feedback (opacity/scale, optional android ripple).
- [x] T02.5 A11y: `accessibilityRole`, `accessibilityState`, Label-Prop (optional).

**Acceptance**
- [x] AC02.1 Komponenten, die `UIButton` layouten, brauchen keine Style-Hacks.
- [x] AC02.2 Loading verhindert Double-Submit sichtbar.

---

### B04 — Join UX (optional Passwort) (**NOW**, **P+T**)
**Status (codex-exp):** DONE (2025-12-18)  
**Outcome:** Der Einstieg ist gefühlt „geführt“ und fehlertolerant: Rallyes ohne Passwort joinen ohne Eingabe; Rallyes mit Passwort haben eine klare, keyboard-sichere Passworteingabe (inkl. Flip-Card).  
**Why:** Der erste Screen definiert Vertrauen + Markenwirkung.  
**Dependencies:** B02 (Button states), B17 (Strings) empfohlen

**Scope**
- Join ohne Passwort **wenn** `password` leer ist.
- Join mit Passwort **wenn** `password` gesetzt ist.
- Keine accidental taps (Modal/Sheet blockt Hintergrund).

**Tasks**
- [x] T04.1 Join-Flow definieren: Auswahl → Confirm → Teilnahme.
- [x] T04.2 Optionales Passwort: UI zeigt Passwort-Step nur wenn nötig; leere Passwörter überspringen.
- [x] T04.3 Passworteingabe polished: Fokus stabil, Keyboard überdeckt Feld nicht (KeyboardAvoiding).
- [x] T04.4 Fehlerfälle: falsches Passwort / Rallye nicht verfügbar / Status geändert → klare Meldung + Retry.
- [x] T04.5 UX: „Rallye wählen“ zeigt Status/Studiengang prominent (Fehlwahl minimieren).

**Acceptance**
- [x] AC04.1 Kein Kontextverlust; alle Fehler bleiben im Join-Kontext.
- [x] AC04.2 Join ist ohne Passwort in 2–3 klaren Schritten möglich; mit Passwort bleibt der Flow klar und „premium“.

---

### B05 — Session/Resume/Logout Semantik (**NOW**, **T**)
**Status (codex-exp):** DONE (2025-12-17)  
**Outcome:** Nutzer:innen verstehen ihren Zustand (fortsetzen/neu starten) und können sauber beenden.  
**Why:** Überraschendes Auto-Resume wirkt unprofessionell; Zombie-States zerstören Vertrauen.  
**Dependencies:** B00

**Tasks**
- [x] T05.1 Session-Zustände definieren (not_joined / playing / finished / post_processing).
- [x] T05.2 App-Start: Resume-Prompt statt stiller Teleportation.
- [x] T05.3 Logout/Exit: konsistentes Cleanup (enabled/team mapping/question index pro rallye).
- [x] T05.4 Decision: **kein** Persist von `questionIndex` (Fragen werden beim Fetch randomisiert); Fortschritt in Team-Mode über `team_questions`.

**Acceptance**
- [x] AC05.1 App-Start zeigt nachvollziehbar „Fortsetzen?“.
- [x] AC05.2 Exit führt nicht zu falschen Indizes/Teams in anderer Rallye.

---

### B06 — Offline Outbox (nur SAVE_ANSWER) (**NOW**, **T**)
**Status (codex-exp):** DONE (2025-12-17, MVP)  
**Outcome:** Text/MC/QR Antworten funktionieren offline und synchronisieren später sicher.  
**Why:** Campus-Umgebung = instabiles Netz. Offline-Sicherheit ist Trust-Feature.  
**Dependencies:** B00

**Scope**
- Outbox nur für „kleine“ DB-Inserts (Answers).
- Trigger: App-Start + Foreground + Reconnect.

**Tasks**
- [x] T06.1 Ein `OfflineAction` Schema definieren (id, type, createdAt, attempts, nextRetryAt, payloadVersion).
- [x] T06.2 Dedizierten Outbox-Service erstellen (`enqueue/list/process`).
- [x] T06.3 Trigger implementieren: start/foreground/reconnect (nicht nur NetInfo-change).
- [x] T06.4 Retry-Policy + Fehlerzustand sichtbar (Backoff + `lastError`; optional später: max-attempts „poison pill“).

**Acceptance**
- [x] AC06.1 Queue wird auch beim App-Start online abgearbeitet.
- [x] AC06.2 App-Restart verliert keine queued Answers.

---

### B07 — Outbox Action: `SAVE_ANSWER` idempotent (**NOW**, **T**)
**Status (codex-exp):** DONE (2025-12-17)  
**Outcome:** Keine doppelten Inserts; offline queued Answers landen später genau einmal in Supabase.  
**Why:** Duplikate sind ein Trust-Killer („App zählt doppelt / unfair“).  
**Dependencies:** B06

**Tasks**
- [x] T07.1 Payload vollständig: `team_id`, `question_id`, `correct`, `points`, `team_answer`.
- [x] T07.2 Idempotenz-Strategie festlegen (Upsert/Unique Constraint/Pre-check).
- [x] T07.3 Processor: pro Action robustes Error-Handling, attempts++, nextRetryAt.
- [x] T07.4 Result-Contract: UI erhält `ok | queued | failed`.

**Acceptance**
- [x] AC07.1 Offline beantwortet → später online → Antwort existiert serverseitig genau einmal.

---

### B09 — Offline UX & Sync Status sichtbar (**NOW**, **T+P**)
**Status (codex-exp):** DONE (2025-12-17, MVP)  
**Outcome:** Nutzer:innen wissen jederzeit, ob etwas queued/syncing/failed ist.  
**Why:** „Was passiert gerade?“ ist Premium-Feeling und Trust-Basis.  
**Dependencies:** B06, B07

**Tasks**
- [x] T09.1 `SyncStatus` state (queueCount, syncing, lastError).
- [x] T09.2 In Rallye/Questions: dezenter Banner/Chip bei offline/syncing.
- [x] T09.3 Bei offline submit: Feedback „Gespeichert, wird synchronisiert“ (globaler Sync-Badge statt Popups).
- [x] T09.4 Foto-Aufgaben: offline gate („Upload benötigt Internet“), kein Queue-Versprechen.

**Acceptance**
- [x] AC09.1 Keine silent failures beim Submit.
- [x] AC09.2 Foto-Submit ist offline klar blockiert/erklärt.

---

### B10 — Unified Answer Pipeline (Single Source of Truth) (**NOW**, **T**)
**Status (codex-exp):** DONE (2025-12-17)  
**Outcome:** Alle Fragetypen nutzen dieselbe Submission-Logik (Punkte/Offline/DB/UX).  
**Why:** Verteilte Logik führt zu Inkonsistenzen (z.B. Punkte lokal vs server, Hint-Kosten, Offline).  
**Dependencies:** B06, B07, B09

**Tasks**
- [x] T10.1 `submitAnswer()` API definieren (inkl. result contract).
- [x] T10.2 Question-Components refactoren: nur noch `submitAnswer` nutzen.
- [x] T10.3 Klare Zustände: loading/queued/error, disable controls.
- [x] T10.4 Doppelpfade entfernen (z.B. parallel vorhandene `handleAnswer`/eigene Speicherroutinen).

**Acceptance**
- [x] AC10.1 Submit ist für alle Question Types konsistent (UX + Daten).

---

### B11 — Startup Readiness (kein Blank Screen) (**NOW**, **P+T**)
**Status (codex-exp):** DONE (2025-12-17, MVP)  
**Outcome:** Kein „leerer Screen“ beim Start; wirkt sofort hochwertiger.  
**Why:** `return null` bis ready erzeugt „App hängt“-Gefühl.  
**Dependencies:** B00

**Tasks**
- [x] T11.1 Splash bis Fonts + Navigation + Store init (statt „null“).
- [x] T11.2 Fallback Loading Screen (falls Splash nicht greift).

**Acceptance**
- [x] AC11.1 Kaltstart zeigt nie längere „Leere“.

---

## NEXT Beads (UI-Fundament + Journey-Polish)

### B12 — Screen Scaffold (SafeArea/Layout/Keyboard) (**NEXT**, **P+T**)
**Status (codex-exp):** DONE (2025-12-18)  
**Outcome:** Konsistente Ränder, Safe-Area, Scroll-/Keyboard-Verhalten.  
**Dependencies:** B11 empfohlen

**Tasks**
- [x] T12.1 `Screen` Primitive (SafeArea + background + padding tokens).
- [x] T12.2 Standardisierte Scroll-Container (keyboard insets).
- [x] T12.3 Migriere Welcome + Rallye State Screens zuerst.

**Acceptance**
- [x] AC12.1 Keine Notch-Overlaps, konsistentes Spacing.

---

### B14 — Semantic Colors/Surfaces (MVP) (**NEXT**, **P**)
**Status (codex-exp):** DONE (2025-12-18)  
**Outcome:** Dark Mode wirkt „premium“ (Surface-Stufen statt hartes #000).  
**Dependencies:** B12

**Tasks**
- [x] T14.1 Palette um `surface0/1/2`, `textMuted`, `borderSubtle` ergänzen.
- [x] T14.2 Komponenten auf Semantik umstellen (InfoBox/Card/Tabbar).
- [x] T14.3 Shadows im Dark Mode reduzieren, Borders konsistent nutzen.

**Acceptance**
- [x] AC14.1 Dark Mode ist angenehm und lesbar; keine „hart schwarzen“ Flächen.

---

### B13 — Typo Tokens (MVP) (**NEXT**, **P**)
**Status (codex-exp):** DONE (2025-12-18)  
**Outcome:** Sichtbare Hierarchie (Title/Body/Caption/Button) ohne Inline-FontChaos.  
**Dependencies:** B12

**Tasks**
- [x] T13.1 Typo-Scale definieren (size/lineHeight/weight).
- [x] T13.2 `ThemedText` Variants erweitern.
- [x] T13.3 Wichtige Screens migrieren (Welcome, InfoBox titles, HUD).

**Acceptance**
- [x] AC13.1 Typo wirkt überall konsistent und „intentional“.

---

### B15 — Button/Link System (Variants, replace text-links) (**NEXT**, **P+T**)
**Status (codex-exp):** DONE (2025-12-18)  
**Outcome:** Keine „roten Textlinks“ als Haupt-CTA; klare CTA-Semantik.  
**Dependencies:** B02, B13, B14

**Tasks**
- [x] T15.1 Variants definieren: primary/secondary/ghost/destructive.
- [x] T15.2 Replace Refresh-Textlinks durch Buttons.
- [x] T15.3 Einheitliche Disabled-/Loading-Optik.

**Acceptance**
- [x] AC15.1 CTAs sind überall als Buttons erkennbar.

---

### B16a — Confirm API zentral (Alert-basiert) (**NEXT**, **T+P**)
**Status (codex-exp):** DONE (2025-12-18)  
**Outcome:** Bestätigungen sind konsistent und leicht i18n-fähig, ohne Design-Risiko.  
**Why:** OS-Alerts sind a11y-stark; das „Premium“ kommt hier primär durch Konsistenz + gute Copy.  
**Dependencies:** B15, B17

**Tasks**
- [x] T16.1 `confirm({title,message,confirmText,cancelText}) => Promise<boolean>`.
- [x] T16.2 Replace verstreute Confirm-Dialoge (Hint, Surrender, Exit) mit API.

**Acceptance**
- [x] AC16.1 Confirm Copy ist konsistent und lokalisiert.

---

### B17 — i18n minimal + Persistenz + Default Locale (**NEXT**, **P+T**)
**Outcome:** Strings zentral, konsistent, persistent; neue Strings sind „leicht“.  
**Dependencies:** B12

**Tasks**
- [ ] T17.1 `t(key)` + Dictionary (de/en) + persist language in AsyncStorage.
- [ ] T17.2 Default language via Device Locale (falls sinnvoll).
- [ ] T17.3 Migriere Kernflows (Join, Submit, Offline, Exit, Hint).

**Acceptance**
- [ ] AC17.1 Sprache bleibt über App-Restart erhalten.
- [ ] AC17.2 Keine neuen hardcoded DE/EN Strings im Kernfluss.

---

### B19 — Welcome States (Loading/Offline/Empty/Error sauber) (**NEXT**, **P+T**)
**Outcome:** Einstieg ist klar und vertrauenswürdig (keine „data truthiness“ Online-Heuristik).  
**Dependencies:** B12, B15, B17

**Tasks**
- [ ] T19.1 Fetch-Logik konsolidieren (ein Weg, klare error branches).
- [ ] T19.2 Zustände trennen: loading vs offline vs empty vs error.
- [ ] T19.3 Empty State: „Keine Rallyes verfügbar“ + Retry.

**Acceptance**
- [ ] AC19.1 Jede Lage hat klare UI und CTA.

---

### B20 — Rallye-Auswahl Premium List (Status/Studiengang/Full-row tap) (**NEXT**, **P**)
**Outcome:** Weniger Fehlwahl, schneller Join, mehr „polished“ Gefühl.  
**Dependencies:** B02, B12–B17

**Tasks**
- [ ] T20.1 Full-row tap + eindeutige Auswahlzustände.
- [ ] T20.2 Status-Chips, Studiengang prominent; optional Sortierung (running zuerst).
- [ ] T20.3 Empty/Retry State konsistent.

**Acceptance**
- [ ] AC20.1 Auswahl ist in 1 Tap möglich und eindeutig.

---

### B22 — Rallye HUD (Progress/Points/Timer/Context) (**NEXT**, **P+T**)
**Outcome:** Nutzer:innen sind immer orientiert: „wo bin ich, wie weit, was zählt“.  
**Dependencies:** B10, B12–B15

**Tasks**
- [ ] T22.1 `RallyeHUD` Komponente definieren (progress bar + x/y + points + timer).
- [ ] T22.2 Konsistent auf Question-Screens rendern (statt Inline-Text).

**Acceptance**
- [ ] AC22.1 Orientierung ist auf jeder Frage gleich und klar.

---

### B24 — Hint Scoring Model (klar, nicht mutierend) (**NEXT**, **T**)
**Outcome:** Hint-Kosten sind fair, transparent und technisch korrekt.  
**Dependencies:** B10, B17, B16a

**Tasks**
- [ ] T24.1 Scoring-Entscheidung fixieren: „Hint kostet X Punkte“ (exakt, nicht „ein paar“).
- [ ] T24.2 Implementiere Hint-State (per question id) im Store (keine Objektmutation).
- [ ] T24.3 UI/Copy zeigt Kosten vor Nutzung.

**Acceptance**
- [ ] AC24.1 Hint kann keine negativen/inkonsistenten Punkte verursachen.

---

### B27 — Photo UX online-only (Permission/Preview/Progress/Retry + Offline Gate) (**NEXT**, **T+P**)
**Outcome:** Foto-Aufgaben funktionieren zuverlässig – oder sind offline ehrlich blockiert.  
**Dependencies:** B10, B12–B17

**Tasks**
- [ ] T27.1 Permission-Gating (wie QR): Erklärung + CTA + fallback.
- [ ] T27.2 Preview-State: retake/send; Upload progress + retry.
- [ ] T27.3 Offline: „Send“ disabled + Hinweis; optional „Surrender“ bleibt verfügbar.

**Acceptance**
- [ ] AC27.1 Kein schwarzer/broken Kamera-Screen ohne Permission.
- [ ] AC27.2 Upload hat klaren Zustand und verständliche Fehlerbehandlung.

---

### B31a — Accessibility Minimum Pass (**NEXT**, **T+P**)
**Outcome:** Screenreader/Hit targets/Labels sind im Kernfluss sauber.  
**Dependencies:** B12–B15

**Tasks**
- [ ] T31.1 Interactives: `accessibilityRole/Label/Hint` (Buttons, Cards, List rows).
- [ ] T31.2 Hit targets ≥ 44×44 (Language toggle, Icon buttons).
- [ ] T31.3 Kontrast check (muted text, dark mode).

**Acceptance**
- [ ] AC31.1 Kernfluss ist per Screenreader bedienbar (Join → Frage → Submit → Finish).

---

### B34 — Error Boundary + Recovery UX (**NEXT**, **T**)
**Outcome:** Keine White Screens; Nutzer:innen können sich selbst „retten“ (Back to start).  
**Dependencies:** B12–B17 empfohlen

**Tasks**
- [ ] T34.1 Root ErrorBoundary (um Router Slot) + fallback UI.
- [ ] T34.2 Recovery: Reset store + zurück zum Start.
- [ ] T34.3 Optional: Debug-Info (rallye/team/question id) im UI (nur dev).

**Acceptance**
- [ ] AC34.1 Runtime-Fehler zeigen Recovery UI statt App-Abbruch.

---

## LATER Beads (nur wenn Core sitzt)

### B25 — Hint UX (Badge/Copy/SafeArea FAB) (**LATER**, **P+T**)
**Dependencies:** B24, B12–B17

### B26 — QR Scan UX (Overlay/Rescan/Success State) (**LATER**, **P**)
**Dependencies:** B12–B17

### B28 — Voting Polish (**LATER**, **P+T**)
**Dependencies:** B12–B17

### B29 — Scoreboard Polish (**LATER**, **P**)
**Dependencies:** B12–B17, B05

### B30 — Tour End Summary („Achievement“-Moment) (**LATER**, **P**)
**Dependencies:** B12–B17

### B32a — Targeted Data Correctness/Perf (nur spürbare Themen) (**LATER**, **T**)
**Dependencies:** B00

---

## CUT Beads (bewusst gestrichen)

Diese Themen werden **nicht** umgesetzt, solange sich die Produktentscheidungen nicht ändern:

- B08 Offline Photo Outbox (persistente Datei, retries, cleanup)
- B16b Themed ConfirmSheet (optischer Luxus ohne klaren Trust-Return)
- B18 Theme Mode UI (nice-to-have)
- B21 Team Setup Delight (Edit/Shuffle)
- B23 Micro-Polish/Haptics
- B32b Deep Typing as primary goal
- B33 Separate Media Performance Epic (gehört in B27/B28, wenn überhaupt)

---

## Appendix: „Warum diese Cuts?“ (Kurzbegründung)

- **Kein „echter“ Join-Schutz in diesem Bead-Plan**: Das Produktziel ist primär „Rallye spielen“. Der aktuelle Passwort-Join bleibt eine pragmatische Soft-Barrier; die sichere Variante (RPC/RLS + QR-Join) ist separat geplant in `docs/JOIN_SECURITY_PLAN.md`.
- **Keine Foto-Outbox**, weil „offline foto später senden“ zwar bequem, aber technisch riskant/aufwendig ist. Trust gewinnt man auch durch ehrliches Online-Gating.
- **Kein ConfirmSheet-Overengineering**: konsistente Copy + zentrale API liefert 80% des Effekts bei 20% Aufwand.
