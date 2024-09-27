import { store$ } from './Store';
import { useSharedStates } from './SharedStates';
import { supabase } from './Supabase';

export const useSetPoints = () => {
  const { questions, currentQuestion, points, setPoints } =
    useSharedStates();
  const rallye = store$.rallye.get();
  const team = store$.team.get();

  const setPointsFunction = async (
    answered_correctly,
    earned_points
  ) => {
    if (rallye) {
      await supabase.from('group_questions').insert({
        group_id: team.id,
        question_id: questions[currentQuestion].id,
        answered_correctly: answered_correctly,
        points: earned_points,
      });
    } else {
      if (answered_correctly) {
        setPoints(earned_points + points);
      }
    }
  };

  return setPointsFunction;
};
