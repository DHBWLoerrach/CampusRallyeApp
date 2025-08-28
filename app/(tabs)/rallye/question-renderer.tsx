import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
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
  // Flip animation without backface layers: rotate to 90°, swap, rotate back
  const [current, setCurrent] = useState(question);
  const rotate = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 1200 }, { rotateY: `${rotate.value}deg` }],
  }));

  useEffect(() => {
    if (!current || question?.id === current?.id) return;
    // Faster first half with ease-in for snappier start
    rotate.value = withTiming(90, { duration: 180, easing: Easing.in(Easing.quad) }, (finished) => {
      if (!finished) return;
      runOnJS(setCurrent)(question);
      // Snap back with a gentle spring for natural finish
      rotate.value = -90;
      rotate.value = withSpring(0, { damping: 14, stiffness: 140, mass: 0.9 });
    });
  }, [question?.id]);

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <Cmp onAnswer={onAnswer} question={current} />
    </Animated.View>
  );
}
