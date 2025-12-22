import { RefreshControl } from 'react-native';
import { globalStyles } from '@/utils/GlobalStyles';
import { useLanguage } from '@/utils/LanguageContext';
import { ScreenScrollView } from '@/components/ui/Screen';
import ThemedText from '@/components/themed/ThemedText';
import { useAppStyles } from '@/utils/AppStyles';
import InfoBox from '@/components/ui/InfoBox';
import VStack from '@/components/ui/VStack';
import UIButton from '@/components/ui/UIButton';

export default function Preparation({ loading, onRefresh }: { loading: boolean; onRefresh: () => void }) {
  const { language } = useLanguage();
  const s = useAppStyles();
  return (
    <ScreenScrollView
      padding="none"
      contentContainerStyle={[
        globalStyles.default.refreshContainer,
        globalStyles.rallyeStatesStyles.container,
      ]}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
    >
      <VStack style={{ width: '100%' }} gap={2}>
        <InfoBox mb={2}>
          <ThemedText variant="title" style={globalStyles.rallyeStatesStyles.infoTitle}>
            {language === 'de' ? 'Die Rallye hat noch nicht begonnen' : 'The rally has not started yet'}
          </ThemedText>
          <ThemedText
            variant="body"
            style={[globalStyles.rallyeStatesStyles.infoSubtitle, { marginTop: 10 }]}
          >
            {language === 'de' ? 'Bitte warte auf den Start der Rallye' : 'Please wait for the rally to start'}
          </ThemedText>
        </InfoBox>

        <InfoBox mb={2}>
          <UIButton
            variant="ghost"
            icon="rotate"
            disabled={loading}
            onPress={onRefresh}
          >
            {language === 'de' ? 'Aktualisieren' : 'Refresh'}
          </UIButton>
        </InfoBox>
      </VStack>
    </ScreenScrollView>
  );
}
