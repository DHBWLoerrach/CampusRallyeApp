import { RefreshControl, ScrollView, Text, View } from 'react-native';
import Colors from '@/utils/Colors';
import { globalStyles } from '@/utils/GlobalStyles';
import { useLanguage } from '@/utils/LanguageContext';
import ThemedScrollView from '@/components/themed/ThemedScrollView';
import ThemedText from '@/components/themed/ThemedText';
import { useAppStyles } from '@/utils/AppStyles';
import InfoBox from '@/components/ui/InfoBox';
import VStack from '@/components/ui/VStack';

export default function NoQuestions({ loading, onRefresh }: { loading: boolean; onRefresh: () => void }) {
  const { language } = useLanguage();
  const s = useAppStyles();
  return (
    <ThemedScrollView
      variant="background"
      contentContainerStyle={[globalStyles.default.refreshContainer, globalStyles.rallyeStatesStyles.container]}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
    >
      <VStack style={{ width: '100%' }} gap={2}>
        <InfoBox mb={2}>
          <ThemedText style={globalStyles.rallyeStatesStyles.infoTitle}>
            {language === 'de' ? 'Keine Fragen' : 'No questions'}
          </ThemedText>
          <ThemedText style={[globalStyles.rallyeStatesStyles.infoSubtitle, { marginTop: 10 }]}>
            {language === 'de'
              ? 'Momentan sind keine Fragen verfügbar.'
              : 'Currently no questions available.'}
          </ThemedText>
        </InfoBox>
        <InfoBox mb={2}>
          <Text style={{ color: Colors.dhbwRed, textAlign: 'center' }} onPress={onRefresh}>
            {language === 'de' ? 'Aktualisieren' : 'Refresh'}
          </Text>
        </InfoBox>
      </VStack>
    </ThemedScrollView>
  );
}
