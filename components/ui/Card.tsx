import { useState, useEffect, useCallback } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import Colors from '@/utils/Colors';
import { globalStyles } from '@/utils/GlobalStyles';
import { useTheme } from '@/utils/ThemeContext';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useLanguage } from '@/utils/LanguageContext';
import ThemedTextInput from '@/components/themed/ThemedTextInput';
import UIButton from '@/components/ui/UIButton';

type CardProps = {
  title: string;
  description: string;
  icon: any;
  onPress?: () => void;
  onShowModal?: () => void;
  onPasswordSubmit: (password: string) => void;
  selectedRallye?: any;
};

export default function Card({
  title,
  description,
  icon,
  onPress,
  onShowModal,
  onPasswordSubmit,
  selectedRallye,
}: CardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [password, setPassword] = useState('');
  const flip = useSharedValue(0);
  const { isDarkMode } = useTheme();
  const { language } = useLanguage();

  const flipCard = useCallback(() => {
    const next = isFlipped ? 0 : 180;
    flip.value = withSpring(next, {
      stiffness: 180,
      damping: 18,
      mass: 1,
      overshootClamping: false,
      restDisplacementThreshold: 0.5,
      restSpeedThreshold: 0.5,
    });
    setIsFlipped((prev) => !prev);
  }, [flip, isFlipped]);

  useEffect(() => {
    if (selectedRallye) {
      flipCard();
    }
  }, [selectedRallye]);

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = `${interpolate(
      flip.value,
      [0, 180],
      [0, 180],
      Extrapolation.CLAMP
    )}deg`;
    const scale = interpolate(
      flip.value,
      [0, 90, 180],
      [1, 1.02, 1],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ perspective: 800 }, { rotateY }, { scale }],
      zIndex: isFlipped ? 0 : 1,
      pointerEvents: isFlipped ? 'none' : 'auto',
      backfaceVisibility: 'hidden',
    } as const;
  }, [isFlipped]);

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = `${interpolate(
      flip.value,
      [0, 180],
      [180, 360],
      Extrapolation.CLAMP
    )}deg`;
    const scale = interpolate(
      flip.value,
      [0, 90, 180],
      [1, 1.02, 1],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ perspective: 800 }, { rotateY }, { scale }],
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

  const handlePasswordSubmit = () => {
    if (!selectedRallye && icon === 'map-marker') {
      Alert.alert(
        language === 'de' ? 'Fehler' : 'Error',
        language === 'de'
          ? 'Bitte wähle zuerst eine Rallye aus.'
          : 'Please select a rallye first.'
      );
      return;
    }
    onPasswordSubmit(password);
    setPassword('');
    flipCard();
  };

  return (
    <TouchableOpacity
      style={[
        globalStyles.cardStyles.card,
        {
          backgroundColor: isDarkMode
            ? Colors.darkMode.card
            : Colors.lightMode.card,
        },
      ]}
      onPress={onShowModal ? onShowModal : onPress}
    >
      {/* front face */}
      <Animated.View
        style={[globalStyles.cardStyles.cardFace, frontAnimatedStyle]}
      >
        <IconSymbol name={icon} size={40} color={Colors.dhbwRed} />
        <Text
          style={[
            globalStyles.cardStyles.cardTitle,
            {
              color: isDarkMode
                ? Colors.darkMode.text
                : Colors.lightMode.dhbwGray,
            },
          ]}
        >
          {title}
        </Text>
        <Text
          style={[
            globalStyles.cardStyles.cardDescription,
            {
              color: isDarkMode
                ? Colors.darkMode.text
                : Colors.lightMode.dhbwGray,
            },
          ]}
        >
          {description}
        </Text>
      </Animated.View>

      {/* back face */}
      <Animated.View
        style={[
          globalStyles.cardStyles.cardFace,
          globalStyles.cardStyles.cardBack,
          backAnimatedStyle,
        ]}
      >
        <Text
          style={[
            globalStyles.cardStyles.cardTitle,
            {
              color: isDarkMode
                ? Colors.darkMode.text
                : Colors.lightMode.dhbwGray,
            },
          ]}
        >
          {language === 'de' ? 'Passwort eingeben' : 'Enter password'}
        </Text>
        <ThemedTextInput
          style={[globalStyles.cardStyles.passwordInput]}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder={language === 'de' ? 'Passwort' : 'Password'}
        />
        <View style={globalStyles.cardStyles.buttonRow}>
          <UIButton
            onPress={flipCard}
            size="dialog"
            color={Colors.dhbwRedLight}
          >
            {language === 'de' ? 'Zurück' : 'Back'}
          </UIButton>
          <UIButton
            onPress={handlePasswordSubmit}
            size="dialog"
            color={Colors.dhbwRed}
          >
            {language === 'de' ? 'Bestätigen' : 'Confirm'}
          </UIButton>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}
