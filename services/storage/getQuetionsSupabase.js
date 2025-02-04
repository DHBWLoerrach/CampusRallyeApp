import { store$ } from './Store';
import { supabase } from '../../utils/Supabase';

export async function getQuestions() {
  let { data: questions, error: questionError } = await supabase
    .from('questions')
    .select()
    .eq('enabled', true);

  if (questionError) {
    console.error('Error fetching questions:', questionError);
    return [];
  }

  if (!questions || questions.length === 0) {
    console.log('No questions found');
    return [];
  }

  // Passe das Datenformat an: Verwende "content" als Frage und "type" als Fragentyp
  for (let question of questions) {
    // Für die Frage-Komponenten wird erwartet, dass der Fragentext in "question" steht
    question.question = question.content;
    // Für die Auswahl des Komponenten wird erwartet, dass der Typ in "question_type" steht
    question.question_type = question.type;

    let { data: answers, error: answerError } = await supabase
      .from('answers')
      .select()
      .eq('question_id', question.id);

    if (answerError) {
      console.error('Error fetching answers for question', question.id, answerError);
      question.answers = [];
    } else {
      question.answers = answers;
    }
  }
  return questions;
}