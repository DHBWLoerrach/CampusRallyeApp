import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  interpolate,
  Extrapolation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { globalStyles } from '@/utils/GlobalStyles';
import ThemedView from '@/components/themed/ThemedView';
import ThemedText from '@/components/themed/ThemedText';
import SkillQuestion from '@/components/rallye/questions/SkillQuestion';
import UploadPhotoQuestion from '@/components/rallye/questions/UploadPhotoQuestion';
import QRCodeQuestion from '@/components/rallye/questions/QRCodeQuestion';
import MultipleChoiceQuestion from '@/components/rallye/questions/MultipleChoiceQuestion';
import ImageQuestion from '@/components/rallye/questions/ImageQuestion';
import UIButton from '@/components/ui/UIButton';
import { useLanguage } from '@/utils/LanguageContext';
import { store$ } from '@/services/storage/Store';

const components: Record<string, any> = {
  knowledge: SkillQuestion,
  upload: UploadPhotoQuestion,
  qr_code: QRCodeQuestion,
  multiple_choice: MultipleChoiceQuestion,
  picture: ImageQuestion,
};

export default function QuestionRenderer({
  question,
}: {
  question: any;
}) {
  const { t } = useLanguage();
  // Flip animation using two faces, based on components/ui/Card.tsx pattern
  const [isFlipped, setIsFlipped] = useState(false);
  const [frontQuestion, setFrontQuestion] = useState(question);
  const [backQuestion, setBackQuestion] = useState<any | null>(null);
  const flip = useSharedValue(0); // 0 (front) ↔ 180 (back)

  // Front face rotates 0→180; back face 180→360
  const frontStyle = useAnimatedStyle(() => {
    const rotateY = `${interpolate(
      flip.value,
      [0, 180],
      [0, 180],
      Extrapolation.CLAMP
    )}deg`;
    return {
      transform: [{ rotateY }],
      zIndex: isFlipped ? 0 : 1,
      pointerEvents: isFlipped ? 'none' : 'auto',
      backfaceVisibility: 'hidden',
    } as const;
  }, [isFlipped]);

  const backStyle = useAnimatedStyle(() => {
    const rotateY = `${interpolate(
      flip.value,
      [0, 180],
      [180, 360],
      Extrapolation.CLAMP
    )}deg`;
    return {
      transform: [{ rotateY }],
      zIndex: isFlipped ? 1 : 0,
      pointerEvents: isFlipped ? 'auto' : 'none',
      backfaceVisibility: 'hidden',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    } as const;
  }, [isFlipped]);

  const springConfig = {
    stiffness: 180,
    damping: 18,
    mass: 1,
    overshootClamping: false,
  } as const;

  useEffect(() => {
    // Only act when question id changes
    const nextId = question?.id;
    if (!nextId) return;
    const frontId = frontQuestion?.id;
    const backId = backQuestion?.id;
    if (nextId === frontId || nextId === backId) return;

    if (!isFlipped) {
      // Prepare back with next question and flip to back (180)
      setBackQuestion(question);
      flip.value = withSpring(
        180,
        springConfig,
        () => runOnJS(setIsFlipped)(true)
      );
    } else {
      // Prepare front with next question and flip to front (0)
      setFrontQuestion(question);
      flip.value = withSpring(
        0,
        springConfig,
        () => runOnJS(setIsFlipped)(false)
      );
    }
  }, [question?.id]);

  const renderQuestion = (q: any) => {
    const type = q?.question_type;
    const Cmp = type ? components[type] : undefined;

    if (!Cmp) {
      return (
        <ThemedView variant="background" style={globalStyles.default.container}>
          <View style={{ width: '100%' }}>
            <ThemedText
              variant="title"
              style={{ textAlign: 'center', marginBottom: 10 }}
            >
              {t('question.unknown.title')}
            </ThemedText>
            <ThemedText style={{ textAlign: 'center', marginBottom: 16 }}>
              {t('question.unknown.message', { type: String(type) })}
            </ThemedText>
            <UIButton
              onPress={() => {
                console.error('Unknown question type:', {
                  id: q?.id,
                  type,
                });
                store$.gotoNextQuestion();
              }}
            >
              {t('question.skip')}
            </UIButton>
          </View>
        </ThemedView>
      );
    }

    return (
      <Cmp
        key={q?.id ? `${type}:${q.id}` : `${type}:unknown`}
        question={q}
      />
    );
  };

  return (
    <Animated.View style={{ flex: 1 }}>
      {/* Front face */}
      <Animated.View style={frontStyle}>
        {renderQuestion(frontQuestion)}
      </Animated.View>
      {/* Back face */}
      <Animated.View style={backStyle}>
        {renderQuestion(backQuestion ?? frontQuestion)}
      </Animated.View>
    </Animated.View>
  );
}
