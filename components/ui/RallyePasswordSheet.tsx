import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  View,
} from 'react-native';
import { globalStyles } from '@/utils/GlobalStyles';
import UIButton from './UIButton';
import Colors from '@/utils/Colors';
import { useLanguage } from '@/utils/LanguageContext';
import { useTheme } from '@/utils/ThemeContext';
import type { RallyeRow } from '@/services/storage/rallyeStorage';
import ThemedText from '@/components/themed/ThemedText';
import ThemedTextInput from '@/components/themed/ThemedTextInput';
import { getSoftCtaButtonStyles } from '@/utils/buttonStyles';

export function isPasswordRequired(rallye: Pick<RallyeRow, 'password'> | null | undefined) {
  return !!(rallye?.password ?? '').trim().length;
}

type Props = {
  visible: boolean;
  rallye: RallyeRow | null;
  joining?: boolean;
  onClose: () => void;
  onJoin: (rallye: RallyeRow) => Promise<boolean>;
};

export default function RallyePasswordSheet({
  visible,
  rallye,
  joining = false,
  onClose,
  onJoin,
}: Props) {
  const { t } = useLanguage();
  const { isDarkMode } = useTheme();
  const [password, setPassword] = useState('');
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;
  const cancelTextColor = palette.textMuted ?? Colors.mediumGray;
  const { buttonStyle: ctaButtonStyle, textStyle: ctaButtonTextStyle } =
    getSoftCtaButtonStyles(palette);

  useEffect(() => {
    if (!visible) setPassword('');
  }, [visible]);

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

    const ok = await onJoin(rallye);
    if (ok) onClose();
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
            { backgroundColor: isDarkMode ? Colors.darkMode.card : Colors.lightMode.card },
          ]}
        >
          <ThemedText variant="title" style={globalStyles.rallyeModal.modalTitle}>
            {rallye?.name ?? t('rallye.modal.activeTitle')}
          </ThemedText>

          <ThemedTextInput
            autoFocus={visible}
            style={globalStyles.rallyeModal.passwordInput}
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

          <ThemedText style={globalStyles.rallyeModal.passwordHelper} variant="muted">
            {t('rallye.password.helper')}
          </ThemedText>

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

          <View style={globalStyles.rallyeModal.passwordButtonRow}>
            <UIButton
              onPress={onClose}
              variant="ghost"
              style={globalStyles.rallyeModal.cancelButton}
              textStyle={globalStyles.rallyeModal.cancelButtonText}
              color={cancelTextColor}
              disabled={joining}
            >
              {t('common.cancel')}
            </UIButton>
            <UIButton
              onPress={() => void confirmAndJoin()}
              size="dialog"
              style={ctaButtonStyle}
              textStyle={ctaButtonTextStyle}
              loading={joining}
            >
              {t('rallye.password.join')}
            </UIButton>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
