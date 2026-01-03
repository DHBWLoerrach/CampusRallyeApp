import React, { useCallback, useEffect, useState } from 'react';
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

function hasValidStudiengang(studiengang: string | null | undefined): boolean {
  if (!studiengang) return false;
  const normalized = studiengang.trim().toLowerCase();
  // Filter out placeholder values
  return normalized.length > 0 && normalized !== 'kein studiengang';
}

export default function RallyeSelectionModal({
  visible,
  onClose,
  activeRallyes,
  onJoin,
  joining = false,
}: Props) {
  const { t } = useLanguage();
  const { isDarkMode } = useTheme();

  const [passwordRallye, setPasswordRallye] = useState<RallyeRow | null>(null);
  const [password, setPassword] = useState('');
  const [isFlipped, setIsFlipped] = useState(false);
  const flip = useSharedValue(0);
  const passwordRallyeId = passwordRallye?.id;

  useEffect(() => {
    if (visible) return;
    setPasswordRallye(null);
    setPassword('');
    setIsFlipped(false);
    flip.value = 0;
  }, [visible, flip]);

  const flipToPassword = useCallback(() => {
    flip.value = withSpring(180, {
      stiffness: 180,
      damping: 18,
      mass: 1,
      overshootClamping: false,
    });
    setIsFlipped(true);
  }, [flip]);

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
    if (!passwordRallyeId) return;
    setPassword('');
    setIsFlipped(false);
    flip.value = 0;
    const timeout = setTimeout(() => {
      flipToPassword();
    }, 80);
    return () => clearTimeout(timeout);
  }, [flip, flipToPassword, passwordRallyeId]);

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
    : Colors.lightMode.card;

  const passwordCardBackgroundColor = isDarkMode
    ? Colors.darkMode.card
    : Colors.lightMode.card;

  const headerTextColor = isDarkMode
    ? Colors.darkMode.text
    : Colors.lightMode.text;
  const mutedTextColor = isDarkMode
    ? Colors.darkMode.textMuted
    : Colors.mediumGray;

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
        t('rallye.password.missing.title'),
        t('rallye.password.missing.message')
      );
      return;
    }
    if (passwordAttempt !== requiredPassword) {
      Alert.alert(
        t('rallye.password.wrong.title'),
        t('rallye.password.wrong.message')
      );
      return;
    }

    const ok = await onJoin(passwordRallye);
    if (ok) onClose();
  };

  const renderItem: ListRenderItem<RallyeRow> = ({ item }) => {
    const passwordRequired = isPasswordRequired(item);
    return (
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
              {
                color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text,
              },
            ]}
          >
            {item.name}
          </Text>
          {hasValidStudiengang(item.studiengang) ? (
            <Text
              style={[
                globalStyles.rallyeModal.rallyeStudiengang,
                {
                  color: isDarkMode
                    ? Colors.darkMode.textMuted
                    : Colors.mediumGray,
                },
              ]}
            >
              {item.studiengang}
            </Text>
          ) : null}
          {passwordRequired ? (
            <View style={globalStyles.rallyeModal.passwordHintContainer}>
              <IconSymbol name="lock.fill" size={12} color={mutedTextColor} />
              <Text
                style={[
                  globalStyles.rallyeModal.passwordHint,
                  { color: mutedTextColor },
                ]}
              >
                {t('rallye.password.required.hint')}
              </Text>
            </View>
          ) : null}
        </View>
        <UIButton
          disabled={joining}
          onPress={() => void handleSelect(item)}
          style={globalStyles.rallyeModal.selectButton}
          accessibilityLabel={
            passwordRequired
              ? t('a11y.selectRallyeWithPassword', { name: item.name })
              : t('a11y.selectRallye', { name: item.name })
          }
          accessibilityHint={
            passwordRequired
              ? t('a11y.selectRallyePasswordHint')
              : t('a11y.selectRallyeHint')
          }
        >
          {passwordRequired
            ? t('rallye.joinWithPassword')
            : t('rallye.join')}
        </UIButton>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
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
              <Text
                style={[
                  globalStyles.rallyeModal.modalTitle,
                  { color: headerTextColor },
                ]}
              >
                {t('rallye.password.required.title')}
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
                <Animated.View
                  style={[globalStyles.cardStyles.cardFace, frontAnimatedStyle]}
                >
                  <IconSymbol
                    name="mappin.and.ellipse"
                    size={40}
                    color={Colors.dhbwRed}
                  />
                  <ThemedText
                    style={globalStyles.cardStyles.cardTitle}
                    variant="bodyStrong"
                  >
                    {selectedRallyeName}
                  </ThemedText>
                  {selectedRallyeStudiengang ? (
                    <ThemedText
                      style={globalStyles.cardStyles.cardDescription}
                      variant="bodySmall"
                    >
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
                  <ThemedText
                    style={globalStyles.cardStyles.cardTitle}
                    variant="bodyStrong"
                  >
                    {t('rallye.password.label')}
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
                    placeholder={t('rallye.password.placeholder')}
                    accessibilityLabel={t('rallye.password.label')}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={() => void confirmPasswordAndJoin()}
                  />
                  <ThemedText
                    style={globalStyles.cardStyles.passwordHelper}
                    variant="muted"
                  >
                    {t('rallye.password.helper')}
                  </ThemedText>
                  <View style={globalStyles.cardStyles.buttonRow}>
                    <UIButton
                      onPress={flipBackAndReturnToList}
                      size="dialog"
                      color={Colors.dhbwRedLight}
                      disabled={joining}
                    >
                      {t('common.back')}
                    </UIButton>
                    <UIButton
                      onPress={() => void confirmPasswordAndJoin()}
                      size="dialog"
                      color={Colors.dhbwRed}
                      loading={joining}
                    >
                      {t('rallye.password.join')}
                    </UIButton>
                  </View>
                </Animated.View>
              </View>
            </>
          ) : (
            <>
              <Text
                style={[
                  globalStyles.rallyeModal.modalTitle,
                  { color: headerTextColor },
                ]}
              >
                {t('rallye.modal.activeTitle')}
              </Text>
              {activeRallyes.length > 0 ? (
                <FlatList
                  data={activeRallyes}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderItem}
                  accessibilityRole="list"
                  accessibilityLabel={t('rallye.modal.activeTitle')}
                  showsVerticalScrollIndicator={true}
                  fadingEdgeLength={50}
                  contentContainerStyle={{ paddingBottom: 4 }}
                />
              ) : (
                <Text
                  style={[
                    globalStyles.rallyeModal.noDataText,
                    { color: mutedTextColor },
                  ]}
                >
                  {t('rallye.modal.noActive')}
                </Text>
              )}
              <UIButton
                onPress={onClose}
                variant="ghost"
                style={globalStyles.rallyeModal.cancelButton}
                textStyle={globalStyles.rallyeModal.cancelButtonText}
              >
                {t('common.cancel')}
              </UIButton>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
