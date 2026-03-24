import { useEffect, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { QuestionProps } from '@/types/rallye';
import { useAppStyles } from '@/utils/AppStyles';
import Colors from '@/utils/Colors';
import { confirm } from '@/utils/ConfirmAlert';
import { globalStyles } from '@/utils/GlobalStyles';
import { useLanguage } from '@/utils/LanguageContext';
import { submitAnswerAndAdvance } from '@/services/storage/answerSubmission';
import { store$ } from '@/services/storage/Store';
import { supabase } from '@/utils/Supabase';
import ThemedScrollView from '@/components/themed/ThemedScrollView';
import ThemedText from '@/components/themed/ThemedText';
import UIButton from '@/components/ui/UIButton';
import InfoBox from '@/components/ui/InfoBox';
import VStack from '@/components/ui/VStack';
import Hint from '@/components/ui/Hint';

interface SortingItem {
  id: number;
  pairId: number;
  item: string;
}

export default function SortingQuestion({ question }: QuestionProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [primaryItems, setPrimaryItems] = useState<SortingItem[]>([]);
  const [secondaryItems, setSecondaryItems] = useState<SortingItem[]>([]);
  const [selectedPrimary, setSelectedPrimary] = useState<number | null>(null);
  // Map: secondaryItem.id -> pairId of the assigned primary
  const [assignments, setAssignments] = useState<Map<number, number>>(new Map());
  const s = useAppStyles();

  const team = store$.team.get();

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const { data: groupData, error: groupError } = await supabase
          .from('sorting_groups')
          .select('*')
          .eq('sorting_question_id', question.id)
          .single();

        if (groupError) throw groupError;
        if (!mounted || !groupData) return;

        const { data: pairsData, error: pairsError } = await supabase
          .from('sorting_pairs')
          .select('*')
          .eq('group_id', groupData.id);

        if (pairsError) throw pairsError;
        if (!mounted || !pairsData) return;

        const pairIds = pairsData.map((p: any) => p.id);

        const { data: itemsData, error: itemsError } = await supabase
          .from('sorting_pair_items')
          .select('*')
          .in('pair_id', pairIds);

        if (itemsError) throw itemsError;
        if (!mounted) return;

        const primaries: SortingItem[] = [];
        const secondaries: SortingItem[] = [];

        for (const item of (itemsData || [])) {
          const si: SortingItem = {
            id: item.id,
            pairId: item.pair_id,
            item: item.item,
          };
          if (item.is_primary) primaries.push(si);
          else secondaries.push(si);
        }

        // Shuffle secondary items so order gives no hint
        const shuffled = [...secondaries].sort(() => Math.random() - 0.5);
        setPrimaryItems(primaries);
        setSecondaryItems(shuffled);
      } catch (err) {
        console.error('Error loading sorting data:', err);
        Alert.alert(t('common.errorTitle'), t('sorting.error.loadPairs'));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [question.id, t]);

  const handlePrimaryPress = (pairId: number) => {
    setSelectedPrimary(prev => (prev === pairId ? null : pairId));
  };

  const handleSecondaryPress = (item: SortingItem) => {
    if (selectedPrimary === null) return;
    setAssignments(prev => {
      const next = new Map(prev);
      if (next.get(item.id) === selectedPrimary) {
        next.delete(item.id);
      } else {
        next.set(item.id, selectedPrimary);
      }
      return next;
    });
  };

  const allAssigned =
    secondaryItems.length > 0 &&
    secondaryItems.every(item => assignments.has(item.id));

  const handleSubmit = async () => {
    if (!allAssigned) {
      Alert.alert(t('common.errorTitle'), t('sorting.error.incompleteMessage'));
      return;
    }

    const confirmed = await confirm({
      title: t('confirm.answer.title'),
      message: t('sorting.confirm.message'),
      confirmText: t('confirm.answer.confirm'),
      cancelText: t('common.cancel'),
    });
    if (!confirmed) return;

    const isCorrect = secondaryItems.every(
      item => assignments.get(item.id) === item.pairId
    );

    const answerText = secondaryItems
      .map(item => {
        const assignedPrimary = primaryItems.find(
          p => p.pairId === assignments.get(item.id)
        );
        return `${item.item}→${assignedPrimary?.item ?? '?'}`;
      })
      .join(', ');

    setSubmitting(true);
    try {
      await submitAnswerAndAdvance({
        teamId: team?.id ?? null,
        questionId: question.id,
        answeredCorrectly: isCorrect,
        pointsAwarded: isCorrect ? question.points : 0,
        answerText,
      });
    } catch (e) {
      console.error('Error submitting sorting answer:', e);
      Alert.alert(t('common.errorTitle'), t('question.error.saveAnswer'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSurrender = async () => {
    const confirmed = await confirm({
      title: t('confirm.surrender.title'),
      message: t('confirm.surrender.message'),
      confirmText: t('confirm.surrender.confirm'),
      cancelText: t('common.cancel'),
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await submitAnswerAndAdvance({
        teamId: team?.id ?? null,
        questionId: question.id,
        answeredCorrectly: false,
        pointsAwarded: 0,
      });
    } catch (e) {
      console.error('Error surrendering sorting question:', e);
      Alert.alert(t('common.errorTitle'), t('question.error.surrender'));
    }
  };

  if (loading) {
    return (
      <ThemedScrollView
        variant="background"
        contentContainerStyle={globalStyles.default.refreshContainer}
      >
        <VStack style={globalStyles.default.container} gap={2}>
          <ThemedText style={s.text}>{t('common.loading')}</ThemedText>
        </VStack>
      </ThemedScrollView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ThemedScrollView
        variant="background"
        contentContainerStyle={[
          globalStyles.default.refreshContainer,
          question.hint ? { paddingBottom: 88 } : undefined,
        ]}
      >
        <VStack
          style={[globalStyles.default.container, { alignItems: 'stretch' }]}
          gap={2}
        >
          {/* Question text */}
          <InfoBox mb={0}>
            <ThemedText
              variant="title"
              style={[globalStyles.rallyeStatesStyles.infoTitle, s.text]}
            >
              {question.question}
            </ThemedText>
          </InfoBox>

          {/* Instruction */}
          <InfoBox mb={0}>
            <ThemedText variant="body" style={[s.text, { fontSize: 13, opacity: 0.7 }]}>
              {t('sorting.instruction')}
            </ThemedText>
          </InfoBox>

          {/* Primary items — tap to select as target */}
          <InfoBox mb={0} maxHeight={9999}>
            <ThemedText
              variant="body"
              style={[s.text, { fontWeight: '600', marginBottom: 8 }]}
            >
              {t('sorting.primaryItems')}
            </ThemedText>
            {primaryItems.map(primary => {
              const isSelected = selectedPrimary === primary.pairId;
              const assigned = secondaryItems.filter(
                si => assignments.get(si.id) === primary.pairId
              );
              return (
                <Pressable
                  key={primary.id}
                  onPress={() => handlePrimaryPress(primary.pairId)}
                  style={{
                    padding: 10,
                    marginBottom: 8,
                    borderRadius: 8,
                    backgroundColor: isSelected ? `${Colors.mediumGray}30` : `${Colors.mediumGray}12`,
                  }}
                >
                  <ThemedText variant="body" style={[s.text, { fontWeight: '500' }]}>
                    {primary.item}
                  </ThemedText>
                  {assigned.length > 0 && (
                    <ThemedText
                      variant="body"
                      style={{ color: Colors.dhbwRed, fontSize: 13, marginTop: 4 }}
                    >
                      → {assigned.map(i => i.item).join(', ')}
                    </ThemedText>
                  )}
                </Pressable>
              );
            })}
          </InfoBox>

          {/* Secondary items — tap to assign to selected primary */}
          <InfoBox mb={0} maxHeight={9999}>
            <ThemedText
              variant="body"
              style={[s.text, { fontWeight: '600', marginBottom: 8 }]}
            >
              {t('sorting.secondaryItems')}
            </ThemedText>
            {selectedPrimary !== null && (
              <ThemedText
                variant="body"
                style={[s.text, { fontSize: 13, opacity: 0.7, marginBottom: 8 }]}
              >
                {t('sorting.assignTo', {
                  name:
                    primaryItems.find(p => p.pairId === selectedPrimary)?.item ??
                    '',
                })}
              </ThemedText>
            )}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {secondaryItems.map(item => {
                const isAssigned = assignments.has(item.id);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => handleSecondaryPress(item)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 8,
                      backgroundColor: isAssigned ? `${Colors.mediumGray}30` : `${Colors.mediumGray}12`,
                    }}
                  >
                    <ThemedText variant="body" style={s.text}>
                      {item.item}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </InfoBox>

          {/* Submit */}
          <InfoBox mb={0}>
            <UIButton
              onPress={handleSubmit}
              disabled={submitting || !allAssigned}
              loading={submitting}
              color={allAssigned ? Colors.dhbwRed : Colors.dhbwGray}
            >
              {t('question.submit')}
            </UIButton>
          </InfoBox>

          {/* Surrender */}
          <InfoBox mb={0}>
            <UIButton
              onPress={handleSurrender}
              disabled={submitting}
              color={Colors.dhbwGray}
            >
              {t('common.surrender')}
            </UIButton>
          </InfoBox>
        </VStack>
      </ThemedScrollView>
      {question.hint && <Hint hint={question.hint} />}
    </View>
  );
}
