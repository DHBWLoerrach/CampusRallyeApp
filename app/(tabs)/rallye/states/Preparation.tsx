import { RefreshControl } from 'react-native';
import { globalStyles } from '@/utils/GlobalStyles';
import { useLanguage } from '@/utils/LanguageContext';
import { ScreenScrollView } from '@/components/ui/Screen';
import ThemedText from '@/components/themed/ThemedText';
import { useAppStyles } from '@/utils/AppStyles';
import InfoBox from '@/components/ui/InfoBox';
import VStack from '@/components/ui/VStack';
import UIButton from '@/components/ui/UIButton';

export default function Preparation({
  loading,
  onRefresh,
}: {
  loading: boolean;
  onRefresh: () => void;
}) {
  const { t } = useLanguage();
  const s = useAppStyles();
  return (
    <ScreenScrollView
      padding="none"
      contentContainerStyle={[
        globalStyles.default.refreshContainer,
        globalStyles.rallyeStatesStyles.container,
      ]}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={onRefresh} />
      }
    >
      <VStack style={{ width: '100%' }} gap={2}>
        <InfoBox mb={2}>
          <ThemedText
            variant="title"
            style={[globalStyles.rallyeStatesStyles.infoTitle, s.text]}
          >
            {t('rallye.preparing.title')}
          </ThemedText>
          <ThemedText
            variant="body"
            style={[
              globalStyles.rallyeStatesStyles.infoSubtitle,
              s.muted,
              { marginTop: 10 },
            ]}
          >
            {t('rallye.preparing.message')}
          </ThemedText>
        </InfoBox>

        <InfoBox mb={2}>
          <UIButton
            variant="ghost"
            icon="rotate"
            disabled={loading}
            onPress={onRefresh}
          >
            {t('common.refresh')}
          </UIButton>
        </InfoBox>
      </VStack>
    </ScreenScrollView>
  );
}
