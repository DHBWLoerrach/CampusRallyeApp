# Campus Rallye App

Smartphone App für die Campus Rallye im ersten Semester an der [DHBW Lörrach](https://dhbw-loerrach.de).

Basierend auf den Ergebnissen von Studienarbeiten an der DHBW Lörrach durchgeführt
am [Studienzentrum IT-Management & Informatik](https://dhbw-loerrach.de/szi).

## Setup für Entwickler

Voraussetzungen für das erfolgreiche Weiterentwickeln und lokale Testen dieses Projekts sind folgende:

- NodeJs ist auf dem Entwicklungsgerät installiert.
- Es ist ein Quelltext-Editor installiert.
- Ein Supabase Projekt wurde angelegt mit der entsprechenden Tabellenstruktur oder es besteht Zugriff auf das vorher verwendete Projekt.

1. Dieses Github-Repository clonen (mit `git clone git@github.com:DHBWLoerrach/CampusRallyeApp.git` oder einem Git-Client).

1. In einem Terminal ins Verzeichnis des geclonten Repositories wechseln.

1. Anschließend müssen mit npm die Abhängigkeiten bzw. npm-Pakete in NodeJS installiert werden:
   `npm install`

1. Zum Schluss muss noch die Konfiguration zu Supabase angepasst werden. Dazu ist zunächst die Datei `.env` im Projektverzeichnis zu erstellen. In `.env` müssen zwei Einträge vorgenommen werden:
```
EXPO_PUBLIC_SUPABASE_URL=SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY=SUPABASE_ANON_KEY
```
Dort müssen nun die URL der Supabase-DB und der Anon Key eingefügt werden. Diese sind in den Einstellungen des Supabase Projekts in den API Einstellungen zu finden.

Nun kann die App getestet und weiterentwickelt werden. Für das aktive Testen muss nun mit `npx expo -g` der Server gestartet werden. Die App kann in Expo Go App getestet werden (Scan des QR-Codes). Informationen hierzu werden direkt auf der Konsole angezeigt.
