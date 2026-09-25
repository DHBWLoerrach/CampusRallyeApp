# Campus Rallye

Dieser Kontext definiert die gemeinsame Fachsprache für Inhalte, Standorte und Rallyes der Campus-Rallye. Beziehungen, fachliche Zielregeln, Implementierungsstand und offene Fragen stehen im [begleitenden Domänenmodell](docs/domain-model.md).

## Sprache

### Standorte und Bereiche

**Standort**:
Ein DHBW-Standort, unter dem Bereiche und eine Campus-Tour verwaltet werden.
_Vermeiden_: Organisation, Mandant, Zwischenebene

**Bereich**:
Eine fachliche Gruppe innerhalb eines Standorts, die Rallyes für eine bestimmte Zielgruppe oder einen bestimmten Zweck anbieten kann.
_Vermeiden_: Department, Abteilung

**Studiengang**:
Ein Bereich, der einen akademischen Studiengang repräsentiert.
_Vermeiden_: Program department

**Studienzentrum**:
Ein Bereich, der mehrere zusammengehörige Studiengänge bündelt.
_Vermeiden_: Study center

### Rallyes

**Rallye**:
Eine spielbare Zusammenstellung von Fragen für eine Campus-Tour oder einen Bereich.
_Vermeiden_: Tour

**Campus-Tour**:
Eine Rallye, die ein Standort als freie Erkundungstour verwendet, ohne Teams, Spielzeit oder gespeicherte Antworten. Eine Campus-Tour enthält keine Upload-Fragen.
_Vermeiden_: Erkundungsmodus, Tour-Mode

**Team-Rallye**:
Ein konkreter Rallye-Durchlauf, bei dem Teams teilnehmen, Team-Antworten erhalten bleiben und die Spielzeit erfasst wird. Eine Team-Rallye enthält höchstens eine Upload-Frage und damit höchstens eine Abstimmungsfrage.
_Vermeiden_: Team event, Rallye-Durchlauf

**Bereichs-Rallye**:
Eine Team-Rallye, die von genau einem Bereich angeboten wird.
_Vermeiden_: Event-Rallye

**Studiengangs-Rallye**:
Eine Bereichs-Rallye, deren Bereich ein Studiengang ist.
_Vermeiden_: Program rallye

**Studienzentrums-Rallye**:
Eine Bereichs-Rallye, deren Bereich ein Studienzentrum ist.
_Vermeiden_: Study center rallye

**Rallye-Vorlage**:
Eine nicht spielbare, wiederverwendbare Vorlage, aus der konkrete Team-Rallyes erstellt werden können.
_Vermeiden_: Wiedergeöffnete Rallye

**Rallye-Code**:
Ein geteilter Zugangscode, mit dem Teilnehmende eine Team-Rallye in der App betreten.
_Vermeiden_: Passwort

**Rallye-Ende**:
Das Ende einer Rallye wird durch Adminstratoren in der campus-rallye-admin-Webapp manuell ohne bestimmten Zeitpunkt festgelegt.
_Vermeiden_: Endzeitpunkt, end time

### Fragen

**Frage**:
Eine wiederverwendbare Frage, die unabhängig von einer konkreten Rallye existiert.
_Vermeiden_: Katalogfrage, question template

**Frage-Herkunft**:
Die fachliche Herkunft einer Frage, entweder Standort oder Bereich.
_Vermeiden_: Eigentümer, Owner, Ownership

**Standortfrage**:
Eine Frage, die zu genau einem Standort gehört und in Rallyes aller Bereiche dieses Standorts verwendet werden darf.
_Vermeiden_: allgemeine Frage

**Bereichsfrage**:
Eine Frage, die zu genau einem Bereich gehört und nur in Rallyes dieses Bereichs verwendet werden darf.
_Vermeiden_: private Frage

**Rallye-Frage**:
Eine Frage, die einer konkreten Rallye zugeordnet ist.
_Vermeiden_: Assigned question

**Vorlagen-Frage**:
Eine Frage, die einer Rallye-Vorlage zugeordnet ist.
_Vermeiden_: Template question

**Lösungsoption**:
Eine vorbereitete Antwortmöglichkeit einer Frage.
_Vermeiden_: Antwort

**Fragebild**:
Ein Bild, das Teil einer Bildfrage ist.
_Vermeiden_: Bild, uploaded image

**QR-Code**:
Die maschinenlesbare Darstellung der Lösungsoption einer QR-Code-Frage.
_Vermeiden_: QR image

**Kategorie**:
Ein frei vergebener Ordnungsbegriff für Fragen.
_Vermeiden_: Category tag

**Hinweis**:
Eine optionale Hilfestellung zu einer Frage.
_Vermeiden_: Help text

**Hinweiskosten**:
Der einmalige Abzug von einem Punkt bei der Bewertung einer Frage, deren Hinweis genutzt wurde, begrenzt auf mindestens null Punkte; Hinweise zu Upload-Fragen sind kostenlos.
_Vermeiden_: Strafpunkte

**Punktwert**:
Die maximal erreichbare Punktzahl einer Frage.
_Vermeiden_: Punkte

### Fragetypen

**Wissensfrage**:
Eine Frage mit freier Texteingabe und einer erwarteten Lösungsoption.
_Vermeiden_: Knowledge question

**Multiple-Choice-Frage**:
Eine Frage mit mehreren Lösungsoptionen, von denen genau eine korrekt ist.
_Vermeiden_: Multiple Choice

**Bildfrage**:
Eine Frage mit einem Bild als Teil der Aufgabenstellung, freier Texteingabe und einer erwarteten Lösungsoption.
_Vermeiden_: Bild

**QR-Code-Frage**:
Eine Frage, deren Lösungsoption als QR-Code bereitgestellt wird.
_Vermeiden_: QR Code

**Upload-Frage**:
Eine Frage, die ein Upload-Foto als Team-Antwort erwartet.
_Vermeiden_: Upload

**Geocaching-Frage**:
Eine Frage, die an einen geografischen Zielort gebunden ist. Sie gilt als erreicht, wenn Teilnehmende innerhalb eines Näherungsbereichs um den Zielort sind, und wird per Freitext oder QR-Code beantwortet.
_Vermeiden_: GPS-Frage, Standortfrage

### Antworten, Bewertung und Ergebnis

**Team**:
Eine teilnehmende Gruppe in einer Team-Rallye.
_Vermeiden_: Spieler, Teilnehmergruppe

**Teilnehmende**:
Personen, die eine Rallye in der Rallye-App nutzen.
_Vermeiden_: Spieler, users

**Rallye-Sitzung**:
Die bestehende Teilnahme an einer Rallye in der Rallye-App, die erreichbar bleibt, auch wenn die Rallye nicht mehr beitretbar ist.
_Vermeiden_: Rallye Session

**Team-Antwort**:
Die Antwort, die ein Team zu einer Rallye-Frage abgibt.
_Vermeiden_: Antwort, submission

**Upload-Foto**:
Ein Foto, das ein Team als Team-Antwort zu einer Upload-Frage abgibt.
_Vermeiden_: Upload answer, photo answer

**Bewertung**:
Die Entscheidung, wie viele Team-Punkte eine Team-Antwort erhält.
_Vermeiden_: Scoring

**Team-Punkte**:
Die Punkte, die ein Team für eine Rallye-Frage erhält.
_Vermeiden_: Punkte

**Ergebnis**:
Die Rangliste der Teams einer Team-Rallye.
_Vermeiden_: Result

**Endstand**:
Das finale angezeigte Ergebnis einer Team-Rallye.
_Vermeiden_: Final ranking

**Spielzeit**:
Die erfasste Dauer der Teilnahme eines Teams bis zur Beantwortung aller Fragen; sie beeinflusst die Platzierung nicht.
_Vermeiden_: Time played, duration

### Status

**Campus-Tour-Status**:
Die Sichtbarkeitsphase einer Campus-Tour.
_Vermeiden_: Rallye-Status

**Aktiv**:
Ein Campus-Tour-Status, in dem die Campus-Tour in der Rallye-App sichtbar und spielbar ist.
_Vermeiden_: Gestartet

**Inaktiv**:
Ein Campus-Tour-Status, in dem die Campus-Tour nicht zur Auswahl und zum Spielen angeboten wird.
_Vermeiden_: Abgeschlossen

**Team-Rallye-Status**:
Die Lebenszyklusphase einer Team-Rallye.
_Vermeiden_: Rallye-Status, State

**Entwurf**:
Ein Team-Rallye-Status, in dem die Team-Rallye eingerichtet wird und noch unvollständig sein kann.
_Vermeiden_: Draft

**Bereit**:
Ein Team-Rallye-Status, in dem die Rallye in der Rallye-App sichtbar, aber noch nicht spielbar ist.
_Vermeiden_: Ready

**Läuft**:
Ein Team-Rallye-Status, in dem Teams die Team-Rallye aktiv spielen können.
_Vermeiden_: Running

**Abstimmung**:
Ein Team-Rallye-Status kurz vor Abschluss, in dem Teams nach Freigabe durch den Organisator die Upload-Fotos anderer Teams bewerten.
_Vermeiden_: Voting

**Abstimmungsfrage**:
Eine Upload-Frage in einer Team-Rallye, deren Upload-Fotos in der Abstimmung bewertet werden. Nur Upload-Fragen können Abstimmungsfragen sein.
_Vermeiden_: Voting question

**Ergebnisse**:
Ein Team-Rallye-Status, in dem das Ergebnis sichtbar, aber noch nicht final ist.
_Vermeiden_: Results

**Abgeschlossen**:
Ein Team-Rallye-Status, in dem die Team-Rallye geschlossen und der Endstand final ist.
_Vermeiden_: Ended

**Beitretbare Rallye**:
Eine Rallye, die Teilnehmende in der Rallye-App neu auswählen und betreten können; bei Team-Rallyes sind dies die Status Bereit und Läuft.
_Vermeiden_: Aktive Rallye, Joinable Rallye

### Bearbeitung und Apps

**Admin-App**:
Die Webanwendung, in der Bearbeitende Standorte, Bereiche, Rallyes und Fragen verwalten.
_Vermeiden_: App

**Rallye-App**:
Die mobile App, in der Teilnehmende Rallyes nutzen.
_Vermeiden_: App, mobile App

**Bearbeitende**:
Personen, die Inhalte oder Struktur in der Admin-App pflegen dürfen.
_Vermeiden_: Mitarbeitende, User, staff user

**Admin**:
Ein Bearbeitender mit Vollzugriff auf Standorte, Bereiche, Rallyes und Fragen.
_Vermeiden_: Superuser

**Organisator**:
Ein Bearbeitender, der eine konkrete Team-Rallye durchführt und Status sowie Abstimmung steuert.
_Vermeiden_: Admin

**Zuständigkeit**:
Der fachliche Verantwortungsbereich eines Bearbeitenden für einen Standort oder einen Bereich.
_Vermeiden_: Rolle, permission scope, ownership

**Standort-Zuständigkeit**:
Eine Zuständigkeit für einen Standort, dessen Bereiche und die dazugehörigen Rallyes und Fragen.
_Vermeiden_: Standort-Rolle

**Bereichs-Zuständigkeit**:
Eine Zuständigkeit für einen Bereich und die dazugehörigen Rallyes und Fragen.
_Vermeiden_: Bereichs-Rolle

**Berechtigung**:
Ein aus Rolle und Zuständigkeit abgeleitetes Zugriffsrecht in der Admin-App.
_Vermeiden_: Zuständigkeit
