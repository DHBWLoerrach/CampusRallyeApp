import { useEffect, useState } from 'react';
import { Text, Platform } from 'react-native';
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
  const rotateY = useSharedValue(0); // Android rotateY degrees
  const scaleX = useSharedValue(1);  // iOS scaleX flip illusion
  const animatedStyle = useAnimatedStyle(() => {
    if (Platform.OS === 'ios') {
      return { transform: [{ scaleX: scaleX.value }] };
    }
    return { transform: [{ perspective: 1200 }, { rotateY: `${rotateY.value}deg` }] };
  });

  useEffect(() => {
    if (!current || question?.id === current?.id) return;
    if (Platform.OS === 'ios') {
      // iOS: avoid 3D backface flicker by scaling width to 0 and back
      scaleX.value = withTiming(0, { duration: 160, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (!finished) return;
        runOnJS(setCurrent)(question);
        scaleX.value = withSpring(1, { damping: 14, stiffness: 140, mass: 0.9 });
      });
    } else {
      // Android: true rotateY flip
      rotateY.value = withTiming(90, { duration: 180, easing: Easing.in(Easing.quad) }, (finished) => {
        if (!finished) return;
        runOnJS(setCurrent)(question);
        rotateY.value = -90;
        rotateY.value = withSpring(0, { damping: 14, stiffness: 140, mass: 0.9 });
      });
    }
  }, [question?.id]);

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <Cmp onAnswer={onAnswer} question={current} />
    </Animated.View>
  );
}
