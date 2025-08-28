import { RefreshControl, ScrollView, Text, View } from 'react-native';
import Colors from '@/utils/Colors';
import { globalStyles } from '@/utils/GlobalStyles';
import { useLanguage } from '@/utils/LanguageContext';
import ThemedScrollView from '@/components/themed/ThemedScrollView';
import ThemedText from '@/components/themed/ThemedText';
import { useAppStyles } from '@/utils/AppStyles';
import InfoBox from '@/components/ui/InfoBox';
import VStack from '@/components/ui/VStack';

export default function Preparation({ loading, onRefresh }: { loading: boolean; onRefresh: () => void }) {
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
            {language === 'de' ? 'Die Rallye hat noch nicht begonnen' : 'The rally has not started yet'}
          </ThemedText>
          <ThemedText style={[globalStyles.rallyeStatesStyles.infoSubtitle, { marginTop: 10 }]}>
            {language === 'de' ? 'Bitte warte auf den Start der Rallye' : 'Please wait for the rally to start'}
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
