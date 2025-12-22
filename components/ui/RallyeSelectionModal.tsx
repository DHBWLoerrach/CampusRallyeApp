import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  View,
  ListRenderItem,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { globalStyles } from '@/utils/GlobalStyles';
import UIButton from './UIButton';
import Colors from '@/utils/Colors';
import { useLanguage } from '@/utils/LanguageContext';
import { useTheme } from '@/utils/ThemeContext';
import type { RallyeRow } from '@/services/storage/rallyeStorage';
import ThemedText from '@/components/themed/ThemedText';
import ThemedTextInput from '@/components/themed/ThemedTextInput';
import { IconSymbol } from '@/components/ui/IconSymbol';

function getStatusText(status: RallyeRow['status'], language: 'de' | 'en') {
  switch (status) {
    case 'preparing':
      return language === 'de' ? 'Noch nicht gestartet' : 'Not started';
    case 'running':
      return language === 'de' ? 'Gestartet' : 'Started';
    case 'post_processing':
      return language === 'de' ? 'Abstimmung' : 'Voting';
    case 'ended':
      return language === 'de' ? 'Beendet' : 'Ended';
    default:
      return String(status);
  }
}

type Props = {
  visible: boolean;
  onClose: () => void;
  activeRallyes: RallyeRow[];
  onJoin: (r: RallyeRow) => Promise<boolean>;
  joining?: boolean;
};

function isPasswordRequired(r: RallyeRow) {
  return !!(r.password ?? '').trim().length;
}

export default function RallyeSelectionModal({
  visible,
  onClose,
  activeRallyes,
  onJoin,
  joining = false,
}: Props) {
  const { language } = useLanguage();
  const { isDarkMode } = useTheme();

  const [passwordRallye, setPasswordRallye] = useState<RallyeRow | null>(null);
  const [password, setPassword] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);
  const flip = useSharedValue(0);

  useEffect(() => {
    if (visible) return;
    setPasswordRallye(null);
    setPassword('');
    setIsFlipped(false);
    flip.value = 0;
  }, [visible, flip]);

  const flipToPassword = () => {
    flip.value = withSpring(180, {
      stiffness: 180,
      damping: 18,
      mass: 1,
      overshootClamping: false,
    });
    setIsFlipped(true);
  };

  const flipBackAndReturnToList = () => {
    const springConfig = {
      stiffness: 180,
      damping: 18,
      mass: 1,
      overshootClamping: false,
    } as const;
    flip.value = withSpring(0, springConfig, () => {
      runOnJS(setIsFlipped)(false);
      runOnJS(setPassword)('');
      runOnJS(setPasswordRallye)(null);
    });
  };

  useEffect(() => {
    if (!passwordRallye) return;
    setPassword('');
    setIsFlipped(false);
    flip.value = 0;
    const timeout = setTimeout(() => {
      flipToPassword();
    }, 80);
    return () => clearTimeout(timeout);
  }, [passwordRallye?.id]);

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

  const modalBackgroundColor = isDarkMode
    ? Colors.darkMode.card
    : Colors.lightMode.background;

  const passwordCardBackgroundColor = isDarkMode
    ? Colors.darkMode.card
    : Colors.lightMode.card;

  const headerTextColor = isDarkMode ? Colors.darkMode.text : Colors.lightMode.text;

  const selectedRallyeName = passwordRallye?.name ?? '';
  const selectedRallyeStudiengang = passwordRallye?.studiengang ?? '';

  const handleSelect = async (rallye: RallyeRow) => {
    if (!isPasswordRequired(rallye)) {
      const ok = await onJoin(rallye);
      if (ok) onClose();
      return;
    }
    setPasswordRallye(rallye);
  };

  const confirmPasswordAndJoin = async () => {
    if (!passwordRallye || joining) return;

    const requiredPassword = (passwordRallye.password ?? '').trim();
    const passwordAttempt = password.trim();
    if (!passwordAttempt) {
      Alert.alert(
        language === 'de' ? 'Passwort fehlt' : 'Password required',
        language === 'de'
          ? 'Bitte gib das Rallye-Passwort ein.'
          : 'Please enter the rallye password.'
      );
      return;
    }
    if (passwordAttempt !== requiredPassword) {
      Alert.alert(
        language === 'de' ? 'Falsches Passwort' : 'Wrong password',
        language === 'de'
          ? 'Bitte gib das richtige Passwort ein.'
          : 'Please enter the correct password.'
      );
      return;
    }

    const ok = await onJoin(passwordRallye);
    if (ok) onClose();
  };

  const renderItem: ListRenderItem<RallyeRow> = ({ item }) => (
    <View
      style={[
        globalStyles.rallyeModal.rallyeCard,
        {
          backgroundColor: isDarkMode
            ? Colors.darkMode.dhbwGray
            : (globalStyles.rallyeModal.rallyeCard as any).backgroundColor,
        },
      ]}
    >
      <View style={globalStyles.rallyeModal.rallyeInfo}>
        <Text
          style={[
            globalStyles.rallyeModal.rallyeName,
            { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
          ]}
        >
          {item.name}
        </Text>
        <Text
          style={[
            globalStyles.rallyeModal.rallyeStudiengang,
            {
              color: isDarkMode
                ? Colors.darkMode.text
                : (globalStyles.rallyeModal.rallyeStudiengang as any).color,
            },
          ]}
        >
          {item.studiengang}
        </Text>
        <Text
          style={[
            globalStyles.rallyeModal.rallyeStatus,
            {
              color: isDarkMode
                ? Colors.darkMode.text
                : (globalStyles.rallyeModal.rallyeStatus as any).color,
            },
          ]}
        >
          {getStatusText(item.status, language)}
        </Text>
      </View>
      {isPasswordRequired(item) ? (
        <View style={{ marginRight: 10 }}>
          <IconSymbol name="lock" size={18} color={Colors.dhbwRed} />
        </View>
      ) : null}
      <UIButton
        disabled={joining}
        onPress={() => void handleSelect(item)}
        style={globalStyles.rallyeModal.selectButton}
      >
        {language === 'de' ? 'Auswählen' : 'Select'}
      </UIButton>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={globalStyles.rallyeModal.modalContainer}
      >
        <View
          style={[
            globalStyles.rallyeModal.modalContent,
            {
              backgroundColor: modalBackgroundColor,
            },
          ]}
        >
          {passwordRallye ? (
            <>
              <Text style={[globalStyles.rallyeModal.modalTitle, { color: headerTextColor }]}>
                {language === 'de' ? 'Passwort erforderlich' : 'Password required'}
              </Text>
              <View
                style={[
                  globalStyles.cardStyles.card,
                  {
                    minHeight: 220,
                    backgroundColor: passwordCardBackgroundColor,
                    position: 'relative',
                    overflow: 'hidden',
                  },
                ]}
              >
                {/* front face */}
                <Animated.View style={[globalStyles.cardStyles.cardFace, frontAnimatedStyle]}>
                  <IconSymbol name="mappin.and.ellipse" size={40} color={Colors.dhbwRed} />
                  <ThemedText style={globalStyles.cardStyles.cardTitle} variant="bodyStrong">
                    {selectedRallyeName}
                  </ThemedText>
                  {selectedRallyeStudiengang ? (
                    <ThemedText style={globalStyles.cardStyles.cardDescription} variant="bodySmall">
                      {selectedRallyeStudiengang}
                    </ThemedText>
                  ) : null}
                </Animated.View>

                {/* back face */}
                <Animated.View
                  style={[
                    globalStyles.cardStyles.cardFace,
                    globalStyles.cardStyles.cardBack,
                    backAnimatedStyle,
                  ]}
                >
                  <ThemedText style={globalStyles.cardStyles.cardTitle} variant="bodyStrong">
                    {language === 'de' ? 'Passwort eingeben' : 'Enter password'}
                  </ThemedText>
                  <ThemedTextInput
                    autoFocus
                    style={[
                      globalStyles.cardStyles.passwordInput,
                      { width: '100%', marginVertical: 14 },
                    ]}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    placeholder={language === 'de' ? 'Passwort' : 'Password'}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={() => void confirmPasswordAndJoin()}
                  />
                  <View style={globalStyles.cardStyles.buttonRow}>
                    <UIButton
                      onPress={flipBackAndReturnToList}
                      size="dialog"
                      color={Colors.dhbwRedLight}
                      disabled={joining}
                    >
                      {language === 'de' ? 'Zurück' : 'Back'}
                    </UIButton>
                    <UIButton
                      onPress={() => void confirmPasswordAndJoin()}
                      size="dialog"
                      color={Colors.dhbwRed}
                      loading={joining}
                    >
                      {language === 'de' ? 'Bestätigen' : 'Confirm'}
                    </UIButton>
                  </View>
                </Animated.View>
              </View>
              <UIButton onPress={onClose} outline style={globalStyles.rallyeModal.cancelButton}>
                {language === 'de' ? 'Abbrechen' : 'Cancel'}
              </UIButton>
            </>
          ) : (
            <>
              <Text style={[globalStyles.rallyeModal.modalTitle, { color: headerTextColor }]}>
                {language === 'de' ? 'Aktive Rallyes' : 'Active Rallyes'}
              </Text>
              {activeRallyes.length > 0 ? (
                <FlatList
                  data={activeRallyes}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderItem}
                />
              ) : (
                <Text style={globalStyles.rallyeModal.noDataText}>
                  {language === 'de'
                    ? 'Keine aktiven Rallyes verfügbar'
                    : 'No active rallyes available'}
                </Text>
              )}
              <UIButton
                onPress={onClose}
                style={globalStyles.rallyeModal.cancelButton}
              >
                {language === 'de' ? 'Abbrechen' : 'Cancel'}
              </UIButton>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
