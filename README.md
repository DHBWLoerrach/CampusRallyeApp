# DHBW_CampusRallyeApp

Projekt der Studienarbeit an der DHBW Lörrach durch Studierende.

## Setup für Entwickler
Voraussetzungen für das erfolgreiche Weiterentwickeln und lokale Testen dieses Projekts sind folgende:
- NodeJs ist auf dem Entwicklungsgerät installiert.
- Es ist ein Quelltext-Editor installiert.
- yarn muss installiert sein (npm install yarn).
- Ein Supabase Projekt wurde angelegt mit der entsprechenden Tabellenstruktur oder es besteht Zugriff auf das vorher verwendete Projekt.

1. Zunächst muss das Github-Repository in Visual Studio Code (oder einem anderen geeigneten Quelltext-Editor) zur Verfügung stehen. Hierfür kann der Entwickler:
> - das Repository als zip herunterladen, entpacken, in Visual Studio Code öffnen und Git initialisieren (`git init`).
> - das Repository mit Git klonen 
`git clone git@github.com:DHBWLoerrach/CampusRallyeApp.git` 
und ggf. in das richtige Verzeichnis wechseln.

2. Anschließend müssen mit yarn die Abhängigkeiten bzw. npm-Pakete in NodeJS installiert werden: 
`yarn install`

3. Nun muss noch die app.json Datei angepasst werden. Hier müssen nun die Google Maps Konfigurationen unter android und ios angepasst werden. Um die Nutzung von Google Maps zu ermöglichen, müssen die Maps SDKs jeweils für Android und iOS aktiviert werden und ein API Key erstellt werden. Eine Anleitung hierzu findet sich in der Expo Dokumentation zur Verwendung der MapView: https://docs.expo.dev/versions/latest/sdk/map-view/ (Hinweis: Verwende den Link in der Dokumentation unter “Create API Key” zum Erstellen des Keys. Bei anderen Vorgehensweisen wird sonst nach einem Rechnungskonto gefragt (trotz kostenloser Nutzung der API Keys). In Absprache mit den Verantwortlichen der DHBW kann hier natürlich auch ein von der DHBW gestelltes Mailkonto und auch ein Rechnungskonto verwendet werden. Für die Angabe des Package Namen bzw. Bundle Identifier muss dieser erst zur Verfügung stehen. Dies ist nach dem ersten Start eines Builds möglich (https://docs.expo.dev/build/setup/). Es genügt, den ersten Build zu starten und anschließend wieder abzubrechen. Der Package Name bzw. Bundle Identifier sollte nun in der app.json zu sehen sein.)
Der API Key wird dann wie in der Dokumentation beschrieben an der entsprechenden Stelle in der app.json eingefügt (neben der config stehen natürlich noch weitere Konfigurationen unter android und ios):

`"android": {"config":{"googleMaps": {"apiKey":"YOUR_API_KEY"} } },
"ios": {"config":{"googleMaps": {"apiKey":"YOUR_API_KEY"} } },`

4. Zum Schluss muss noch die Konfiguration zu Supabase in der Datei supabase.js angepasst werden. Hier müssen die URL und der Anon Key an der entsprechenden Stelle im Code (siehe Kommentare im Code) eingefügt werden. Diese sind in den Einstellungen des Supabase Projekts in den API Einstellungen zu finden
5. Nun kann die App getestet und weiterentwickelt werden. Für das aktive Testen muss nun mit `npx expo start` der Server gestartet werden. Nun kann die entwickelte App in der Expo Go App getestet werden. Entweder über einen Scan des QR-Codes oder einen Login in der App. Des Weiteren kann man die App auf Emulatoren starten. Informationen hierzu werden direkt auf der Konsole angezeigt.
Solange der Server läuft, wird nun jede Änderung des Codes direkt angezeigt, sobald sie gespeichert wurde. So können kleinste Änderungen im Code schnell getestet werden.
