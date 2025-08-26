import { RefreshControl, ScrollView, Text, View } from 'react-native';
import Colors from '@/utils/Colors';
import { globalStyles } from '@/utils/GlobalStyles';
import { useLanguage } from '@/utils/LanguageContext';
import ThemedScrollView from '@/components/themed/ThemedScrollView';
import ThemedText from '@/components/themed/ThemedText';
import { useAppStyles } from '@/utils/AppStyles';

export default function Preparation({ loading, onRefresh }: { loading: boolean; onRefresh: () => void }) {
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
          {language === 'de' ? 'Die Rallye hat noch nicht begonnen' : 'The rally has not started yet'}
        </ThemedText>
        <ThemedText style={[globalStyles.rallyeStatesStyles.infoSubtitle, { marginTop: 10 }]}>
          {language === 'de' ? 'Bitte warte auf den Start der Rallye' : 'Please wait for the rally to start'}
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
