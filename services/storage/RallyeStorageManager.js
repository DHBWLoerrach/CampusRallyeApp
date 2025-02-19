import { supabase } from "../../utils/Supabase";
import NetInfo from "@react-native-community/netinfo";
import { StorageKeys, getStorageItem, setStorageItem } from "./asyncStorage";
import { getCurrentTeam } from "./teamStorage";

export async function loadActiveRallyes() {
  try {
    const { data, error } = await supabase
      .from("rallye")
      .select("*")
      .eq("is_active", true);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching active rallyes:", error);
    return [];
  }
}

export async function getCurrentRallye(rallyeId) {
  return getStorageItem(StorageKeys.CURRENT_RALLYE + "_" + rallyeId);
}

export async function setCurrentRallye(rallye) {
  return setStorageItem(StorageKeys.CURRENT_RALLYE + "_" + rallyeId, rallye);
}

export async function getActiveRallyes() {
  try {
    const { data, error } = await supabase
      .from("rallye")
      .select("*")
      .eq("is_active", true);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching active rallyes:", error);
    return [];
  }
}

export async function getRallyeStatus(rallyeId) {
  try {
    const { data, error } = await supabase
      .from("rallye")
      .select("status")
      .eq("id", rallyeId)
      .single();

    if (error) throw error;
    return data?.status;
  } catch (error) {
    console.error("Error fetching rallye status:", error);
    return null;
  }
}

export async function getRallyePassword(rallyeId) {
  try {
    const { data, error } = await supabase
      .from("rallye")
      .select("password")
      .eq("id", rallyeId)
      .single();

    if (error) throw error;
    return data?.password;
  } catch (error) {
    console.error("Error fetching rallye password:", error);
    return null;
  }
}

export async function getRallyeById(rallyeId) {
  try {
    const { data, error } = await supabase
      .from("rallye")
      .select("*")
      .eq("id", rallyeId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching rallye by ID:", error);
    return null;
  }
}

export async function getRallyeAndQuestionsAndAnswers(rallyeId) {
  /**
   * Ruft die Fragen und deren zugehörige Antworten für einen bestimmten Rallye ab und kombiniert diese.
   *
   * Diese Funktion führt mehrere Supabase-Abfragen durch:
   * 1. Es werden Join-Datensätze aus "join_rallye_questions" basierend auf der angegebenen Rallye-ID abgerufen.
   * 2. Es werden Detailinformationen zu den Fragen aus der Tabelle "questions" anhand der in den Join-Datensätzen enthaltenen Frage-IDs abgerufen.
   * 3. Es werden Antwortinformationen aus der Tabelle "answers" anhand der abgerufenen Frage-IDs abgerufen.
   *
   * Die kombinierten Ergebnisse werden als Array von Objekten zurückgegeben, wobei jedes Objekt die folgende Struktur hat:
   *
   * {
   *   rallye: Object,      // Die ursprünglichen Rallye-Daten aus getRallyeById() für die angegebene Rallye
   *   question: Object,      // Ein Frage-Objekt aus der "questions"-Tabelle
   *   answers: Array<Object> // Ein Array von Antwort-Objekten aus der "answers"-Tabelle, die zur entsprechenden Frage gehören
   * }
   *
   * @param {number|string} rallyeId - Die eindeutige Kennung des Rallye, für den die Fragen und Antworten abgerufen werden sollen.
   * @returns {Promise<Array<{ rallye: Object, question: Object, answers: Array<Object> }>>} Ein Promise, der ein Array von kombinierten Ergebnisobjekten zurückgibt.
   */

  try {
    const { data, error } = await supabase
      .from("join_rallye_questions")
      .select("*")
      .eq("rallye_id", rallyeId);
      
    if (!data || data.length === 0) throw new Error("No questions found for the given rallye ID");

    const questionIds = data.map((question) => question.question_id);
    const { data: questionData, error: questionError } = await supabase
      .from("questions")
      .select("*")
      .in("id", questionIds);

    if (questionError) throw questionError;

    const answerIds = questionData.map((question) => question.id);
    const { data: answerData, error: answerError } = await supabase
      .from("answers")
      .select("*")
      .in("question_id", answerIds);

    if (answerError) throw answerError;

    
    const combinedResults = questionData.map((question) => {
      const relatedAnswers = answerData.filter((answer) => answer.question_id === question.id);
      return { question, answers: relatedAnswers, answeredCorrectly: false, comittedAnswer: null };
    });
    
    const rallyeData = await getRallyeById(rallyeId)
    const combinedResultsFinal = {...combinedResults, rallye: rallyeData};

    console.log(combinedResultsFinal);

    return combinedResultsFinal || [];

  } catch (e) {
    console.error("Error fetching rallye questions:", e);
    return [];
  }
}

export async function createRallyeWorkObject(rallyeId) {
  try {
    const dbCombinedObject = await getRallyeAndQuestionsAndAnswers(rallyeId);
    const workObject = {
      ...dbCombinedObject,
      currentQuestionIndex: 0,
      team: getCurrentTeam(),
      startTime: new Date().toISOString(),
      endTime: "",
      points: 0,
    }
    await setStorageItem(
      StorageKeys.CURRENT_RALLYE + "_" + rallyeId,
      workObject
    );
    return workObject;

  } catch (e) {
    console.error("Error creating rallye work object:", e);
    return null;
  } 
}

export async function saveTeamAnswer(rallyeId, questionId, answer, currentQuestionIndex) {
  try {
    const workObject = await getStorageItem(StorageKeys.CURRENT_RALLYE + "_" + rallyeId);

    const isCorrect = await isTeamAnswerCorrect(rallyeId, currentQuestionIndex, answer);

    const teamId = workObject.team.id;
    const { data, error } = await supabase.from("teamQuestions").insert({
      team_id: teamId,
      question_id: questionId,
      team_answer: answer,
      correct: isCorrect,
      points: workObject.currentQuestionIndex.question.points,
    });

    await setTeamAnswer(rallyeId, currentQuestionIndex, answer);

    if (isCorrect) {
      await addPoints(points, rallyeId);
      await setTeamAnsweredCorrectly(rallyeId, currentQuestionIndex, true);
    }

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error saving question:", error);
    return null;
  }
}

export async function addPoints(points, rallyeId) {
  try {
    workObject = await getStorageItem(
      StorageKeys.CURRENT_RALLYE + "_" + rallyeId
    );
    const pointsAdded = workObject.points + points;
    await setStorageItem(StorageKeys.CURRENT_RALLYE + "_" + rallyeId, {
      ...workObject,
      points: pointsAdded,
    });
    return { ...workObject, points: pointsAdded };

  } catch (error) {
    console.error("Error adding points:", error);
    return null;
  }
}

export async function setCurrentQuestionIndex(index, rallyeId) {
  try {
    const workObject = await getStorageItem(StorageKeys.CURRENT_RALLYE + "_" + rallyeId);
    await setStorageItem(StorageKeys.CURRENT_RALLYE + "_" + rallyeId, {
      ...workObject,
      currentQuestionIndex: index,
    });
    return {...workObject, currentQuestionIndex: index};
  } catch (error) {
    console.error("Error setting current question index:", error);
    return null;
  }
}

export async function setEndTime(rallyeId) {
  try {
    const workObject = await getStorageItem(StorageKeys.CURRENT_RALLYE + "_" + rallyeId);
    const endTime = new Date().toISOString();
    await setStorageItem(StorageKeys.CURRENT_RALLYE + "_" + rallyeId, {
      ...workObject,
      endTime: endTime,
    });

    const { data, error } = await supabase
      .from("rallyeTeam")
      .update({ time_played: endTime - workObject.startTime})
      .eq("id", workObject.team.id);

    if (error) throw error;

    return {...workObject, endTime: endTime};
  } catch (error) {
    console.error("Error setting end time:", error);
    return null;
  }
}

export async function setTeamAnswer(rallyeId, currentQuestionIndex, answer) {
  try {
    currentQuestionIndex = currentQuestionIndex.toISOString();
    const workObject = await getStorageItem(StorageKeys.CURRENT_RALLYE + "_" + rallyeId);
    workObject.currentQuestionIndex.comittedAnswer = answer;
    await setStorageItem(StorageKeys.CURRENT_RALLYE + "_" + rallyeId, {
      ...workObject,
    });
    return {...workObject};
  } catch (error) {
    console.error("Error setting team answer:", error);
    return null;
  }
}

export async function setTeamAnsweredCorrectly(rallyeId, currentQuestionIndex, correct) {
  try {
    currentQuestionIndex = currentQuestionIndex.toISOString();
    const workObject = await getStorageItem(StorageKeys.CURRENT_RALLYE + "_" + rallyeId);
    workObject.currentQuestionIndex.answeredCorrectly = correct;
    await setStorageItem(StorageKeys.CURRENT_RALLYE + "_" + rallyeId, {
      ...workObject,
    });
    return {...workObject};
  } catch (error) {
    console.error("Error setting answered correctly:", error);
    return null;
  }
}

export async function isTeamAnswerCorrect(rallyeId, currentQuestionIndex, answer) {
  try {
    currentQuestionIndex = currentQuestionIndex.toISOString();
    const workObject = await getStorageItem(StorageKeys.CURRENT_RALLYE + "_" + rallyeId);
    const correctAnswer = workObject.currentQuestionIndex.answers.find((a) => a.correct).text;
    return correctAnswer.toLowerCase().trim() === answer.toLowerCase().trim();
  } catch (error) { 
    console.error("Error checking if team answer is correct:", error);
    return null;
  }
}