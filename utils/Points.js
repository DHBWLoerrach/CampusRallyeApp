import { useSharedStates } from './SharedStates';
import { supabase } from './Supabase';

export const useSetPoints = () => {
  const {
    useRallye,
    group,
    questions,
    currentQuestion,
    points,
    setPoints
  } = useSharedStates();

  const setPointsFunction = async (answered_correctly, earned_points) => {
    if(useRallye){
      await supabase.from('group_questions').insert({
        group_id: group,
        question_id: questions[currentQuestion].id,
        answered_correctly: answered_correctly,
        points: earned_points
      });
    } else {
      if(answered_correctly){
        setPoints(earned_points+points);
      }
    }
  }

  return setPointsFunction;
}