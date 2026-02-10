--
-- PostgreSQL database dump - Schema Version 4 (with Voting System)
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA IF NOT EXISTS "public";

ALTER SCHEMA "public" OWNER TO "pg_database_owner";

--
-- Name: question_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."question_type" AS ENUM (
    'multiple_choice',
    'knowledge',
    'picture',
    'qr_code',
    'upload'
);

ALTER TYPE "public"."question_type" OWNER TO "postgres";

--
-- Name: rallye_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."rallye_status" AS ENUM (
    'preparing',
    'inactive',
    'running',
    'voting',
    'ranking',
    'ended'
);

ALTER TYPE "public"."rallye_status" OWNER TO "postgres";

--
-- Name: JOIN_question_answer(bigint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."JOIN_question_answer"("rallye_id" bigint) RETURNS "record"
    LANGUAGE "sql"
    AS $$SELECT *
FROM answers A, join_rallye_questions RQ
WHERE RQ.rallye_id = rallye_id
AND RQ.question_id = A.question_id$$;

ALTER FUNCTION "public"."JOIN_question_answer"("rallye_id" bigint) OWNER TO "postgres";

--
-- Name: get_question_count(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."get_question_count"("team_id_param" integer, "rallye_id_param" integer) RETURNS TABLE("answeredquestions" bigint, "totalquestions" bigint)
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
  SELECT
    (SELECT COUNT(*) FROM team_questions WHERE team_id = team_id_param),
    (SELECT COUNT(*) FROM join_rallye_questions WHERE rallye_id = rallye_id_param);
$$;

ALTER FUNCTION "public"."get_question_count"("team_id_param" integer, "rallye_id_param" integer) OWNER TO "postgres";

--
-- Name: get_voting_content(bigint, bigint); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."get_voting_content"("rallye_id_param" bigint, "own_team_id_param" bigint) RETURNS TABLE("tq_id" bigint, "tq_team_id" bigint, "tq_question_id" bigint, "tq_points" bigint, "rt_id" bigint, "rt_rallye_id" bigint, "rt_team_name" "text", "tq_team_answer" "text", "question_content" "text", "question_type" "public"."question_type")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
    SELECT tq.id, tq.team_id, tq.question_id, tq.points,
           rt.id, rt.rallye_id, rt.name, tq.team_answer,
           q.content, q.type
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
$$;

ALTER FUNCTION "public"."get_voting_content"("rallye_id_param" bigint, "own_team_id_param" bigint) OWNER TO "postgres";

--
-- Name: increment_team_question_points(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

SET default_tablespace = '';

SET default_table_access_method = "heap";

CREATE TABLE IF NOT EXISTS "public"."team_questions" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "question_id" bigint NOT NULL,
    "team_id" bigint NOT NULL,
    "correct" boolean NOT NULL,
    "points" bigint NOT NULL,
    "team_answer" "text"
);

ALTER TABLE "public"."team_questions" OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."increment_team_question_points"("target_answer_id" integer) RETURNS "public"."team_questions"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  updated_row team_questions%ROWTYPE;
BEGIN
  UPDATE team_questions
  SET points = points + 1
  WHERE id = target_answer_id
  RETURNING * INTO updated_row;
  
  RETURN updated_row;
END;
$$;

ALTER FUNCTION "public"."increment_team_question_points"("target_answer_id" integer) OWNER TO "postgres";

--
-- Name: cast_voting_vote(int8, int8, int8, int8); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."cast_voting_vote"(
  "p_rallye_id" int8,
  "p_question_id" int8,
  "p_voting_team_id" int8,
  "p_voted_for_team_id" int8
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_teams int;
  v_voted_teams int;
  v_result json;
BEGIN
  -- Vote speichern oder aktualisieren (Team kann Vote ändern)
  INSERT INTO voting_votes (rallye_id, question_id, voting_team_id, voted_for_team_id)
  VALUES (p_rallye_id, p_question_id, p_voting_team_id, p_voted_for_team_id)
  ON CONFLICT (rallye_id, question_id, voting_team_id) 
  DO UPDATE SET 
    voted_for_team_id = p_voted_for_team_id,
    created_at = now();
  
  -- Gesamtanzahl Teams in dieser Rallye
  SELECT COUNT(*) INTO v_total_teams
  FROM rallye_team
  WHERE rallye_id = p_rallye_id;
  
  -- Anzahl Teams die bereits gevotet haben
  SELECT COUNT(DISTINCT voting_team_id) INTO v_voted_teams
  FROM voting_votes
  WHERE rallye_id = p_rallye_id AND question_id = p_question_id;
  
  -- Nur Status zurückgeben, keine automatische Punktevergabe
  v_result = json_build_object(
    'voting_complete', false,
    'teams_voted', v_voted_teams,
    'total_teams', v_total_teams
  );
  
  RETURN v_result;
END;
$$;

ALTER FUNCTION "public"."cast_voting_vote"("p_rallye_id" int8, "p_question_id" int8, "p_voting_team_id" int8, "p_voted_for_team_id" int8) OWNER TO "postgres";

--
-- Name: finalize_voting_for_question(int8, int8); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."finalize_voting_for_question"(
  "p_rallye_id" int8,
  "p_question_id" int8
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_question_points int;
  v_max_votes int;
  v_teams_updated int;
  v_result json;
BEGIN
  -- Punkte der Frage aus questions-Tabelle holen
  SELECT points INTO v_question_points
  FROM questions
  WHERE id = p_question_id;
  
  -- Höchste Stimmenanzahl ermitteln
  SELECT MAX(vote_count) INTO v_max_votes
  FROM (
    SELECT voted_for_team_id, COUNT(*) as vote_count
    FROM voting_votes
    WHERE rallye_id = p_rallye_id AND question_id = p_question_id
    GROUP BY voted_for_team_id
  ) vote_counts;
  
  -- Falls keine Votes vorhanden
  IF v_max_votes IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'No votes found',
      'points_awarded', 0,
      'teams_updated', 0
    );
  END IF;
  
  -- Sicherstellen, dass team_questions Einträge für alle Gewinner existieren
  INSERT INTO team_questions (team_id, question_id, team_answer, points, correct)
  SELECT 
    winners.voted_for_team_id,
    p_question_id,
    NULL,
    0,
    false
  FROM (
    SELECT voted_for_team_id
    FROM voting_votes
    WHERE rallye_id = p_rallye_id AND question_id = p_question_id
    GROUP BY voted_for_team_id
    HAVING COUNT(*) = v_max_votes
  ) winners
  WHERE NOT EXISTS (
    SELECT 1 FROM team_questions 
    WHERE team_id = winners.voted_for_team_id 
    AND question_id = p_question_id
  );
  
  -- Punkte an ALLE Teams mit höchster Stimmenzahl vergeben (bei Gleichstand)
  WITH winners AS (
    SELECT voted_for_team_id
    FROM voting_votes
    WHERE rallye_id = p_rallye_id AND question_id = p_question_id
    GROUP BY voted_for_team_id
    HAVING COUNT(*) = v_max_votes
  ),
  updated AS (
    UPDATE team_questions tq
    SET points = points + v_question_points
    FROM winners
    WHERE tq.team_id = winners.voted_for_team_id
      AND tq.question_id = p_question_id
    RETURNING tq.team_id
  )
  SELECT COUNT(*) INTO v_teams_updated FROM updated;
  
  v_result = json_build_object(
    'success', true,
    'points_awarded', v_question_points,
    'max_votes', v_max_votes,
    'teams_updated', v_teams_updated
  );
  
  RETURN v_result;
END;
$$;

ALTER FUNCTION "public"."finalize_voting_for_question"("p_rallye_id" int8, "p_question_id" int8) OWNER TO "postgres";

--
-- Name: reset_voting_for_question(int8, int8); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."reset_voting_for_question"(
  "p_rallye_id" int8,
  "p_question_id" int8
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Nur Votes löschen, Punkte bleiben erhalten
  DELETE FROM voting_votes
  WHERE rallye_id = p_rallye_id AND question_id = p_question_id;
END;
$$;

ALTER FUNCTION "public"."reset_voting_for_question"("p_rallye_id" int8, "p_question_id" int8) OWNER TO "postgres";

--
-- Name: auto_finalize_voting(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."auto_finalize_voting"()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_question_record RECORD;
  v_result json;
BEGIN
  -- Nur ausführen wenn Status von 'voting' zu 'ranking' oder 'ended' wechselt
  IF OLD.status = 'voting' AND (NEW.status = 'ranking' OR NEW.status = 'ended') THEN
    -- Alle Voting-Fragen für diese Rallye durchgehen
    FOR v_question_record IN 
      SELECT question_id 
      FROM voting 
      WHERE rallye_id = NEW.id
    LOOP
      -- Punktevergabe für jede Voting-Frage
      SELECT finalize_voting_for_question(NEW.id, v_question_record.question_id) 
      INTO v_result;
      
      -- Optional: Logging (kann später entfernt werden)
      RAISE NOTICE 'Finalized voting for question % in rallye %: %', 
        v_question_record.question_id, NEW.id, v_result;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."auto_finalize_voting"() OWNER TO "postgres";

--
-- Name: answers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."answers" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "text" "text",
    "correct" boolean DEFAULT true NOT NULL,
    "question_id" bigint
);

ALTER TABLE "public"."answers" OWNER TO "postgres";

ALTER TABLE "public"."answers" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."answers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

--
-- Name: join_rallye_questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."join_rallye_questions" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "rallye_id" bigint NOT NULL,
    "question_id" bigint NOT NULL
);

ALTER TABLE "public"."join_rallye_questions" OWNER TO "postgres";

--
-- Name: profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "user_id" "uuid" NOT NULL,
    "admin" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."profiles" OWNER TO "postgres";

--
-- Name: questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."questions" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "content" "text" NOT NULL,
    "type" "public"."question_type" NOT NULL,
    "points" bigint,
    "hint" "text",
    "category" "text",
    "bucket_path" "text"
);

ALTER TABLE "public"."questions" OWNER TO "postgres";

ALTER TABLE "public"."questions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."questions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

--
-- Name: rallye; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."rallye" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "status" "public"."rallye_status" DEFAULT 'preparing'::"public"."rallye_status" NOT NULL,
    "name" "text" NOT NULL,
    "password" "text"
);

ALTER TABLE "public"."rallye" OWNER TO "postgres";

ALTER TABLE "public"."rallye" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."rallye_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

--
-- Name: rallye_team; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."rallye_team" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "rallye_id" bigint,
    "time_played" timestamp with time zone
);

ALTER TABLE "public"."rallye_team" OWNER TO "postgres";

ALTER TABLE "public"."rallye_team" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."rallye_team_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

--
-- Name: team_questions (already defined above for function); sequence
--

ALTER TABLE "public"."team_questions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."team_questions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

--
-- Name: voting; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."voting" (
    "rallye_id" bigint NOT NULL,
    "question_id" bigint NOT NULL
);

ALTER TABLE "public"."voting" OWNER TO "postgres";

--
-- Name: voting_votes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."voting_votes" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "rallye_id" int8 NOT NULL,
  "question_id" int8 NOT NULL,
  "voting_team_id" int8 NOT NULL,
  "voted_for_team_id" int8 NOT NULL,
  "created_at" timestamptz DEFAULT now()
);

ALTER TABLE "public"."voting_votes" OWNER TO "postgres";

--
-- Name: organization; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."organization" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "name" text NOT NULL,
    "default_rallye_id" bigint
);

ALTER TABLE "public"."organization" OWNER TO "postgres";

ALTER TABLE "public"."organization" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."organization_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

--
-- Name: department; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."department" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "name" text NOT NULL,
    "organization_id" bigint NOT NULL
);

ALTER TABLE "public"."department" OWNER TO "postgres";

ALTER TABLE "public"."department" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."department_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

--
-- Name: join_department_rallye; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."join_department_rallye" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "department_id" bigint NOT NULL,
    "rallye_id" bigint NOT NULL
);

ALTER TABLE "public"."join_department_rallye" OWNER TO "postgres";

ALTER TABLE "public"."join_department_rallye" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."join_department_rallye_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);

--
-- Name: join_rallye_questions JOIN_rallye_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."join_rallye_questions"
    ADD CONSTRAINT "JOIN_rallye_questions_pkey" PRIMARY KEY ("rallye_id", "question_id");

--
-- Name: answers answers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."answers"
    ADD CONSTRAINT "answers_pkey" PRIMARY KEY ("id");

--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("user_id");

--
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_pkey" PRIMARY KEY ("id");

--
-- Name: rallye_team rallyeTeam_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."rallye_team"
    ADD CONSTRAINT "rallyeTeam_pkey" PRIMARY KEY ("id");

--
-- Name: rallye rallye_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."rallye"
    ADD CONSTRAINT "rallye_pkey" PRIMARY KEY ("id");

--
-- Name: team_questions teamQuestions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."team_questions"
    ADD CONSTRAINT "teamQuestions_pkey" PRIMARY KEY ("id");

--
-- Name: voting voting_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."voting"
    ADD CONSTRAINT "voting_pkey" PRIMARY KEY ("rallye_id", "question_id");

--
-- Name: voting_votes voting_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."voting_votes"
    ADD CONSTRAINT "voting_votes_pkey" PRIMARY KEY ("id");

--
-- Name: voting_votes voting_votes_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."voting_votes"
    ADD CONSTRAINT "voting_votes_unique" UNIQUE ("rallye_id", "question_id", "voting_team_id");

--
-- Name: organization organization_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."organization"
    ADD CONSTRAINT "organization_pkey" PRIMARY KEY ("id");

--
-- Name: department department_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."department"
    ADD CONSTRAINT "department_pkey" PRIMARY KEY ("id");

--
-- Name: join_department_rallye join_department_rallye_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."join_department_rallye"
    ADD CONSTRAINT "join_department_rallye_pkey" PRIMARY KEY ("id");

--
-- Name: idx_voting_votes_rallye_question; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX IF NOT EXISTS idx_voting_votes_rallye_question 
  ON "public"."voting_votes" USING btree ("rallye_id", "question_id");

--
-- Name: join_rallye_questions JOIN_rallye_questions_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."join_rallye_questions"
    ADD CONSTRAINT "JOIN_rallye_questions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE CASCADE;

--
-- Name: join_rallye_questions JOIN_rallye_questions_rallye_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."join_rallye_questions"
    ADD CONSTRAINT "JOIN_rallye_questions_rallye_id_fkey" FOREIGN KEY ("rallye_id") REFERENCES "public"."rallye"("id") ON DELETE CASCADE;

--
-- Name: answers answers_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."answers"
    ADD CONSTRAINT "answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE CASCADE;

--
-- Name: rallye_team rallyeTeam_rallye_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."rallye_team"
    ADD CONSTRAINT "rallyeTeam_rallye_id_fkey" FOREIGN KEY ("rallye_id") REFERENCES "public"."rallye"("id") ON DELETE CASCADE;

--
-- Name: team_questions teamQuestions_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."team_questions"
    ADD CONSTRAINT "teamQuestions_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id");

--
-- Name: team_questions teamQuestions_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."team_questions"
    ADD CONSTRAINT "teamQuestions_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."rallye_team"("id") ON DELETE CASCADE;

--
-- Name: voting voting_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."voting"
    ADD CONSTRAINT "voting_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id");

--
-- Name: voting voting_rallye_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."voting"
    ADD CONSTRAINT "voting_rallye_id_fkey" FOREIGN KEY ("rallye_id") REFERENCES "public"."rallye"("id");

--
-- Name: voting_votes voting_votes_rallye_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."voting_votes"
    ADD CONSTRAINT "voting_votes_rallye_id_fkey" FOREIGN KEY ("rallye_id") REFERENCES "public"."rallye"("id") ON DELETE CASCADE;

--
-- Name: voting_votes voting_votes_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."voting_votes"
    ADD CONSTRAINT "voting_votes_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE CASCADE;

--
-- Name: voting_votes voting_votes_voting_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."voting_votes"
    ADD CONSTRAINT "voting_votes_voting_team_id_fkey" FOREIGN KEY ("voting_team_id") REFERENCES "public"."rallye_team"("id") ON DELETE CASCADE;

--
-- Name: voting_votes voting_votes_voted_for_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."voting_votes"
    ADD CONSTRAINT "voting_votes_voted_for_team_id_fkey" FOREIGN KEY ("voted_for_team_id") REFERENCES "public"."rallye_team"("id") ON DELETE CASCADE;

--
-- Name: organization organization_default_rallye_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."organization"
    ADD CONSTRAINT "organization_default_rallye_id_fkey" FOREIGN KEY ("default_rallye_id") REFERENCES "public"."rallye"("id") ON DELETE SET NULL;

--
-- Name: department department_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."department"
    ADD CONSTRAINT "department_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE CASCADE;

--
-- Name: join_department_rallye join_department_rallye_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."join_department_rallye"
    ADD CONSTRAINT "join_department_rallye_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "public"."department"("id") ON DELETE CASCADE;

--
-- Name: join_department_rallye join_department_rallye_rallye_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."join_department_rallye"
    ADD CONSTRAINT "join_department_rallye_rallye_id_fkey" FOREIGN KEY ("rallye_id") REFERENCES "public"."rallye"("id") ON DELETE CASCADE;

--
-- Name: rallye trigger_auto_finalize_voting; Type: TRIGGER; Schema: public; Owner: postgres
--

DROP TRIGGER IF EXISTS trigger_auto_finalize_voting ON "public"."rallye";
CREATE TRIGGER trigger_auto_finalize_voting
  AFTER UPDATE OF status ON "public"."rallye"
  FOR EACH ROW
  EXECUTE FUNCTION "public"."auto_finalize_voting"();

--
-- Name: rallye_team Enable insert access for all users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable insert access for all users" ON "public"."rallye_team" FOR INSERT WITH CHECK (true);

--
-- Name: answers Enable read access for all users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable read access for all users" ON "public"."answers" FOR SELECT USING (true);

--
-- Name: questions Enable read access for all users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable read access for all users" ON "public"."questions" FOR SELECT USING (true);

--
-- Name: rallye_team Enable update access for all users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable update access for all users" ON "public"."rallye_team" FOR UPDATE USING (true);

--
-- Name: answers Enable write for authenticated users only; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable write for authenticated users only" ON "public"."answers" TO "authenticated" USING (true) WITH CHECK (true);

--
-- Name: join_rallye_questions Enable write for authenticated users only; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable write for authenticated users only" ON "public"."join_rallye_questions" TO "authenticated" USING (true) WITH CHECK (true);

--
-- Name: profiles Enable write for authenticated users only; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable write for authenticated users only" ON "public"."profiles" TO "authenticated" USING (true) WITH CHECK (true);

--
-- Name: questions Enable write for authenticated users only; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable write for authenticated users only" ON "public"."questions" TO "authenticated" USING (true) WITH CHECK (true);

--
-- Name: rallye Enable write for authenticated users only; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable write for authenticated users only" ON "public"."rallye" TO "authenticated" USING (true) WITH CHECK (true);

--
-- Name: voting Enable write for authenticated users only; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable write for authenticated users only" ON "public"."voting" TO "authenticated" USING (true) WITH CHECK (true);

--
-- Name: join_rallye_questions Enabled read access for all users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enabled read access for all users" ON "public"."join_rallye_questions" FOR SELECT USING (true);

--
-- Name: rallye Enabled read access for all users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enabled read access for all users" ON "public"."rallye" FOR SELECT USING (true);

--
-- Name: rallye_team Enabled read access for all users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enabled read access for all users" ON "public"."rallye_team" FOR SELECT USING (true);

--
-- Name: team_questions Enabled read access for all users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enabled read access for all users" ON "public"."team_questions" FOR SELECT USING (true);

--
-- Name: voting Enabled read access for all users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enabled read access for all users" ON "public"."voting" FOR SELECT USING (true);

--
-- Name: rallye_team Enabled write access for all users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enabled write access for all users" ON "public"."rallye_team" FOR INSERT TO "authenticated" WITH CHECK (true);

--
-- Name: team_questions Enabled write access for all users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enabled write access for all users" ON "public"."team_questions" FOR INSERT WITH CHECK (true);

--
-- Name: voting_votes Teams can insert their own votes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teams can insert their own votes"
  ON "public"."voting_votes" FOR INSERT
  WITH CHECK (true);

--
-- Name: voting_votes Teams can view all votes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Teams can view all votes"
  ON "public"."voting_votes" FOR SELECT
  USING (true);

--
-- Name: organization Enable read access for all users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable read access for all users" ON "public"."organization" FOR SELECT USING (true);

--
-- Name: organization Enable write for authenticated users only; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable write for authenticated users only" ON "public"."organization" TO "authenticated" USING (true) WITH CHECK (true);

--
-- Name: department Enable read access for all users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable read access for all users" ON "public"."department" FOR SELECT USING (true);

--
-- Name: department Enable write for authenticated users only; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable write for authenticated users only" ON "public"."department" TO "authenticated" USING (true) WITH CHECK (true);

--
-- Name: join_department_rallye Enable read access for all users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable read access for all users" ON "public"."join_department_rallye" FOR SELECT USING (true);

--
-- Name: join_department_rallye Enable write for authenticated users only; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable write for authenticated users only" ON "public"."join_department_rallye" TO "authenticated" USING (true) WITH CHECK (true);

--
-- Name: answers; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."answers" ENABLE ROW LEVEL SECURITY;

--
-- Name: join_rallye_questions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."join_rallye_questions" ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

--
-- Name: questions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."questions" ENABLE ROW LEVEL SECURITY;

--
-- Name: rallye; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."rallye" ENABLE ROW LEVEL SECURITY;

--
-- Name: rallye_team; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."rallye_team" ENABLE ROW LEVEL SECURITY;

--
-- Name: team_questions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."team_questions" ENABLE ROW LEVEL SECURITY;

--
-- Name: voting; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."voting" ENABLE ROW LEVEL SECURITY;

--
-- Name: voting_votes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."voting_votes" ENABLE ROW LEVEL SECURITY;

--
-- Name: organization; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."organization" ENABLE ROW LEVEL SECURITY;

--
-- Name: department; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."department" ENABLE ROW LEVEL SECURITY;

--
-- Name: join_department_rallye; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."join_department_rallye" ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

--
-- Name: FUNCTION JOIN_question_answer(rallye_id bigint); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."JOIN_question_answer"("rallye_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."JOIN_question_answer"("rallye_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."JOIN_question_answer"("rallye_id" bigint) TO "service_role";

--
-- Name: FUNCTION get_question_count(team_id_param integer, rallye_id_param integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."get_question_count"("team_id_param" integer, "rallye_id_param" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_question_count"("team_id_param" integer, "rallye_id_param" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_question_count"("team_id_param" integer, "rallye_id_param" integer) TO "service_role";

--
-- Name: FUNCTION get_voting_content(rallye_id_param bigint, own_team_id_param bigint); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."get_voting_content"("rallye_id_param" bigint, "own_team_id_param" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_voting_content"("rallye_id_param" bigint, "own_team_id_param" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_voting_content"("rallye_id_param" bigint, "own_team_id_param" bigint) TO "service_role";

--
-- Name: TABLE team_questions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."team_questions" TO "anon";
GRANT ALL ON TABLE "public"."team_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."team_questions" TO "service_role";

--
-- Name: FUNCTION increment_team_question_points(target_answer_id integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."increment_team_question_points"("target_answer_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."increment_team_question_points"("target_answer_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_team_question_points"("target_answer_id" integer) TO "service_role";

--
-- Name: FUNCTION cast_voting_vote(p_rallye_id int8, p_question_id int8, p_voting_team_id int8, p_voted_for_team_id int8); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."cast_voting_vote"("p_rallye_id" int8, "p_question_id" int8, "p_voting_team_id" int8, "p_voted_for_team_id" int8) TO "anon";
GRANT ALL ON FUNCTION "public"."cast_voting_vote"("p_rallye_id" int8, "p_question_id" int8, "p_voting_team_id" int8, "p_voted_for_team_id" int8) TO "authenticated";
GRANT ALL ON FUNCTION "public"."cast_voting_vote"("p_rallye_id" int8, "p_question_id" int8, "p_voting_team_id" int8, "p_voted_for_team_id" int8) TO "service_role";

--
-- Name: FUNCTION finalize_voting_for_question(p_rallye_id int8, p_question_id int8); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."finalize_voting_for_question"("p_rallye_id" int8, "p_question_id" int8) TO "anon";
GRANT ALL ON FUNCTION "public"."finalize_voting_for_question"("p_rallye_id" int8, "p_question_id" int8) TO "authenticated";
GRANT ALL ON FUNCTION "public"."finalize_voting_for_question"("p_rallye_id" int8, "p_question_id" int8) TO "service_role";

--
-- Name: FUNCTION reset_voting_for_question(p_rallye_id int8, p_question_id int8); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."reset_voting_for_question"("p_rallye_id" int8, "p_question_id" int8) TO "anon";
GRANT ALL ON FUNCTION "public"."reset_voting_for_question"("p_rallye_id" int8, "p_question_id" int8) TO "authenticated";
GRANT ALL ON FUNCTION "public"."reset_voting_for_question"("p_rallye_id" int8, "p_question_id" int8) TO "service_role";

--
-- Name: FUNCTION auto_finalize_voting(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."auto_finalize_voting"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_finalize_voting"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_finalize_voting"() TO "service_role";

--
-- Name: TABLE answers; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE "public"."answers" TO "anon";
GRANT ALL ON TABLE "public"."answers" TO "authenticated";
GRANT ALL ON TABLE "public"."answers" TO "service_role";

--
-- Name: SEQUENCE answers_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON SEQUENCE "public"."answers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."answers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."answers_id_seq" TO "service_role";

--
-- Name: TABLE join_rallye_questions; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE "public"."join_rallye_questions" TO "anon";
GRANT ALL ON TABLE "public"."join_rallye_questions" TO "authenticated";
GRANT ALL ON TABLE "public"."join_rallye_questions" TO "service_role";

--
-- Name: TABLE profiles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";

--
-- Name: TABLE questions; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE "public"."questions" TO "anon";
GRANT ALL ON TABLE "public"."questions" TO "authenticated";
GRANT ALL ON TABLE "public"."questions" TO "service_role";

--
-- Name: SEQUENCE questions_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON SEQUENCE "public"."questions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."questions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."questions_id_seq" TO "service_role";

--
-- Name: TABLE rallye; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE "public"."rallye" TO "anon";
GRANT ALL ON TABLE "public"."rallye" TO "authenticated";
GRANT ALL ON TABLE "public"."rallye" TO "service_role";

--
-- Name: SEQUENCE rallye_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON SEQUENCE "public"."rallye_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."rallye_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."rallye_id_seq" TO "service_role";

--
-- Name: TABLE rallye_team; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."rallye_team" TO "anon";
GRANT ALL ON TABLE "public"."rallye_team" TO "authenticated";
GRANT ALL ON TABLE "public"."rallye_team" TO "service_role";

--
-- Name: SEQUENCE rallye_team_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE "public"."rallye_team_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."rallye_team_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."rallye_team_id_seq" TO "service_role";

--
-- Name: SEQUENCE team_questions_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE "public"."team_questions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."team_questions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."team_questions_id_seq" TO "service_role";

--
-- Name: TABLE voting; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."voting" TO "anon";
GRANT ALL ON TABLE "public"."voting" TO "authenticated";
GRANT ALL ON TABLE "public"."voting" TO "service_role";

--
-- Name: TABLE voting_votes; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."voting_votes" TO "anon";
GRANT ALL ON TABLE "public"."voting_votes" TO "authenticated";
GRANT ALL ON TABLE "public"."voting_votes" TO "service_role";

--
-- Name: TABLE organization; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE "public"."organization" TO "anon";
GRANT ALL ON TABLE "public"."organization" TO "authenticated";
GRANT ALL ON TABLE "public"."organization" TO "service_role";

--
-- Name: SEQUENCE organization_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON SEQUENCE "public"."organization_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."organization_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."organization_id_seq" TO "service_role";

--
-- Name: TABLE department; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE "public"."department" TO "anon";
GRANT ALL ON TABLE "public"."department" TO "authenticated";
GRANT ALL ON TABLE "public"."department" TO "service_role";

--
-- Name: SEQUENCE department_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON SEQUENCE "public"."department_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."department_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."department_id_seq" TO "service_role";

--
-- Name: TABLE join_department_rallye; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON TABLE "public"."join_department_rallye" TO "anon";
GRANT ALL ON TABLE "public"."join_department_rallye" TO "authenticated";
GRANT ALL ON TABLE "public"."join_department_rallye" TO "service_role";

--
-- Name: SEQUENCE join_department_rallye_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT ON SEQUENCE "public"."join_department_rallye_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."join_department_rallye_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."join_department_rallye_id_seq" TO "service_role";

--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";

--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";

--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";

--
-- PostgreSQL database dump complete
--

RESET ALL;