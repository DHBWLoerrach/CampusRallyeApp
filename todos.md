
# Mögliche weitere Schritte

- Offline-Funktionalität testen (siehe `services/storage/Store.ts`)
- Die Zeit, die ein Team zum beantworten der Fragen gebraucht hat, soll bei Gleichstand mit in das Ranking einfließen
- Gleichzeitige Teilnahme an verschiedenen Rallyes ermöglichen?
- Ein Live-Leaderboard während die Rallye gespielt wird
- Upload-Fragen: Eine tiefere Strukturierung mit Unterordner in den Buckets
- Buckets: Aktuell "Public-Buckets". Sicherheit und Datenschutz klären
- Grundsätzliches überdenken der Offline-Handling-Strategie: Entweder eine Offline-Queue, wie sie bereits teilweise implementiert ist, oder alle Daten werden erst am Ende und bei bestehender Netzwerkverbindung synchronisiert

### Bekommen der Voting-Daten

Da für den Voting-Screen Daten aus verschiedenen Tabellen zusammengetragen werden müssen, um alles korrekt darzustellen, wird dies über eine Funktion innerhalb von supabase gelöst (`get_voting_content`). Damit werden direkt alle relavanten Daten aus der DB geladen.

Übergabe-Parameter:

- RallyeID
- TeamID des eigenen Teams


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
