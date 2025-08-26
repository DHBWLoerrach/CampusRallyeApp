import { RefreshControl, ScrollView, Text, View } from 'react-native';
import Colors from '@/utils/Colors';
import { globalStyles } from '@/utils/GlobalStyles';
import { useLanguage } from '@/utils/LanguageContext';
import ThemedScrollView from '@/components/themed/ThemedScrollView';
import ThemedText from '@/components/themed/ThemedText';
import { useAppStyles } from '@/utils/AppStyles';

export default function NoQuestions({ loading, onRefresh }: { loading: boolean; onRefresh: () => void }) {
  const { language } = useLanguage();
  const s = useAppStyles();
  return (
    <ThemedScrollView
      variant="background"
      contentContainerStyle={[globalStyles.default.refreshContainer, globalStyles.rallyeStatesStyles.container]}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
    >
      <View style={[globalStyles.rallyeStatesStyles.infoBox, s.infoBox]}>
        <ThemedText style={globalStyles.rallyeStatesStyles.infoTitle}>
          {language === 'de' ? 'Keine Fragen' : 'No questions'}
        </ThemedText>
        <ThemedText style={[globalStyles.rallyeStatesStyles.infoSubtitle, { marginTop: 10 }]}>
          {language === 'de'
            ? 'Momentan sind keine Fragen verfügbar.'
            : 'Currently no questions available.'}
        </ThemedText>
      </View>
      <View style={[globalStyles.rallyeStatesStyles.infoBox, s.infoBox]}>
        <Text style={{ color: Colors.dhbwRed, textAlign: 'center' }} onPress={onRefresh}>
          {language === 'de' ? 'Aktualisieren' : 'Refresh'}
        </Text>
      </View>
    </ThemedScrollView>
  );
}
