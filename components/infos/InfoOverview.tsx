import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { InfoCard, infoScreenStyles } from '@/components/infos/InfoCard';
import ThemedText from '@/components/themed/ThemedText';
import { ScreenScrollView } from '@/components/ui/Screen';
import { IconSymbol, type IconSymbolName } from '@/components/ui/IconSymbol';
import Colors from '@/utils/Colors';
import { useLanguage } from '@/utils/LanguageContext';
import { useTheme } from '@/utils/ThemeContext';
import type { TranslationKey } from '@/utils/i18n';

type InfoOverviewItemKey = 'imprint' | 'about';

type InfoOverviewItem = {
  key: InfoOverviewItemKey;
  eyebrowKey: TranslationKey;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  icon: IconSymbolName;
};

const ITEMS: InfoOverviewItem[] = [
  {
    key: 'imprint',
    eyebrowKey: 'infos.imprintEyebrow',
    titleKey: 'infos.imprint',
    descriptionKey: 'infos.imprintDescription',
    icon: 'building.2',
  },
  {
    key: 'about',
    eyebrowKey: 'infos.aboutEyebrow',
    titleKey: 'infos.about',
    descriptionKey: 'infos.aboutDescription',
    icon: 'info.circle',
  },
];

const styles = StyleSheet.create({
  heroCard: {
    paddingTop: 0,
    overflow: 'hidden',
  },
  heroAccent: {
    height: 6,
    marginHorizontal: -18,
    marginBottom: 14,
  },
  heroHeader: {
    gap: 6,
  },
  navigationList: {
    gap: 12,
  },
  navigationCard: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  navigationPressable: {
    padding: 18,
  },
  navigationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 4,
  },
});

type InfoNavigationCardProps = {
  description: string;
  eyebrow: string;
  icon: IconSymbolName;
  onPress: () => void;
  title: string;
};

function InfoNavigationCard({
  description,
  eyebrow,
  icon,
  onPress,
  title,
}: InfoNavigationCardProps) {
  const { isDarkMode } = useTheme();
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;

  return (
    <View
      style={[
        styles.navigationCard,
        {
          backgroundColor: palette.surface1,
          borderColor: palette.borderSubtle,
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        onPress={onPress}
        style={({ pressed }) => [
          styles.navigationPressable,
          pressed ? { opacity: 0.84 } : null,
        ]}
      >
        <View style={styles.navigationContent}>
          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor: isDarkMode ? palette.surface2 : '#FFF3F5',
              },
            ]}
          >
            <IconSymbol name={icon} size={22} color={Colors.dhbwRed} />
          </View>
          <View style={styles.textWrap}>
            <ThemedText
              variant="caption"
              style={[infoScreenStyles.eyebrow, { color: Colors.dhbwRed }]}
            >
              {eyebrow}
            </ThemedText>
            <ThemedText variant="bodyStrong">{title}</ThemedText>
            <ThemedText variant="muted">{description}</ThemedText>
          </View>
          <IconSymbol
            name="chevron.right"
            size={20}
            color={palette.textMuted}
          />
        </View>
      </Pressable>
    </View>
  );
}

/** Both info stacks render this overview under their own path prefix. */
type InfoBasePath = '/info' | '/infos';

type InfoOverviewProps = {
  basePath: InfoBasePath;
};

export default function InfoOverview({ basePath }: InfoOverviewProps) {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;

  return (
    <ScreenScrollView
      padding="none"
      edges={['bottom']}
      contentContainerStyle={[
        infoScreenStyles.content,
        { backgroundColor: palette.background },
      ]}
    >
      <InfoCard
        style={[
          styles.heroCard,
          {
            backgroundColor: isDarkMode ? palette.surface1 : '#FFF6F7',
          },
        ]}
      >
        <View
          style={[styles.heroAccent, { backgroundColor: Colors.dhbwRed }]}
        />
        <View style={styles.heroHeader}>
          <ThemedText
            variant="caption"
            style={[infoScreenStyles.eyebrow, { color: Colors.dhbwRed }]}
          >
            {t('infos.title')}
          </ThemedText>
          <ThemedText variant="title">{t('infos.heroTitle')}</ThemedText>
          <ThemedText style={infoScreenStyles.bodyText}>
            {t('infos.heroBody')}
          </ThemedText>
        </View>
      </InfoCard>

      <View style={styles.navigationList}>
        {ITEMS.map((item) => (
          <InfoNavigationCard
            key={item.key}
            description={t(item.descriptionKey)}
            eyebrow={t(item.eyebrowKey)}
            icon={item.icon}
            onPress={() => router.push(`${basePath}/${item.key}`)}
            title={t(item.titleKey)}
          />
        ))}
      </View>
    </ScreenScrollView>
  );
}
