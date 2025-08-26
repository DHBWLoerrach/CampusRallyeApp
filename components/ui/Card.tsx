import React, { useState, useRef, useEffect } from 'react';
import { Alert, Animated, Text, TouchableOpacity, View } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import Colors from '@/utils/Colors';
import { globalStyles } from '@/utils/GlobalStyles';
import UIButton from './UIButton';
import { useLanguage } from '@/utils/LanguageContext';
import { useTheme } from '@/utils/ThemeContext';
import ThemedTextInput from '@/components/themed/ThemedTextInput';

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
  const flipAnim = useRef(new Animated.Value(0)).current;
  const { isDarkMode } = useTheme();
  const { language } = useLanguage();

  const flipCard = () => {
    Animated.spring(flipAnim, {
      toValue: isFlipped ? 0 : 180,
      friction: 8,
      tension: 45,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  };

  useEffect(() => {
    if (selectedRallye) {
      flipCard();
    }
  }, [selectedRallye]);

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
    zIndex: isFlipped ? 0 : 1,
    pointerEvents: isFlipped ? 'none' : 'auto',
  } as const;

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
    zIndex: isFlipped ? 1 : 0,
    pointerEvents: isFlipped ? 'auto' : 'none',
  } as const;

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
          <UIButton onPress={handlePasswordSubmit} size="dialog" color={Colors.dhbwRed}>
            {language === 'de' ? 'Bestätigen' : 'Confirm'}
          </UIButton>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}
