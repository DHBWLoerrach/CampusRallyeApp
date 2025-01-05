# Campus Rallye App

Smartphone App für die Campus Rallye im ersten Semester an der [DHBW Lörrach](https://dhbw-loerrach.de).

Basierend auf den Ergebnissen von Studienarbeiten an der DHBW Lörrach durchgeführt
am [Studienzentrum IT-Management & Informatik](https://dhbw-loerrach.de/szi).

## Setup für Entwickler

### Vorbereitungen (Supabase)

Die Daten werden in Supabase gespeichert. Zur Weiterentwicklung und
Test der Webanwendung sollte diese mit einer lokalen Supabase-Instanz
auf dem eigenen Rechner verknüpft werden. Die Einrichtung einer lokalen
Supabase-Instanz wird in der
[Supabase-Dokumentation](https://supabase.com/docs/guides/local-development/cli/getting-started) beschrieben.

Hier werden die für dieses Projekt benötigten Schritte aufgelistet:

- Supabase CLI installieren, siehe [Supabase-Dokumentation](https://supabase.com/docs/guides/local-development/cli/getting-started)
- [Docker](https://www.docker.com) installieren (Docker Desktop)
- Verzeichnis für die lokale Supabase-Instanz erstellen, z.B. `projects/rallye-db`
- Im Terminal in das eben erstellte Verzeichnis wechseln (`cd rallye-db`)
- Dort diesen Befehl ausführen: `supabase init`
- Supabase starten mit `supabase start` (Docker-Images werden heruntergeladen)
- Aktuelles Datenbankschema und Datenbankinhalt vom Projektverantwortlichen anfragen
- Das Datenbankschema als SQL-Datei speichern unter `rallye-db/supabase/migrations/`
- Den Datenbankinhalt als Datei `seed.sql` speichern unter `rallye-db/supabase/`
- Datenbank aus der Schema-SQL-Datei erstellen mit `supabase db reset`

Wenn alles geklappt hat, dann kann die lokale Supabase-Instanz mit dem Webinterface im Browser verwaltet werden: http://127.0.0.1:54323

Die Supabase-Instanz kann folgendermaßen heruntergefahren werden: `supabase stop`

### Code der Campus Rallye App

Voraussetzungen für die Weiterentwicklung dieses Projekts sind folgende:

- Node.js ist auf dem Entwicklungsgerät installiert.
- Die lokale Supabase-Instanz wurde eingerichtet (siehe oben)

1. Dieses Github-Repository clonen (mit `git clone git@github.com:DHBWLoerrach/CampusRallyeApp.git` oder einem Git-Client).

1. In einem Terminal ins Verzeichnis des geclonten Repositories wechseln.

1. Anschließend müssen mit npm die Abhängigkeiten bzw. npm-Pakete in NodeJS installiert werden:
   `npm install`

1. Zum Schluss muss noch die Konfiguration zu Supabase angepasst werden. Dazu ist zunächst die Datei `.env` im Projektverzeichnis zu erstellen. In `.env` müssen zwei Einträge vorgenommen werden:

```
EXPO_PUBLIC_SUPABASE_URL=http://SERVER:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=SUPABASE_ANON_KEY
```

Der Eintrag für `EXPO_PUBLIC_SUPABASE_URL` muss die IP-Adresse
des Servers enthalten. Wird die App auf einem iPhone-Simulator oder
Android-Emulator auf dem Rechner ausgeführt, der die Supabase-Instanz
bereitstellt, dann kann für `SERVER` die IP-Adresse von „localhost“
eingesetzt werden:

```
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
```

Wird die App auf einem Smartphone ausgeführt, dann ist für
`SERVER` die IP-Adresse des Rechners einzutragen, auf dem
die Supabase-Instanz läuft.

Für `EXPO_PUBLIC_SUPABASE_ANON_KEY` muss der Anon Key der
Supbase-Instanz eingefügt werden. Dieser kann im Terminal
abgefragt werden (dazu ins Verzeichnis der lokalen
Supabase-Instanz wechseln):

```sh
supabase status
```

Nun kann die App getestet und weiterentwickelt werden. Für das aktive Testen muss nun mit `npx expo -g` der Server gestartet werden. Die App kann in Expo Go App getestet werden (Scan des QR-Codes). Informationen hierzu werden direkt auf der Konsole angezeigt.

Die Anmeldedaten für die Teilnahme an einer Rallye in der App können aus den
entsprechenden Tabellen in der Supabase-Instanz in Erfahrung gebracht werden.

### App mit Expo testen

`npx expo start -g` started den Metro-Bundler, um die App auf einem Smartphone oder Emulator/Simulator in der Expo Go App zu testen.

### Development Builds der App erstellen

Dies setzt die Installation und Konfiguration des Android-SDKs und XCode (nur auf macOS) voraus.

`npx expo prebuild` erstellt einen Prebuild, wodurch im Projekt die Dateiordner der nativen Apps erstellt werden (`android` und `ios`). Der Zusatz `--clean` entfernt die beiden Dateiordner `android` und `ios` und erstellt sie neu (daher sind diese nicht im git-Repository).

`npx expo run:ios --device` und `npx expo run:android --device` erstellt lokale Dev-Builds der nativen App und fragt nach dem gewünschten Smartphone/Simulator/Emulator für die Installation der App.

`npx expo start -d` startet den Metro-Bundler für einen Dev-Build.

Wenn ein Android-Testgerät über USB-Kabel verbunden wird, dann kann der Metro-Bundler mit `--localhost` gestartet werden, um die Verbindung zur App „kabelgebunden“ herzustellen: `npx expo start -d --localhost`

## Veröffentlichung im App/Play Store

`eas build` erstellt die nativen Apps in der Cloud mit [Expo EAS](https://expo.dev/eas).

`eas submit` liefert die nativen Apps zunächst als Betaversion in den App/Play Store aus. Die Android-Version wird automatisch als Beta (offener Test) veröffentlicht. Für das iPhone muss der neue erstellte Build der App im App Store für die Beta Tester in Testflight zur Veröffentlichung beantragt werden.

Nach einer Veröffentlichung einer neuen Produktionsversion sollte der Eintrag für `version` in `app.json` erhöht werden (als eigener Commit „_Bump version to x.y.z_”)
