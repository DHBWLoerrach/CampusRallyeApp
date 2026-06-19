import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import UIButton from './UIButton';
import Colors from '@/utils/Colors';
import { useLanguage } from '@/utils/LanguageContext';
import { useTheme } from '@/utils/ThemeContext';
import type { RallyeRow } from '@/services/storage/rallyeStorage';
import ThemedText from '@/components/themed/ThemedText';
import ThemedTextInput from '@/components/themed/ThemedTextInput';
import { getSoftCtaButtonStyles } from '@/utils/buttonStyles';

export function isPasswordRequired(
  rallye: Pick<RallyeRow, 'password'> | null | undefined
) {
  return !!(rallye?.password ?? '').trim().length;
}

type Props = {
  rallye: RallyeRow | null;
  joining?: boolean;
  onClose: () => void;
  onJoin: (rallye: RallyeRow) => Promise<boolean>;
};

export default function RallyePasswordSheet({
  rallye,
  joining = false,
  onClose,
  onJoin,
}: Props) {
  const { t } = useLanguage();
  const { isDarkMode } = useTheme();
  const [password, setPassword] = useState('');
  const [autoFocusInput, setAutoFocusInput] = useState(false);
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;
  const cancelTextColor = palette.textMuted ?? Colors.mediumGray;
  const { buttonStyle: ctaButtonStyle, textStyle: ctaButtonTextStyle } =
    getSoftCtaButtonStyles(palette);

  useEffect(() => {
    setPassword('');
    setAutoFocusInput(false);

    const id = setTimeout(() => {
      setAutoFocusInput(true);
    }, 250);

    return () => clearTimeout(id);
  }, [rallye?.id]);

  const confirmAndJoin = async () => {
    if (!rallye || joining) return;

    const requiredPassword = (rallye.password ?? '').trim();
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

    await onJoin(rallye);
  };

  return (
    <KeyboardAvoidingView
      behavior={process.env.EXPO_OS === 'ios' ? 'padding' : 'height'}
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode
            ? Colors.darkMode.card
            : Colors.lightMode.card,
        },
      ]}
    >
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <ThemedText variant="title" numberOfLines={2} style={styles.title}>
          {rallye?.name ?? t('rallye.modal.activeTitle')}
        </ThemedText>

        <ThemedTextInput
          autoFocus={autoFocusInput}
          style={styles.passwordInput}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder={t('rallye.password.placeholder')}
          accessibilityLabel={t('rallye.password.label')}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={() => void confirmAndJoin()}
        />

        <ThemedText style={styles.passwordHelper} variant="muted">
          {t('rallye.password.helper')}
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
          onPress={onClose}
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
          {t('rallye.password.join')}
        </UIButton>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentScroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 14,
    textAlign: 'left',
    alignSelf: 'stretch',
  },
  passwordInput: {
    width: '100%',
    height: 44,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.dhbwGray,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  passwordHelper: {
    textAlign: 'left',
    marginBottom: 8,
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
