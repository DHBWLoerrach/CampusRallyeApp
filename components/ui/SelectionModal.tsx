import React from 'react';
import { FlatList, Modal, Text, View, ListRenderItem } from 'react-native';
import { globalStyles } from '@/utils/GlobalStyles';
import UIButton from './UIButton';
import Colors from '@/utils/Colors';
import { useLanguage } from '@/utils/LanguageContext';
import { useTheme } from '@/utils/ThemeContext';

export type SelectionItem = {
  id: number;
  name: string;
  subtitle?: string | null;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  items: SelectionItem[];
  onSelect: (item: SelectionItem) => void;
  title: string;
  emptyMessage?: string;
};

export default function SelectionModal({
  visible,
  onClose,
  items,
  onSelect,
  title,
  emptyMessage,
}: Props) {
  const { language } = useLanguage();
  const { isDarkMode } = useTheme();

  const renderItem: ListRenderItem<SelectionItem> = ({ item }) => (
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
        {item.subtitle && (
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
            {item.subtitle}
          </Text>
        )}
      </View>
      <UIButton onPress={() => onSelect(item)}>
        {language === 'de' ? 'Auswählen' : 'Select'}
      </UIButton>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={globalStyles.rallyeModal.modalContainer}>
        <View
          style={[
            globalStyles.rallyeModal.modalContent,
            {
              backgroundColor: isDarkMode
                ? Colors.darkMode.card
                : Colors.lightMode.background,
            },
          ]}
        >
          <Text
            style={[
              globalStyles.rallyeModal.modalTitle,
              { color: isDarkMode ? Colors.darkMode.text : Colors.lightMode.text },
            ]}
          >
            {title}
          </Text>
          {items.length > 0 ? (
            <FlatList
              data={items}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderItem}
            />
          ) : (
            <Text style={globalStyles.rallyeModal.noDataText}>
              {emptyMessage || (language === 'de' ? 'Keine Einträge verfügbar' : 'No items available')}
            </Text>
          )}
          <UIButton onPress={onClose}>
            {language === 'de' ? 'Abbrechen' : 'Cancel'}
          </UIButton>
        </View>
      </View>
    </Modal>
  );
}
