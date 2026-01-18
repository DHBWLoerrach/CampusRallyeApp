# Join-Schutz (Roadmap): Serverseitig + QR-Code

## Kontext / Motivation
Aktuell nutzen wir ein einfaches Rallye-Passwort, um „ungewollte Teilnahme“ zu reduzieren (soft barrier).
Das Passwort ist **nicht als Geheimnis** gedacht (keine sensitiven Daten), sondern als pragmatische Hürde gegen Zufalls-Teilnahmen.

Wir haben uns bewusst dafür entschieden, das Passwort **kurzfristig „untrusted“** zu handhaben:
- Die App lädt das Passwort (z.B. über `SELECT * FROM rallye`) mit herunter.
- Die App prüft das Passwort **clientseitig**.

Das ist aktuell **akzeptiert**, aber langfristig nicht ideal, weil es das Passwort faktisch entwertet (wer es wirklich will, kann es aus App/Netzwerk/State auslesen).

## Zielbild
Premium-/Trust-Level erhöhen, ohne unnötige Friktion:
- **Kurzfristig**: Password-Barrier bleibt, aber UX ist sauber (Rallyes ohne Passwort funktionieren).
- **Als nächstes**: Passwortprüfung **serverseitig** (Supabase RPC) + Policies, sodass das Passwort nicht mehr im Client auftaucht.
- **Mittelfristig**: Join per **QR-Code / Einladungs-Token** (Event-typisch, vor Ort scanbar), ggf. kombiniert mit Passwort.

## Nicht-Ziele (bewusste Abgrenzung)
- Kein vollständiges „Security“-System (kein echtes Identity-/Login-System).
- Keine Garantie, dass niemand mit genug Motivation beitreten kann (ohne Auth ist das grundsätzlich begrenzt).
- Keine Offline-Join-Garantie für geschützte Rallyes (nur wenn wir später signierte Tokens einführen).

---

## Phase 0 (JETZT): „Untrusted“ Passwort-Join (Status Quo)
### Verhalten
- Rallyes **ohne Passwort** (`NULL` oder `''`) → Join ohne Eingabe.
- Rallyes **mit Passwort** → Passwortfeld sichtbar, Join erst nach Eingabe, Prüfung clientseitig.

### Bekannte Trade-offs / Risiken
- Passwort kann aus App/Netzwerk/State extrahiert werden → Barrier nur gegen „Zufall“, nicht gegen Absicht.
- Passwort kann (je nach Flow) lokal persistiert werden, wenn wir die komplette Rallye-Zeile speichern.

### Warum wir das vorerst so lassen
- Änderung auf serverseitige Prüfung + RLS/RPC betrifft DB-Policies und App-Flow → höheres Risiko/Scope.
- Wir verschieben die „richtige“ Lösung bewusst in eine separate, klar abgegrenzte Umsetzung.

---

## Phase 1: Serverseitige Passwortprüfung (RPC) + RLS/Policies
### Ziel
Client soll **nie** das Rallye-Passwort sehen oder speichern.
Die App bekommt nur ein Ergebnis: „ok / nicht ok“ (plus optional „password_required“).

### Kernidee
1. Rallye-Liste liefert **kein `password`** mehr.
2. Join prüft Passwort über eine **Supabase RPC** (oder ein dediziertes „Join“-Endpoint/Function).
3. RLS/Policies verhindern das Auslesen der Passwort-Spalte.

### Beads / Tasks (feingranular)
1) **DB/RPC: `validate_rallye_password`**
   - Funktion (z.B.) `validate_rallye_password(rallye_id int, password text) returns boolean`.
   - Gibt nur `true/false` zurück (kein Passwort, keine Details).
   - Logging/Rate-Limit (optional) für Missbrauchserkennung.

2) **DB: `password_required` Flag (optional, aber sehr hilfreich für UX)**
   - Variante A: View `rallye_public` mit `password_required = (password is not null and password <> '')`.
   - Variante B: Zusätzliches computed Feld über RPC.
   - Ziel: App kann UI korrekt anzeigen (Lock-Icon / Passwortfeld), ohne Passwort zu kennen.

3) **Supabase RLS/Policies**
   - `SELECT` auf `rallye.password` für anonyme Clients verhindern (mindestens per View/Spaltenauswahl in Queries).
   - Falls möglich: Row-Level `SELECT` auf `rallye` nur über `rallye_public` erlauben.
   - Sicherstellen, dass RPC ausführbar bleibt (ggf. `SECURITY DEFINER` + sauberer `search_path`).

4) **App: Rallye-Liste auf „public select“ umstellen**
   - `getActiveRallyes()`/`onRefresh()` nicht mehr `select('*')`, sondern nur die public Felder (oder View).
   - UI-Logik nutzt `password_required` statt `password`.

5) **App: Join-Flow umstellen**
   - Wenn `password_required`:
     - Passwortfeld anzeigen
     - Join: RPC aufrufen, bei `false` → „Falsches Passwort“
   - Wenn **nicht** required:
     - Kein Passwortfeld
     - Join ohne RPC (oder RPC, die „ok“ zurückgibt)
   - Offline-Fall: Wenn required und offline → klarer Hinweis („Zum Beitreten ist Internet nötig“).

### Abhängigkeiten
- DB-Migrationen + RLS müssen vor App-Rollout sauber stehen, sonst bricht Join.
- Koordination: Welche Clients sind im Feld? (Versionen/Backward-Compat)

### Definition of Done (Phase 1)
- Rallye-Passwörter sind nicht mehr in Client-Requests für Listen enthalten.
- App kann nur noch über RPC beitreten, wenn Passwort erforderlich ist.
- Policies verhindern das triviale Auslesen des Passworts über normale Selects.

---

## Phase 2 (mittelfristig): Join per QR-Code / Einladungs-Token
### Ziel
„Vor-Ort“-Join: Wer den QR-Code am Treffpunkt scannt, kann beitreten.
Das reduziert zufällige Teilnahme stark und fühlt sich „Event/Premium“ an.

### UX-Idee
- „Rallye beitreten“ → Button „QR scannen“ (+ optional „Code manuell eingeben“).
- QR enthält einen Join-Token (nicht nur Rallye-ID).
- App sendet Token an Server → Server gibt Rallye frei.

### Beads / Tasks (feingranular)
1) **DB: Token-Modell**
   - Tabelle `rallye_join_tokens` (Beispiel):
     - `token_hash`, `rallye_id`, `expires_at`, `max_uses`, `uses`, `created_at`, `revoked_at`
   - Tokens nur gehasht speichern (Token selbst nie im Klartext in DB).

2) **RPC: `redeem_join_token`**
   - Input: `token` (Klartext, nur transient), Output: `ok`, `rallye_id` (+ ggf. public Rallye-Daten).
   - Invalid/expired/revoked/overused → `ok=false`.
   - Optional: Ausgabe einer kurzlebigen „join session“ (wenn wir später stärker erzwingen wollen).

3) **Admin/Operations**
   - Tooling/Script (oder Admin UI), um Tokens zu erzeugen und als QR auszudrucken.
   - Prozess: Token-Rotation (vor Rallye), Sperren bei Leak.

4) **App: QR-Scanner-Flow**
   - Scanner Screen (Expo Camera) oder Reuse vorhandener QR-Komponenten.
   - Robustheit: Taschenlampe, Fehlerzustände, Manual Fallback.
   - Nach Erfolg: Rallye setzen + Team-Setup wie gewohnt.

5) **Transition / Kompatibilität**
   - Übergangsmodus: Passwort + QR parallel möglich.
   - Langfristig: QR ersetzt Passwort oder wird „Preferred“.

### Definition of Done (Phase 2)
- Join ist ohne QR/Token nicht möglich (für entsprechend konfigurierte Rallyes).
- QR-Join ist zuverlässig, schnell, verständlich und fühlt sich „premium“ an.

---

## Offene Fragen (für später klären)
- Soll QR-Join offline funktionieren? (nur möglich mit signierten Tokens + lokaler Verifikation; deutlich mehr Aufwand)
- Brauchen wir Rate-Limiting/Bruteforce-Schutz serverseitig?
- Wollen wir pro Team einen Token (stärkerer Schutz) oder pro Rallye (einfacher)?

