import React from 'react';
import { FlatList, Modal, Text, View, ListRenderItem } from 'react-native';
import { globalStyles } from '@/utils/GlobalStyles';
import UIButton from './UIButton';
import Colors from '@/utils/Colors';
import { useLanguage } from '@/utils/LanguageContext';
import { useTheme } from '@/utils/ThemeContext';

type RallyeItem = {
  id: number;
  name: string;
  studiengang?: string | null;
  status: 'preparing' | 'running' | 'post_processing' | 'ended' | string;
};

function getStatusText(status: RallyeItem['status'], language: 'de' | 'en') {
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
  activeRallyes: RallyeItem[];
  onSelect: (r: RallyeItem) => void;
};

export default function RallyeSelectionModal({ visible, onClose, activeRallyes, onSelect }: Props) {
  const { language } = useLanguage();
  const { isDarkMode } = useTheme();

  const renderItem: ListRenderItem<RallyeItem> = ({ item }) => (
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
      <UIButton onPress={() => onSelect(item)} style={globalStyles.rallyeModal.selectButton as any}>
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
          <UIButton onPress={onClose} style={globalStyles.rallyeModal.cancelButton as any}>
            {language === 'de' ? 'Abbrechen' : 'Cancel'}
          </UIButton>
        </View>
      </View>
    </Modal>
  );
}
