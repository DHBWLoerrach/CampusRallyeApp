import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { InfoCard, infoScreenStyles } from '@/components/infos/InfoCard';
import ThemedText from '@/components/themed/ThemedText';
import { ScreenScrollView } from '@/components/ui/Screen';
import { IconSymbol } from '@/components/ui/IconSymbol';
import Colors from '@/utils/Colors';
import { useLanguage } from '@/utils/LanguageContext';
import { useTheme } from '@/utils/ThemeContext';

const CONTENT = {
  de: {
    heroEyebrow: 'Infos',
    heroTitle: 'Rechtliches und Hintergrund',
    heroBody:
      'Hier findest du die rechtlichen Angaben zur App und den Hintergrund zu Projekt, Mitwirkenden und Version.',
    items: [
      {
        key: 'imprint',
        eyebrow: 'Rechtliches',
        title: 'Impressum',
        description: 'Kontakt, Anbieter und Pflichtangaben',
        icon: 'building.2',
        href: '/infos/imprint',
      },
      {
        key: 'about',
        eyebrow: 'Hintergrund',
        title: 'Über diese App',
        description: 'Projekt, Mitwirkende und Version',
        icon: 'info.circle',
        href: '/infos/about',
      },
    ],
  },
  en: {
    heroEyebrow: 'Info',
    heroTitle: 'Legal and project background',
    heroBody:
      'Find the app’s legal details here, together with context about the project, contributors, and version.',
    items: [
      {
        key: 'imprint',
        eyebrow: 'Legal',
        title: 'Imprint',
        description: 'Contact, provider, and mandatory details',
        icon: 'building.2',
        href: '/infos/imprint',
      },
      {
        key: 'about',
        eyebrow: 'Background',
        title: 'About this app',
        description: 'Project, contributors, and version',
        icon: 'info.circle',
        href: '/infos/about',
      },
    ],
  },
};

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

function InfoNavigationCard({
  description,
  eyebrow,
  icon,
  onPress,
  title,
}) {
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
          <IconSymbol name="chevron.right" size={20} color={palette.textMuted} />
        </View>
      </Pressable>
    </View>
  );
}

export default function Infos() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { language } = useLanguage();
  const palette = isDarkMode ? Colors.darkMode : Colors.lightMode;
  const content = CONTENT[language];

  return (
    <ScreenScrollView
      padding="none"
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
          style={[
            styles.heroAccent,
            { backgroundColor: Colors.dhbwRed },
          ]}
        />
        <View style={styles.heroHeader}>
          <ThemedText
            variant="caption"
            style={[infoScreenStyles.eyebrow, { color: Colors.dhbwRed }]}
          >
            {content.heroEyebrow}
          </ThemedText>
          <ThemedText variant="title">{content.heroTitle}</ThemedText>
          <ThemedText style={infoScreenStyles.bodyText}>
            {content.heroBody}
          </ThemedText>
        </View>
      </InfoCard>

      <View style={styles.navigationList}>
        {content.items.map((item) => (
          <InfoNavigationCard
            key={item.key}
            description={item.description}
            eyebrow={item.eyebrow}
            icon={item.icon}
            onPress={() => router.push(item.href)}
            title={item.title}
          />
        ))}
      </View>
    </ScreenScrollView>
  );
}
