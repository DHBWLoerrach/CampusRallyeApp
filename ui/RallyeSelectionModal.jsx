import { FlatList, Modal, Text, View, useColorScheme } from 'react-native';
import { globalStyles } from '@/utils/GlobalStyles';
import UIButton from '@/ui/UIButton';
import Colors from '@/utils/Colors';
import { useLanguage } from '@/utils/LanguageContext';

function getStatusText(status, language) {
  switch (status) {
    case 'preparing':
      return language === 'de' ? 'Noch nicht gestartet' : 'Not started';
    case 'running':
      return language === 'de' ? 'Gestartet' : 'Started';
    case 'post_processing':
      return language === 'de' ? 'Abstimmung' : 'Voting';
    case 'ended':
      return language === 'de' ? 'Beendet' : 'Ended';
  }
}

const RallyeSelectionModal = ({
  visible,
  onClose,
  activeRallyes,
  onSelect,
}) => {
  const { language } = useLanguage();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const renderItem = ({ item }) => (
    <View
      style={[
        globalStyles.rallyeModal.rallyeCard,
        {
          backgroundColor: isDarkMode
            ? Colors.darkMode.dhbwGray
            : globalStyles.rallyeModal.rallyeCard.backgroundColor,
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
        <Text
          style={[
            globalStyles.rallyeModal.rallyeStudiengang,
            {
              color: isDarkMode
                ? Colors.darkMode.text
                : globalStyles.rallyeModal.rallyeStudiengang.color,
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
                : globalStyles.rallyeModal.rallyeStatus.color,
            },
          ]}
        >
          {getStatusText(item.status, language)}
        </Text>
      </View>
      <UIButton
        onPress={() => onSelect(item)}
        style={globalStyles.rallyeModal.selectButton}
      >
        {language === 'de' ? 'Auswählen' : 'Select'}
      </UIButton>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
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
              {
                color: isDarkMode
                  ? Colors.darkMode.text
                  : Colors.lightMode.text,
              },
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
          <UIButton
            onPress={onClose}
            style={globalStyles.rallyeModal.cancelButton}
          >
            {language === 'de' ? 'Abbrechen' : 'Cancel'}
          </UIButton>
        </View>
      </View>
    </Modal>
  );
};

export default RallyeSelectionModal;
