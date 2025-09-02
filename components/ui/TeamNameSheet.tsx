import React, { useEffect } from 'react';
import { Modal, Text, View } from 'react-native';
import Colors from '@/utils/Colors';
import { useTheme } from '@/utils/ThemeContext';
import { useLanguage } from '@/utils/LanguageContext';

type Props = {
  visible: boolean;
  name: string;
  onClose: () => void;
  durationMs?: number;
};

export default function TeamNameSheet({
  visible,
  name,
  onClose,
  durationMs = 3000,
}: Props) {
  const { isDarkMode } = useTheme();
  const { language } = useLanguage();
  useEffect(() => {
    if (!visible) return;
    const id = setTimeout(onClose, durationMs);
    return () => clearTimeout(id);
  }, [visible, durationMs, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(0,0,0,0.3)',
        }}
      >
        <View
          style={{
            width: '100%',
            padding: 20,
            paddingBottom: 30,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            backgroundColor: isDarkMode
              ? Colors.darkMode.card
              : Colors.lightMode.card,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text,
              textAlign: 'center',
              marginBottom: 6,
              opacity: 0.8,
            }}
          >
            {language === 'de' ? 'Euer Team' : 'Your Team'}
          </Text>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '600',
              color: Colors.dhbwRed,
              textAlign: 'center',
            }}
          >
            {name}
          </Text>
        </View>
      </View>
    </Modal>
  );
}
