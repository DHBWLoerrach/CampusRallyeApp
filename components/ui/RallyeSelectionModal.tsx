import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
  ListRenderItem,
  Animated,
  Dimensions,
} from 'react-native';
import { globalStyles } from '@/utils/GlobalStyles';
import UIButton from './UIButton';
import Colors from '@/utils/Colors';
import { useLanguage } from '@/utils/LanguageContext';
import { useTheme } from '@/utils/ThemeContext';
import type { RallyeRow } from '@/services/storage/rallyeStorage';
import ThemedText from '@/components/themed/ThemedText';
import ThemedTextInput from '@/components/themed/ThemedTextInput';
import { IconSymbol } from '@/components/ui/IconSymbol';

const SCREEN_WIDTH = Dimensions.get('window').width;

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
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;

  const [passwordRallye, setPasswordRallye] = useState<RallyeRow | null>(null);
  const [password, setPassword] = useState('');

  // Slide animation
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      setPasswordRallye(null);
      setPassword('');
      slideAnim.setValue(0);
    }
  }, [visible, slideAnim]);

  const slideToPassword = React.useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const slideBackToList = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setPassword('');
      setPasswordRallye(null);
    });
  };

  useEffect(() => {
    if (passwordRallye) {
      setPassword('');
      slideToPassword();
    }
  }, [passwordRallye, slideToPassword]);

  const modalBackgroundColor = palette.card;
  const headerTextColor = palette.text;
  const mutedTextColor = palette.textMuted ?? Colors.mediumGray;
  const cardBackgroundColor = palette.surface1;
  const cardBorderColor = palette.borderSubtle;
  const cancelTextColor = palette.textMuted ?? Colors.mediumGray;

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
      <Pressable
        accessibilityRole="button"
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
        accessibilityState={{ disabled: joining }}
        disabled={joining}
        onPress={() => void handleSelect(item)}
        style={({ pressed }) => [
          globalStyles.rallyeModal.rallyeCard,
          {
            backgroundColor: cardBackgroundColor,
            borderColor: cardBorderColor,
          },
          pressed && !joining
            ? { opacity: 0.9, transform: [{ scale: 0.99 }] }
            : null,
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
              <IconSymbol
                name="lock"
                size={11}
                color={mutedTextColor}
                style={globalStyles.rallyeModal.passwordHintIcon}
              />
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
        <View style={globalStyles.rallyeModal.rallyeAction}>
          <IconSymbol
            name="chevron.right"
            size={18}
            color={mutedTextColor}
          />
        </View>
      </Pressable>
    );
  };

  // Animation transforms
  const listTranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -SCREEN_WIDTH],
  });

  const passwordTranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_WIDTH, 0],
  });

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
              overflow: 'hidden',
            },
          ]}
        >
          {/* List View */}
          <Animated.View
            style={[
              globalStyles.rallyeModal.slideView,
              { transform: [{ translateX: listTranslateX }] },
            ]}
          >
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
            <View
              style={[
                globalStyles.rallyeModal.cancelButtonSeparator,
                {
                  backgroundColor: isDarkMode
                    ? Colors.darkMode.borderSubtle
                    : Colors.veryLightGray,
                },
              ]}
            />
            <UIButton
              onPress={onClose}
              variant="ghost"
              style={globalStyles.rallyeModal.cancelButton}
              textStyle={globalStyles.rallyeModal.cancelButtonText}
              color={cancelTextColor}
            >
              {t('common.cancel')}
            </UIButton>
          </Animated.View>

          {/* Password View */}
          <Animated.View
            style={[
              globalStyles.rallyeModal.slideView,
              globalStyles.rallyeModal.passwordSlideView,
              { transform: [{ translateX: passwordTranslateX }] },
            ]}
          >
            {/* Rallye name as title */}
            <Text
              style={[
                globalStyles.rallyeModal.modalTitle,
                { color: headerTextColor },
              ]}
            >
              {selectedRallyeName}
            </Text>

            {/* Studiengang if valid */}
            {hasValidStudiengang(selectedRallyeStudiengang) ? (
              <Text
                style={[
                  globalStyles.rallyeModal.passwordSubtitle,
                  { color: mutedTextColor },
                ]}
              >
                {selectedRallyeStudiengang}
              </Text>
            ) : null}

            {/* Password input - no label, just placeholder */}
            <ThemedTextInput
              autoFocus={!!passwordRallye}
              style={globalStyles.rallyeModal.passwordInput}
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

            {/* Helper text */}
            <ThemedText
              style={globalStyles.rallyeModal.passwordHelper}
              variant="muted"
            >
              {t('rallye.password.helper')}
            </ThemedText>

            {/* Separator */}
            <View
              style={[
                globalStyles.rallyeModal.cancelButtonSeparator,
                {
                  backgroundColor: isDarkMode
                    ? Colors.darkMode.borderSubtle
                    : Colors.veryLightGray,
                },
              ]}
            />

            {/* Buttons */}
            <View style={globalStyles.rallyeModal.passwordButtonRow}>
              <UIButton
                onPress={slideBackToList}
                variant="ghost"
                style={globalStyles.rallyeModal.cancelButton}
                textStyle={globalStyles.rallyeModal.cancelButtonText}
                color={cancelTextColor}
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
      </KeyboardAvoidingView>
    </Modal>
  );
}
