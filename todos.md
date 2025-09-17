**siehe auch GitHub Project und LogSeq**

# Next

- Neue Screenshots der App in AppStore/PlayStore
- Abstimmung (Voting)
- Gruppenfoto (Upload-Question)
- Testen
- s.a. Backlog in GitHub Projekt

# New ui primitives

- Native Tabs
  - Guide: https://docs.expo.dev/router/advanced/native-tabs/
  - Reference: https://docs.expo.dev/versions/latest/sdk/router-native-tabs/
- Expo UI (SwiftUI, Jetpack Compose)
  - Guide: https://docs.expo.dev/guides/expo-ui-swift-ui/
  - Reference: https://docs.expo.dev/versions/latest/sdk/ui/
  - warten bis stabil und auch Android unterstützt wird
- Glass Effect: https://docs.expo.dev/versions/latest/sdk/glass-effect/
- Updates dazu im Expo Blog und Changelog:
  - https://expo.dev/blog
  - https://expo.dev/changelog
- hier testen und dann auch in die Campus App einbauen

# Mögliche weitere Schritte

- Offline-Funktionalität testen (siehe `services/storage/Store.ts`)
- Die Zeit, die ein Team zum beantworten der Fragen gebraucht hat, soll bei Gleichstand mit in das Ranking einfließen
- Gleichzeitige Teilnahme an verschiedenen Rallyes ermöglichen?
- Ein Live-Leaderboard während die Rallye gespielt wird
- Upload-Fragen: Eine tiefere Strukturierung mit Unterordner in den Buckets
- Buckets: Aktuell "Public-Buckets". Sicherheit und Datenschutz klären
- Grundsätzliches überdenken der Offline-Handling-Strategie: Entweder eine Offline-Queue, wie sie bereits teilweise implementiert ist, oder alle Daten werden erst am Ende und bei bestehender Netzwerkverbindung synchronisiert

# Voting-Screen

Im Rahmen der Studienarbeit haben wir den Voting-Screen in seinem Verhalten und seiner Datenstruktur angepasst. Es ist wichtig zu beachten, dass lediglich die RallyeID und die QuestionID in der DB gespeichert werden. Das Voting ist zum aktuellen Zeitpunkt nur für Upload und Knowledge-Fragen optimiert. Eine Überprüfung ob es sich um dem richtigen Fragetyp handelt, findet in der App nicht statt. Jedoch im Backend ebenso wenig. Diese Funktion muss ergänzt werden. Ein Voting darf nur stattfinden, wenn mind. 3 Teams an der Rallye teilnehmen. Außerdem darf das eigene Team nichit als Auswahlmöglichkeit existieren.

### Verteilen von Zusatzpunkten

- User wählt gewünschte Frage aus
- User sendet seine Eingabe ab
- Es wird eine Custom-Funktion in supabase aufgerufen (`increment_team_question_points`)
- Ein Zusatzpunkt wird in `team_questions` zu dem bereits bestehenden Punkten addiert

### Bekommen der Voting-Daten

Da für den Voting-Screen Daten aus verschiedenen Tabellen zusammengetragen werden müssen, um alles korrekt darzustellen, wird dies über eine Funktion innerhalb von supabase gelöst (`get_voting_content`). Damit werden direkt alle relavanten Daten aus der DB geladen.

Übergabe-Parameter:

- RallyeID
- TeamID des eigenen Teams

### SQL zum Erstellen der Funktion `get_voting_content`

```sql
CREATE OR REPLACE FUNCTION get_voting_content(
    rallye_id_param bigint,
    own_team_id_param bigint
)
RETURNS TABLE(
    tq_id bigint,
    tq_team_id bigint,
    tq_question_id bigint,
    tq_points bigint,
    rt_id bigint,
    rt_rallye_id bigint,
    rt_team_name text,
    question_content text,
    question_type text
) AS $$
BEGIN
  RETURN QUERY
    SELECT tq.id, tq.team_id, tq.question_id, tq.points,
           rt.id, rt.rallye_id, rt.team_name,
           q.content, q.type::text
    FROM team_questions AS tq
    JOIN rallye_team AS rt ON tq.team_id = rt.id
    JOIN questions AS q ON tq.question_id = q.id
    WHERE tq.question_id IN (
          SELECT v.question_id
          FROM voting AS v
          WHERE v.rallye_id = rallye_id_param
    )
    AND rt.rallye_id = rallye_id_param
    AND rt.id != own_team_id_param;
END;
$$ LANGUAGE plpgsql;
```

### SQL zum Erstellen von `increment_team_question_points`

```sql
CREATE OR REPLACE FUNCTION get_question_counts(
  team_id_param integer,
  rallye_id_param integer
)
RETURNS TABLE(answeredQuestions integer, totalQuestions integer) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT count(*) FROM team_questions WHERE team_id = team_id_param) AS answeredQuestions,
    (SELECT count(*) FROM join_rallye_questions WHERE rallye_id = rallye_id_param) AS totalQuestions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
