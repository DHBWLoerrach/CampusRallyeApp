import React from 'react';
import { render } from '@testing-library/react-native';
import QuestionRenderer from '../question-renderer';

// -- Mocks -------------------------------------------------------------------

jest.mock('@/utils/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string, params?: Record<string, string>) =>
      params ? `${key}:${JSON.stringify(params)}` : key,
  }),
}));

jest.mock('@/services/storage/Store', () => ({
  store$: {
    gotoNextQuestion: jest.fn(),
  },
}));

jest.mock('@/components/themed/ThemedView', () => {
  const { View } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
  };
});

jest.mock('@/components/themed/ThemedText', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) => (
      <Text>{children}</Text>
    ),
  };
});

jest.mock('@/components/ui/UIButton', () => {
  const { Text, Pressable } = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({
      children,
      onPress,
    }: {
      children: React.ReactNode;
      onPress?: () => void;
    }) => (
      <Pressable onPress={onPress}>
        <Text>{children}</Text>
      </Pressable>
    ),
  };
});

// Mock all question components as simple stubs
const mockComponents: Record<string, jest.Mock> = {};
for (const type of [
  'knowledge',
  'upload',
  'qr_code',
  'multiple_choice',
  'picture',
  'geocaching',
]) {
  mockComponents[type] = jest.fn(() => null);
}

jest.mock('@/components/rallye/questions/SkillQuestion', () => ({
  __esModule: true,
  default: (props: any) => {
    mockComponents.knowledge(props);
    const { Text } = jest.requireActual('react-native');
    return <Text>SkillQuestion</Text>;
  },
}));

jest.mock('@/components/rallye/questions/UploadPhotoQuestion', () => ({
  __esModule: true,
  default: (props: any) => {
    mockComponents.upload(props);
    const { Text } = jest.requireActual('react-native');
    return <Text>UploadPhotoQuestion</Text>;
  },
}));

jest.mock('@/components/rallye/questions/QRCodeQuestion', () => ({
  __esModule: true,
  default: (props: any) => {
    mockComponents.qr_code(props);
    const { Text } = jest.requireActual('react-native');
    return <Text>QRCodeQuestion</Text>;
  },
}));

jest.mock('@/components/rallye/questions/MultipleChoiceQuestion', () => ({
  __esModule: true,
  default: (props: any) => {
    mockComponents.multiple_choice(props);
    const { Text } = jest.requireActual('react-native');
    return <Text>MultipleChoiceQuestion</Text>;
  },
}));

jest.mock('@/components/rallye/questions/ImageQuestion', () => ({
  __esModule: true,
  default: (props: any) => {
    mockComponents.picture(props);
    const { Text } = jest.requireActual('react-native');
    return <Text>ImageQuestion</Text>;
  },
}));

jest.mock('@/components/rallye/questions/GeocachingQuestion', () => ({
  __esModule: true,
  default: (props: any) => {
    mockComponents.geocaching(props);
    const { Text } = jest.requireActual('react-native');
    return <Text>GeocachingQuestion</Text>;
  },
}));

// -- Tests --------------------------------------------------------------------

describe('QuestionRenderer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    ['knowledge', 'SkillQuestion'],
    ['upload', 'UploadPhotoQuestion'],
    ['qr_code', 'QRCodeQuestion'],
    ['multiple_choice', 'MultipleChoiceQuestion'],
    ['picture', 'ImageQuestion'],
    ['geocaching', 'GeocachingQuestion'],
  ])('renders %s question type as %s component', (type, componentName) => {
    const question = { id: 1, question_type: type, question: 'Q1', points: 5 };

    const { getAllByText } = render(<QuestionRenderer question={question} />);

    // Front + Back face both render the component
    expect(getAllByText(componentName).length).toBeGreaterThanOrEqual(1);
    expect(mockComponents[type]).toHaveBeenCalledWith(
      expect.objectContaining({ question })
    );
  });

  it('shows unknown type fallback with skip button for invalid type', () => {
    const question = {
      id: 1,
      question_type: 'nonexistent_type',
      question: 'Q1',
      points: 5,
    };

    const { getAllByText } = render(<QuestionRenderer question={question} />);

    expect(getAllByText('question.unknown.title').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('question.skip').length).toBeGreaterThanOrEqual(1);
  });

  it('shows unknown type fallback when question_type is undefined', () => {
    const question = { id: 1, question: 'Q1', points: 5 };

    const { getAllByText } = render(<QuestionRenderer question={question} />);

    expect(getAllByText('question.unknown.title').length).toBeGreaterThanOrEqual(1);
  });
});
