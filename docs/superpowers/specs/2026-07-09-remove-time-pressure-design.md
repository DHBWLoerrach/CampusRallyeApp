# Zeitdruck aus der App entfernen

**Datum:** 2026-07-09
**Status:** Design abgestimmt

## Problem

Die App erzeugt aktuell aktiven Zeitdruck für Teams:

- `TimerHeader.tsx` zeigt einen live herunterzählenden `hh:mm:ss`-Countdown im
  Header und setzt `store$.timeExpired`, sobald `end_time` erreicht ist.
- `store$.timeExpired` löst eine **harte Sperre** aus: Antworten können nicht
  mehr gespeichert werden (`answerSubmission.ts`), und der Fragen-Screen wird
  clientseitig durch einen „Zeit abgelaufen!“-Screen ersetzt (`index.tsx`) —
  unabhängig vom tatsächlichen, admin-gesetzten `rallye.status`.
- Im Scoreboard (`scoreboard.tsx`) wird bei Punktgleichheit nach Spielzeit
  sortiert (schnelleres Team gewinnt den Tie-Break), und jede Zeile zeigt die
  Dauer aller Teams nebeneinander — ein impliziter Tempo-Vergleich.

## Ziel

Kein Zeitdruck mehr: Das geplante Ende wird nur noch als ruhige Orientierung
angezeigt, nichts läuft clientseitig gegen die Uhr ab, die Rallye endet
ausschließlich über den admin-gesetzten Status, und das Ranking wertet nur
Punkte.

## Entscheidungen

- **Platzierung des Endzeit-Hinweises:** gleicher Header-Slot wie bisher der
  Countdown (minimaler struktureller Eingriff).
- **`store$.timeExpired`:** wird als Konzept vollständig entfernt, nicht nur
  wirkungslos gemacht.
- **Spielzeit im Scoreboard:** verschwindet aus der Team-Liste; nur die eigene
  Team-Zeile zeigt sie zusätzlich als reinen Rückblick.
- **Rang bei Punktgleichheit:** Dense Ranking (1, 2, 2, 3) — Rang wird nicht
  übersprungen.

## Umsetzung

### 1. Header: Countdown → ruhiger Endzeit-Hinweis

`components/rallye/TimerHeader.tsx` wird zu
`components/rallye/PlannedEndInfo.tsx` umbenannt (nur 4 Fundstellen betroffen:
Komponente, Test, `_layout.tsx`, `_layout.test.tsx`) — Umbenennung ist
gerechtfertigt, weil sich der Zweck der Komponente vollständig ändert.

- Kein `useState`/`useEffect`/`setInterval` mehr — reine Funktion der Props.
- `endTime` ist `null`/`undefined` → Komponente rendert `null` (kein Icon, kein
  Text).
- Sonst: Uhrzeit lokal formatiert (`toLocaleTimeString`, App-Locale aus
  `useLanguage()`), eingebettet in neuen i18n-Key `rallye.plannedEnd`:
  - de: „geplant bis {{time}} Uhr“
  - en: „planned until {{time}}“
- Gleiches Uhr-Icon (`IconSymbol name="clock"`) bleibt für Wiedererkennung,
  aber **kein** Dringlichkeits-Styling (keine Farbwechsel, kein Blinken) — das
  wäre selbst wieder ein Zeitdruck-Signal.
- Schreibt nicht mehr in `store$.timeExpired` — dieser Pfad entfällt komplett
  (siehe Abschnitt 2).

`app/(tabs)/rallye/_layout.tsx`: Import und lokale Variable (`showTimer` →
`showPlannedEnd`) umbenannt, gleiche Sichtbarkeitsbedingung
(`rallye?.status === 'running' && !isTourMode`), Prop bleibt
`rallye?.end_time`.

### 2. Keine harte Sperre mehr nach Zeitablauf

- `services/storage/Store.ts`: Feld `timeExpired` wird aus dem Observable
  entfernt, ebenso aus `SessionInputs` und `deriveSessionState`. Die
  `'finished'`-Bedingung wird zu: `rallye.status === 'ranking' ||
  rallye.status === 'ended' || allQuestionsAnswered` (Zeit spielt keine Rolle
  mehr). `reset()` verliert das entsprechende `store$.timeExpired.set(false)`.
- `services/storage/answerSubmission.ts`: `isRallyeTimeExpired()` wird
  vollständig entfernt, ebenso beide Aufruf-Guards in
  `submitAnswerAndAdvance` und `submitPhotoAnswerAndAdvance`. `'expired'`
  entfällt aus den Union-Types `SubmitOutcome`/`SubmitPhotoOutcome` — geprüft,
  dass kein Aufrufer (`MultipleChoiceQuestion`, `ImageQuestion`,
  `SkillQuestion`, `QRCodeQuestion`, `GeocachingQuestion`,
  `UploadPhotoQuestion`) diesen Status auswertet.
- `app/(tabs)/rallye/index.tsx`: `endTimeMs`, `hasFutureEndTime`,
  `rallyeTimeExpired` entfallen. `teamRallyeFinished` wird zu
  `!isTourMode && allQuestionsAnswered`. Der „Rallye beendet“-Screen zeigt
  dadurch immer `rallye.allAnswered.simple` (der `rallye.timeUp`-Zweig
  entfällt). Der i18n-Key `rallye.timeUp` wird gelöscht (dann ungenutzt).
- Ergebnis: Fragen und Antwortabgabe bleiben nach `end_time` uneingeschränkt
  zugänglich. Einzige Quelle für „Rallye beendet“ ist `rallye.status`.

### 3. Spielzeit nur als Rückblick fürs eigene Team

- Die Erfassung von `time_played` (`services/storage/teamStorage.ts:
  setTimePlayed`, Aufruf in `Store.ts: gotoNextQuestion`) bleibt unverändert —
  wird weiterhin benötigt.
- `app/(tabs)/rallye/scoreboard.tsx`: Die Dauer-Anzeige verschwindet aus jeder
  Tabellenzeile (aktuell unterhalb der Punktzahl) und aus dem a11y-Label
  `scoreboard.rowLabel` (Zeit-Platzhalter entfällt).
- Stattdessen zeigt **nur die eigene, bereits farblich hervorgehobene
  Team-Zeile** zusätzlich einen Rückblick-Satz, neuer i18n-Key
  `scoreboard.ownDuration`:
  - de: „Ihr wart {{time}} unterwegs“
  - en: „You took {{time}}“
  - Kein numerischer Vergleich zu anderen Zeilen möglich, da dort keine Zeit
    mehr sichtbar ist.
- `time_spent`/`formatDuration`/`calculateDuration` bleiben als internes
  Datenfeld ausschließlich für diese eine Anzeige bestehen.

### 4. Ranking: nur Punkte zählen, Gleichstand = gleicher Rang

- Die Sortierung in `scoreboard.tsx` sortiert nur noch nach `total_points`
  absteigend; der Zeit-Tie-Break (`timeA - timeB`) entfällt vollständig.
- Die Rangvergabe wechselt von striktem Array-Index (`i + 1`) auf **Dense
  Ranking**: Teams mit identischer Punktzahl erhalten denselben Rang; das
  nächste Team mit weniger Punkten erhält den nächsten Rang **ohne Lücke**
  (Beispiel: 10, 8, 8, 5 Punkte → Ränge 1, 2, 2, 3).
- Die Medaillen-Logik (🥇🥈🥉ab Rang 1-3) bleibt unverändert bestehen und kann
  bei Gleichstand mehrfach vergeben werden.

## Trade-offs

- Die Umbenennung `TimerHeader` → `PlannedEndInfo` berührt vier Dateien zur
  Namensklarheit statt eines reinen Verhaltens-Patches — bewusst in Kauf
  genommen, weil der bisherige Name („Timer“) dem neuen Zweck widerspricht.
- Teams, die eine Rallye nicht abschließen (`time_played === null`), erhalten
  keinen eigenen Rückblick-Satz im Scoreboard (kein `time_spent`); das ist
  unverändert zum Status quo, in dem solche Teams zuvor ans Ende der
  Gleichstandsgruppe sortiert wurden — jetzt entscheidet nur die Punktzahl,
  eine fehlende Zeit hat keine Sortierauswirkung mehr.

## Tests

- `components/rallye/__tests__/TimerHeader.test.tsx` →
  `PlannedEndInfo.test.tsx`: kein Timer-/Interval-Verhalten mehr; stattdessen
  Formatierungs-Test (`end_time` gesetzt → Text sichtbar) und Null-Fall
  (`end_time` null/undefined → nichts gerendert). Kein
  `store$.timeExpired`-Bezug mehr.
- `app/(tabs)/rallye/__tests__/_layout.test.tsx`: Umbenennung der Prüfungen
  auf `PlannedEndInfo`.
- `services/storage/__tests__/answerSubmission.test.ts`: Alle `expired`-Fälle
  (abgelaufene `end_time` blockiert Speichern) entfernt; stattdessen Test,
  dass eine Antwortabgabe nach abgelaufener `end_time` weiterhin normal
  gespeichert wird.
- `services/storage/__tests__/Store.test.ts`: `timeExpired`-Fälle in
  `sessionState`/`reset()` entfernt.
- `app/(tabs)/rallye/__tests__/index.test.tsx` /
  `index-effects.test.tsx`: `rallye.timeUp`-/`timeExpired`-Fälle entfernt;
  „alle Fragen beantwortet“-Screen wird unabhängig von `end_time` getestet.
- `app/(tabs)/rallye/__tests__/scoreboard.test.tsx`: Test
  `"sorts teams by points descending, then by time"` wird ersetzt durch einen
  Test auf Dense Ranking bei Punktgleichheit (kein Zeit-Tie-Break mehr) sowie
  einen Test, dass nur die eigene Zeile eine Dauer anzeigt.
- Nach jedem Schritt: `npm run lint`, `npx tsc --noEmit`, `npm test`.

## Nicht im Scope

- Änderungen am Admin-Backend/-Dashboard (Status-Verwaltung liegt außerhalb
  dieses Repos).
- Neue Anzeige der eigenen Spielzeit außerhalb des Scoreboards (z. B. eigenes
  Widget während des Spiels).
- Änderungen an der DB-Spalte `end_time` selbst (ist bereits nullable im Typ).
