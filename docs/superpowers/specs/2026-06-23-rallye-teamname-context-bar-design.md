# Teamname als Kontext-Leiste im Hauptbereich

**Datum:** 2026-06-23
**Status:** Design abgestimmt

## Problem

In einer laufenden Rallye wird der Teamname im Navigations-Header oben links
angezeigt (`components/rallye/RallyeHeader.tsx`). Die verfügbare Breite ist fest
gedeckelt (`headerWidth = Math.max(width - 220, 96)`), wobei die 220px pauschal
reserviert werden — unabhängig davon, ob Timer/Logout tatsächlich Platz
beanspruchen. Auf schmalen Geräten bleiben so nur ~170px, und längere Teamnamen
werden per `ellipsizeMode="tail"` abgeschnitten.

## Ziel

Den Teamname aus dem Header in den Hauptbereich verlagern, sodass er die volle
Bildschirmbreite nutzen kann und nicht mehr abgeschnitten wird. Der Name soll auf
allen Rallye-Screens sichtbar sein (Fragen, Voting, Scoreboard, Preparation,
NoQuestions, „alle beantwortet").

## Entscheidungen

- **Inhalt der Leiste:** nur der Teamname (mit `person.3`-Icon). Der Rallye-Name
  wandert *nicht* in die Leiste.
- **Scroll-Verhalten:** die Leiste scrollt mit dem Inhalt (kein fixierter
  Sub-Header). Bewusster Trade-off: mehr Inhaltshöhe, dafür scrollt der Name bei
  langen Listen nach oben weg.

## Architektur-Befund

Alle Status-Screens werden aus **einer einzigen Route** gerendert:
`app/(tabs)/rallye/index.tsx` gibt je nach `rallye.status` inline die jeweilige
Komponente zurück (`Voting`, `Scoreboard`, `TeamSetup`, `Preparation`,
`NoQuestions`, Fragen-Screen, „alle beantwortet"). Die Status-Komponenten sind
Imports, keine eigenen Routen. Lediglich `team-name-sheet` ist eine separate
(Modal-)Route und ist nicht betroffen.

Da die Leiste mitscrollen soll, wird sie als erstes Element in den Scroll-Inhalt
des jeweiligen Screens eingefügt (nicht als fixer Frame über dem Scroll-Bereich).

## Umsetzung

### 1. Neue Komponente `components/rallye/RallyeContextBar.tsx`

- Reine Präsentationskomponente.
- Holt das Team selbst aus dem Store (`store$.team`), analog zum bisherigen
  `RallyeHeader`.
- Layout: Zeile mit `person.3`-Icon (`IconSymbol`) + Teamname (`ThemedText`,
  `variant="label"` o.ä.).
- **Kein** `numberOfLines={1}` / `ellipsizeMode="tail"` — der Name darf über die
  volle Breite laufen und bei Bedarf umbrechen.
- Self-guard: rendert `null`, wenn `!team?.name` (gleiche Bedingung wie heute in
  `RallyeHeader`). Dadurch erscheint sie z.B. auf `TeamSetup` nicht, wo noch kein
  Name existiert.
- Theming über `useTheme` / `Colors` wie im bestehenden Header.

### 2. Einbau als oberstes Inhaltselement je Screen

`<RallyeContextBar />` wird als erstes Kind in den scrollbaren Inhalt eingefügt:

- **Fragen-Screen** (`app/(tabs)/rallye/index.tsx`, ~Zeile 308): über der
  `Frage X von Y`-Zeile.
- **Scoreboard** (`app/(tabs)/rallye/scoreboard.tsx`): erstes Kind der
  `ScreenScrollView`.
- **Voting** (`app/(tabs)/rallye/voting.tsx`): als `ListHeaderComponent` der
  `FlatList` (damit es mitscrollt).
- **Preparation / NoQuestions / „alle beantwortet"**: jeweils erstes Kind im
  Inhalt.
- **TeamSetup**: keine explizite Einbindung nötig — falls eingefügt, greift der
  Self-guard und es wird nichts gerendert.

Der Self-guard kapselt die Bedingung, sodass jeder Einfügepunkt ein Einzeiler
bleibt.

### 3. Header entrümpeln (`app/(tabs)/rallye/_layout.tsx`)

- `RallyeHeader` aus `headerLeft` entfernen (der zugehörige `View`-Wrapper
  entfällt; `headerLeft` fällt auf das Default-Verhalten zurück).
- `TimerHeader` (mittig) und Logout-Button (rechts) bleiben unverändert.
- `components/rallye/RallyeHeader.tsx` und der zugehörige Test
  `components/rallye/__tests__/RallyeHeader.test.tsx` werden gelöscht.

### 4. Redundanz in der Fortschrittszeile auflösen (`index.tsx`, ~Zeile 319)

Aktuell: `{rallye.name ? `${rallye.name} • ` : ''}` + `Frage X von Y`. Der
Rallye-Name-Präfix war eine Header-Ergänzung. Da der Header-Inhalt sich ändert
und der Teamname nun im Body lebt, wird die Zeile auf reines **„Frage X von Y"**
gekürzt (Rallye-Name-Präfix entfällt). Der Übersetzungsschlüssel
`rallye.progress` bleibt unverändert.

## Trade-offs

- **Sichtbarkeit beim Scrollen:** der Teamname scrollt bei langen Inhalten
  (Scoreboard-Ranking, viele Voting-Items) nach oben weg. Bewusst akzeptiert
  zugunsten maximaler Inhaltshöhe.
- **Vertikaler Platz:** minimaler zusätzlicher Platzbedarf am oberen Inhaltsrand
  je Screen.

## Tests

- **Neuer Test** für `RallyeContextBar`: rendert den Teamnamen bei vorhandenem
  `team.name`; rendert `null` ohne Namen.
- **Anpassen/Entfernen** des `RallyeHeader`-Tests (Komponente wird gelöscht).
- **Bestehende Tests** für `index`, `voting`, `scoreboard`, `team-setup` müssen
  weiterhin grün sein; ggf. Anpassung, wo der entfernte Rallye-Namen-Präfix oder
  der Header getestet wurde.
- Nach jedem Schritt: `npm run lint`, `npx tsc --noEmit`, `npm test`.

## Nicht im Scope

- Fixierte Sub-Header-Leiste (verworfen zugunsten „mitscrollen").
- Anzeige des Rallye-Namens in der Leiste.
- Antippbare Volltext-Anzeige des Teamnamens.
