import { store$ } from './Store';
import { supabase } from './Supabase';

export async function getQuestions() {
    let { data: questions, error: questionError } = await supabase
        .from('questions')
        .select()
        .eq('enabled',true);

    if (questionError) {
        console.error('Error fetching questions:', questionError);
        return [];
    }

    if (!questions || questions.length === 0) {
        console.log('No questions found');
        return [];
    } 
    for (let question of questions) {
        let { data: answers, error: answerError } = await supabase
            .from('answers')
            .select()
            .eq('question_id', question.id);

        if (answerError) {
            console.error(E);
            question.answers = [];
        } else {
            question.answers = answers;
        }
    }
    return questions;
}