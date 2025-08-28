import { useEffect, useRef } from 'react';
import { Animated, Easing, Text } from 'react-native';
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
  // Fade/slide-in animation on question change for smoother transitions
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    // Reset and animate whenever the question id changes
    opacity.setValue(0);
    translateY.setValue(8);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [question?.id]);

  return (
    <Animated.View style={{ flex: 1, opacity, transform: [{ translateY }] }}>
      <Cmp onAnswer={onAnswer} question={question} />
    </Animated.View>
  );
}
