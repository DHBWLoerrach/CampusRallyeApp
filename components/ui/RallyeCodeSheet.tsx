import React, { useEffect, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import UIButton from './UIButton';
import Colors from '@/utils/Colors';
import Constants from '@/utils/Constants';
import { useLanguage } from '@/utils/LanguageContext';
import { useTheme } from '@/utils/ThemeContext';
import type { RallyeRow } from '@/services/storage/rallyeStorage';
import ThemedText from '@/components/themed/ThemedText';
import ThemedTextInput from '@/components/themed/ThemedTextInput';
import { getSoftCtaButtonStyles } from '@/utils/buttonStyles';

export function isRallyeCodeRequired(
  rallye: Pick<RallyeRow, 'rallye_code'> | null | undefined
) {
  return !!(rallye?.rallye_code ?? '').trim().length;
}

type Props = {
  rallye: RallyeRow | null;
  joining?: boolean;
  onClose: () => void;
  onJoin: (rallye: RallyeRow) => Promise<boolean>;
};

export default function RallyeCodeSheet({
  rallye,
  joining = false,
  onClose,
  onJoin,
}: Props) {
  const { t } = useLanguage();
  const { isDarkMode } = useTheme();
  const [rallyeCode, setRallyeCode] = useState('');
  const [autoFocusInput, setAutoFocusInput] = useState(false);
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;
  const cancelTextColor = palette.textMuted ?? Colors.mediumGray;
  const { buttonStyle: ctaButtonStyle, textStyle: ctaButtonTextStyle } =
    getSoftCtaButtonStyles(palette);

  const closeSheet = () => {
    Keyboard.dismiss();
    onClose();
  };

  useEffect(() => {
    setRallyeCode('');
    setAutoFocusInput(false);

    const id = setTimeout(() => {
      setAutoFocusInput(true);
    }, 250);

    return () => clearTimeout(id);
  }, [rallye?.id]);

  const confirmAndJoin = async () => {
    if (!rallye || joining) return;

    const requiredCode = (rallye.rallye_code ?? '').trim();
    const codeAttempt = rallyeCode.trim();

    if (!codeAttempt) {
      Alert.alert(
        t('rallye.code.missing.title'),
        t('rallye.code.missing.message')
      );
      return;
    }

    if (codeAttempt !== requiredCode) {
      Alert.alert(t('rallye.code.wrong.title'), t('rallye.code.wrong.message'));
      return;
    }

    await onJoin(rallye);
  };

  return (
    <KeyboardAvoidingView
      behavior={process.env.EXPO_OS === 'ios' ? 'padding' : 'height'}
      style={styles.overlay}
    >
      <Pressable
        testID="rallye-code-backdrop"
        style={styles.backdrop}
        onPress={closeSheet}
        disabled={joining}
        accessible={false}
      />

      <View
        style={[
          styles.card,
          {
            backgroundColor: isDarkMode
              ? Colors.darkMode.card
              : Colors.lightMode.card,
          },
        ]}
        accessibilityViewIsModal
        importantForAccessibility="yes"
      >
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          <ThemedText
            variant="dialogTitle"
            numberOfLines={2}
            style={styles.title}
          >
            {rallye?.name ?? t('rallye.modal.activeTitle')}
          </ThemedText>

          <ThemedText style={styles.subtitle} variant="muted">
            {t('rallye.code.subtitle')}
          </ThemedText>

          <ThemedTextInput
            autoFocus={autoFocusInput}
            style={styles.codeInput}
            value={rallyeCode}
            onChangeText={setRallyeCode}
            placeholder={t('rallye.code.placeholder')}
            accessibilityLabel={t('rallye.code.label')}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={() => void confirmAndJoin()}
          />

          <ThemedText style={styles.codeHelper} variant="muted">
            {t('rallye.code.helper')}
          </ThemedText>
        </ScrollView>

        <View
          style={[
            styles.separator,
            {
              backgroundColor: isDarkMode
                ? Colors.darkMode.borderSubtle
                : Colors.veryLightGray,
            },
          ]}
        />

        <View style={styles.footer}>
          <UIButton
            onPress={closeSheet}
            variant="ghost"
            style={styles.cancelButton}
            textStyle={styles.cancelButtonText}
            color={cancelTextColor}
            disabled={joining}
          >
            {t('common.cancel')}
          </UIButton>
          <UIButton
            onPress={() => void confirmAndJoin()}
            size="dialog"
            style={[styles.joinButton, ctaButtonStyle]}
            textStyle={ctaButtonTextStyle}
            loading={joining}
          >
            {t('rallye.code.join')}
          </UIButton>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '100%',
    flexShrink: 1,
    borderRadius: Constants.cornerRadius,
    overflow: 'hidden',
    paddingTop: 24,
  },
  contentScroll: {
    flexShrink: 1,
  },
  content: {
    paddingHorizontal: 24,
  },
  title: {
    marginBottom: 4,
    textAlign: 'left',
    alignSelf: 'stretch',
  },
  subtitle: {
    marginBottom: 16,
    textAlign: 'left',
    alignSelf: 'stretch',
    fontSize: 14,
  },
  codeInput: {
    width: '100%',
    height: 44,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.dhbwGray,
    borderRadius: Constants.cornerRadius,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  codeHelper: {
    textAlign: 'left',
    marginBottom: 16,
    fontSize: 13,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 20,
  },
  cancelButton: {
    flex: 1,
    minHeight: 44,
  },
  cancelButtonText: {
    textDecorationLine: 'none',
  },
  joinButton: {
    flex: 1,
    minHeight: 44,
  },
});
