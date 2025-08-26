import React from 'react';
import { View, Text } from 'react-native';
import { globalStyles } from '@/utils/GlobalStyles';
import Colors from '@/utils/Colors';
import { useTheme } from '@/utils/ThemeContext';
import ThemedView from '@/components/themed/ThemedView';

// Reuse existing question components for now
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

export default function QuestionRenderer({ question, onAnswer }: { question: any; onAnswer: (correct: boolean, points: number) => void }) {
  const { isDarkMode } = useTheme();
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;
  const type = question?.question_type;
  const Cmp = components[type];
  if (!Cmp) {
    return (
      <ThemedView variant="background" style={globalStyles.default.container}>
        <Text style={{ color: 'red', textAlign: 'center' }}>Unknown question type: {String(type)}</Text>
      </ThemedView>
    );
  }
  return (
    <Cmp onAnswer={onAnswer} question={question} />
  );
}
