import { Text } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOutUp,
  LinearTransition,
  Easing,
} from 'react-native-reanimated';
import { globalStyles } from '@/utils/GlobalStyles';
import ThemedView from '@/components/themed/ThemedView';
import SkillQuestion from '@/components/rallye/questions/SkillQuestion';
import UploadPhotoQuestion from '@/components/rallye/questions/UploadPhotoQuestion';
import QRCodeQuestion from '@/components/rallye/questions/QRCodeQuestion';
import MultipleChoiceQuestion from '@/components/rallye/questions/MultipleChoiceQuestion';
import ImageQuestion from '@/components/rallye/questions/ImageQuestion';

const components: Record<string, any> = {
  knowledge: SkillQuestion,
  upload: UploadPhotoQuestion,
  qr_code: QRCodeQuestion,
  multiple_choice: MultipleChoiceQuestion,
  picture: ImageQuestion,
};

export default function QuestionRenderer({
  question,
  onAnswer,
}: {
  question: any;
  onAnswer: (correct: boolean, points: number) => void;
}) {
  const type = question?.question_type;
  const Cmp = components[type];
  if (!Cmp) {
    return (
      <ThemedView variant="background" style={globalStyles.default.container}>
        <Text style={{ color: 'red', textAlign: 'center' }}>
          Unknown question type: {String(type)}
        </Text>
      </ThemedView>
    );
  }
  // Reanimated transitions: entering/exiting + layout
  return (
    <Animated.View
      key={question?.id}
      entering={FadeInDown.duration(220).easing(Easing.out(Easing.quad))}
      exiting={FadeOutUp.duration(160).easing(Easing.in(Easing.quad))}
      layout={LinearTransition.springify()}
      style={{ flex: 1 }}
    >
      <Cmp onAnswer={onAnswer} question={question} />
    </Animated.View>
  );
}
