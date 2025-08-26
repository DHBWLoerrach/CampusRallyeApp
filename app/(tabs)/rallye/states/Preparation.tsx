import { RefreshControl, ScrollView, Text, View } from 'react-native';
import Colors from '@/utils/Colors';
import { globalStyles } from '@/utils/GlobalStyles';
import { useLanguage } from '@/utils/LanguageContext';
import { useTheme } from '@/utils/ThemeContext';

export default function Preparation({ loading, onRefresh }: { loading: boolean; onRefresh: () => void }) {
  const { language } = useLanguage();
  const { isDarkMode } = useTheme();
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;
  return (
    <ScrollView
      contentContainerStyle={[
        globalStyles.default.refreshContainer,
        globalStyles.rallyeStatesStyles.container,
        { backgroundColor: palette.background },
      ]}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
    >
      <View style={[globalStyles.rallyeStatesStyles.infoBox, { backgroundColor: palette.card }]}>
        <Text style={[globalStyles.rallyeStatesStyles.infoTitle, { color: palette.text }]}>
          {language === 'de' ? 'Die Rallye hat noch nicht begonnen' : 'The rally has not started yet'}
        </Text>
        <Text style={[globalStyles.rallyeStatesStyles.infoSubtitle, { color: palette.text }]}>
          {language === 'de' ? 'Bitte warte auf den Start der Rallye' : 'Please wait for the rally to start'}
        </Text>
      </View>
      <View style={[globalStyles.rallyeStatesStyles.infoBox, { backgroundColor: palette.card }]}>
        <Text style={{ color: Colors.dhbwRed, textAlign: 'center' }} onPress={onRefresh}>
          {language === 'de' ? 'Aktualisieren' : 'Refresh'}
        </Text>
      </View>
    </ScrollView>
  );
}
