# Campus Rallye App

Smartphone App für die Campus Rallye im ersten Semester an der [DHBW Lörrach](https://dhbw-loerrach.de).

Basierend auf den Ergebnissen von Studienarbeiten an der DHBW Lörrach durchgeführt
am [Studienzentrum IT-Management & Informatik](https://dhbw-loerrach.de/szi).

## Setup für Entwickler

### Vorbereitungen (Supabase)

Die Daten werden in Supabase gespeichert. Zur Weiterentwicklung und
Test der Webanwendung kann entweder eine eigene Supabase-Instanz in 
der Cloud erstellt werden oder es wird einge lokale Supabase-Instanz
auf dem eigenen Rechner eingerichtet. 

#### Supabase in der Cloud

- Bei https://supabase.com kostenlos anmelden
- In Supabase ein neues Projekt erstellen (z.B. `CampusRallye`)
- Im Supabase-Projekt zum _SQL Editor_ wechseln (via linker Seitenleist)
- Das SQL-Schema aus dem zugehörigen Backend-Projekt kopieren (siehe Datei `supabase/schema.sql` in https://github.com/DHBWLoerrach/campus-rallye-admin)
- SQL-Schema im SQL-Editor einfügen und ausführen
- Daten erstellen (siehe unten)

#### Lokale Supabase
Die Einrichtung einer lokalen Supabase-Instanz wird in der
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

#### Daten erstellen

Rallyes und Fragen können direkt im _Table Editor_ des Supabase-Projekts erstellt werden. 

In der Tabelle `rallye` zwei neue Rallyes bzw. zwei neue Zeilen eintragen (_Insert row_):

- Name: Rallye, Studiengang: Informatik, Status `running` und `end_time` in der Zukunft, `tour_mode=FALSE`
- Name: Erkundung, Studiengang: Allgemein, Status `running` und `end_time` in der Zukunft, `tour_mode=TRUE`

In der Tabelle `questions` ein paar Fragen mit Punkten erstellen (z.B. Typ _knowledge_), dazu passende Antwort(en) in 
`answers` mit `question_id` der Frage eintragen und  und in `join_rallye_questions` den Rallyes zuordnen.

Möglich ist auch die lokale Einrichtung und Verwendung der Webandwendung zur Verwaltung 
von Campus Rallyes. Im GitHub-Projekt (https://github.com/DHBWLoerrach/campus-rallye-admin)
ist eine Anleitung zur Einrichtung beschrieben.

### Code der Campus Rallye App

Voraussetzungen für die Weiterentwicklung dieses Projekts sind folgende:

- Node.js ist auf dem Entwicklungsgerät installiert.
- Die lokale Supabase-Instanz wurde eingerichtet (siehe oben)

1. Dieses Github-Repository clonen

1. In einem Terminal ins Verzeichnis des geclonten Repositories wechseln.

1. Anschließend müssen mit npm die Abhängigkeiten bzw. npm-Pakete in NodeJS installiert werden:
   `npm install`

1. Zum Schluss muss noch die Konfiguration zu Supabase angepasst werden. Dazu ist zunächst die Datei `.env` im Projektverzeichnis zu erstellen. In `.env` müssen zwei Einträge vorgenommen werden:

```
EXPO_PUBLIC_SUPABASE_URL=http://SERVER:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=SUPABASE_ANON_KEY
```

#### Supabase in der Cloud

Im Webinterface von Supabase oben auf _Connect_ klicken und die Daten im Reiter _Mobile Frameworks_ verwenden.

Der benötigte API-Key ist unter _Project Settings_ (Zahnrad in der linken Seitenleiste) und dort unter _API Keys_ zu finden.

**Achtung:** In `.env` muss der API-Key wie folgt eingetragen werden:

```
EXPO_PUBLIC_SUPABASE_ANON_KEY=API_KEY_HERE
```

#### Lokale Supabase-Instanz

```
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
```

Wird die App auf einem Smartphone ausgeführt, dann ist für
`SERVER` die IP-Adresse des Rechners einzutragen, auf dem
die lokale Supabase-Instanz läuft.

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
Dazu muss die App _Expo Go_ (https://expo.dev/go) auf dem Handy installiert sein und der QR-Code gescannt werden (Android: in Expo Go, iOS: via Kamera-App).

Hinweis: Im DHBW-Wlan muss der Metro-Bundler mit „Tunnel“-Option gestartet werden:  `npx expo start -g --tunnel`

### Development Builds der App erstellen

Dies setzt die Installation und Konfiguration des Android-SDKs und XCode (nur auf macOS) voraus.

`npx expo prebuild` erstellt einen Prebuild, wodurch im Projekt die Dateiordner der nativen Apps erstellt werden (`android` und `ios`). Der Zusatz `--clean` entfernt die beiden Dateiordner `android` und `ios` und erstellt sie neu (daher sind diese nicht im git-Repository).

`npx expo run:ios --device` und `npx expo run:android --device` erstellt lokale Dev-Builds der nativen App und fragt nach dem gewünschten Smartphone/Simulator/Emulator für die Installation der App.

`npx expo start -d` startet den Metro-Bundler für einen Dev-Build.

Wenn ein Android-Testgerät über USB-Kabel verbunden wird, dann kann der Metro-Bundler mit `--localhost` gestartet werden, um die Verbindung zur App „kabelgebunden“ herzustellen: `npx expo start -d --localhost`

## Veröffentlichung im App/Play Store

`eas build` erstellt die nativen Apps in der Cloud mit [Expo EAS](https://expo.dev/eas).

`eas submit` liefert die nativen Apps zunächst als Betaversion in den App/Play Store aus. Die Android-Version wird automatisch als Beta (offener Test) veröffentlicht. Für das iPhone muss der neue erstellte Build der App im App Store für die Beta Tester in Testflight zur Veröffentlichung beantragt werden.

Nach erfolgter Veröffentlichung einer neuen Produktionsversion sollte der Eintrag für `version` in `app.json` erhöht werden (als eigener Commit „_Bump version to x.y.z_“)
