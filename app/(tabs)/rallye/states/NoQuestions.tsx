import { ActivityIndicator, RefreshControl } from 'react-native';
import { useAppStyles } from '@/utils/AppStyles';
import Colors from '@/utils/Colors';
import { globalStyles } from '@/utils/GlobalStyles';
import { useLanguage } from '@/utils/LanguageContext';
import { ScreenScrollView } from '@/components/ui/Screen';
import ThemedText from '@/components/themed/ThemedText';
import InfoBox from '@/components/ui/InfoBox';
import VStack from '@/components/ui/VStack';
import UIButton from '@/components/ui/UIButton';

export default function NoQuestions({
  loading,
  onRefresh,
}: {
  loading: boolean;
  onRefresh: () => void;
}) {
  const { t } = useLanguage();
  const s = useAppStyles();
  // While loading we show only an ActivityIndicator to prevent a brief flash of the
  // "No questions" message before the first batch of questions arrives.
  if (loading) {
    return (
      <ScreenScrollView
        padding="none"
        edges={['bottom']}
        contentContainerStyle={[
          globalStyles.default.refreshContainer,
          globalStyles.rallyeStatesStyles.container,
          { justifyContent: 'center', alignItems: 'center' },
        ]}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
      >
        <ActivityIndicator size="large" color={Colors.dhbwRed} />
      </ScreenScrollView>
    );
  }
  return (
    <ScreenScrollView
      padding="none"
      edges={['bottom']}
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
            {t('rallye.noQuestions.title')}
          </ThemedText>
          <ThemedText
            variant="body"
            style={[
              globalStyles.rallyeStatesStyles.infoSubtitle,
              s.muted,
              { marginTop: 10 },
            ]}
          >
            {t('rallye.noQuestions.message')}
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
