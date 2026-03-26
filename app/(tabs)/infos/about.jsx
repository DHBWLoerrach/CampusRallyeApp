import * as Application from 'expo-application';
import React from 'react';
import {
  Linking,
  StyleSheet,
  View,
} from 'react-native';
import {
  InfoCard,
  InfoLinkCard,
  InfoSectionHeader,
  infoScreenStyles,
} from '@/components/infos/InfoCard';
import ThemedText from '@/components/themed/ThemedText';
import { ScreenScrollView } from '@/components/ui/Screen';
import Colors from '@/utils/Colors';
import { useLanguage } from '@/utils/LanguageContext';
import { useTheme } from '@/utils/ThemeContext';

const REPOSITORY_URL = 'https://github.com/DHBWLoerrach/CampusRallyeApp';

const CONTENT = {
  de: {
    heroEyebrow: 'Studierendenprojekt',
    heroTitle: 'Campus Rallye App der DHBW Lörrach',
    heroBody:
      'Am SZI entwickelt, mit Studierenden umgesetzt und als Open Source Projekt kontinuierlich weitergeführt.',
    originLabel: 'Projektidee',
    originText:
      'Die Idee zu dieser Campus Rallye App entstand aus einer Idee von Ulrike Menke, Managerin Studienzentrum IT-Management und Informatik der DHBW Lörrach (SZI).',
    implementationLabel: 'Konzeption und Umsetzung',
    implementationText:
      'Die Konzeption und Umsetzung erfolgt an der DHBW Lörrach durch Studierende im Rahmen von Studienarbeiten und Projekten am SZI unter Betreuung und Leitung von Ulrike Menke (Konzeptgestaltung und Projektbetreuung) und Prof. Dr. Erik Behrends (technische Umsetzung).',
    contributorsLabel: 'Mitwirkende',
    formerContributorsLabel: 'Ehemalige Beteiligte',
    formerContributorsText:
      'Von Seiten der DHBW Lörrach: Selina Quade',
    studentContributorsLabel: 'Studierende nach Jahrgang',
    openSourceLabel: 'Open Source',
    openSourceText:
      'Der aktuelle Quellcode ist öffentlich auf GitHub verfügbar.',
    openSourceTitle: 'Quellcode',
    repositoryLabel: 'Auf GitHub ansehen',
    versionLabel: 'App-Version',
    contributorGroups: [
      {
        cohort: 'TIF20',
        names: 'Fabian Kaiser, Sophie Strittmatter',
      },
      {
        cohort: 'TIF21',
        names: 'Patrick Furtwängler, Marvin Obert',
      },
      {
        cohort: 'TIF22',
        names: 'Roman von Bosse, Leon Jegg',
      },
      {
        cohort: 'TIF23',
        names: 'Maria Happ, Tobias Maimone',
      },
    ],
  },
  en: {
    heroEyebrow: 'Student project',
    heroTitle: 'Campus Rallye App by DHBW Loerrach',
    heroBody:
      'Created at SZI, implemented with students, and continuously maintained as an open source project.',
    originLabel: 'Project idea',
    originText:
      'The idea for this Campus Rallye App came from an idea by Ulrike Menke, Manager of the IT Management and Computer Science Study Center at DHBW Lörrach (SZI).',
    implementationLabel: 'Concept and implementation',
    implementationText:
      'The conception and implementation is carried out at DHBW Lörrach by students as part of projects at SZI under the supervision and direction of Ulrike Menke (concept design and project supervision) and Prof. Dr. Erik Behrends (technical implementation).',
    contributorsLabel: 'Contributors',
    formerContributorsLabel: 'Former contributors',
    formerContributorsText: 'From DHBW Lörrach: Selina Quade',
    studentContributorsLabel: 'Students by cohort',
    openSourceLabel: 'Open source',
    openSourceText:
      'The current source code is publicly available on GitHub.',
    openSourceTitle: 'Source code',
    repositoryLabel: 'View on GitHub',
    versionLabel: 'App version',
    contributorGroups: [
      {
        cohort: 'TIF20',
        names: 'Fabian Kaiser, Sophie Strittmatter',
      },
      {
        cohort: 'TIF21',
        names: 'Patrick Furtwängler, Marvin Obert',
      },
      {
        cohort: 'TIF22',
        names: 'Roman von Bosse, Leon Jegg',
      },
      {
        cohort: 'TIF23',
        names: 'Maria Happ, Tobias Maimone',
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
  contributorsSection: {
    gap: 14,
  },
  contributorIntroCard: {
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },
  contributorList: {
    gap: 10,
  },
  contributorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 4,
  },
  contributorBullet: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginTop: 7,
  },
  contributorText: {
    flex: 1,
    gap: 2,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  versionValue: {
    fontVariant: ['tabular-nums'],
    textAlign: 'right',
  },
});

function AppVersion({ label }) {
  const version = Application.nativeApplicationVersion ?? '?';
  const build = Application.nativeBuildVersion ?? '?';

  return (
    <View style={styles.versionRow}>
      <ThemedText variant="bodyStrong">{label}</ThemedText>
      <ThemedText
        selectable
        variant="bodyStrong"
        style={styles.versionValue}
      >
        {`${version} (${build})`}
      </ThemedText>
    </View>
  );
}

export default function About() {
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
            {
              backgroundColor: Colors.dhbwRed,
            },
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

      <InfoCard>
        <InfoSectionHeader
          label={content.originLabel}
          title={content.implementationLabel}
        />
        <ThemedText style={infoScreenStyles.bodyText}>
          {content.originText}
        </ThemedText>
        <ThemedText style={infoScreenStyles.bodyText}>
          {content.implementationText}
        </ThemedText>
      </InfoCard>

      <InfoCard>
        <InfoSectionHeader
          label={content.contributorsLabel}
          title={content.studentContributorsLabel}
        />
        <View style={styles.contributorsSection}>
          <InfoCard style={styles.contributorIntroCard} tone="subtle">
            <ThemedText variant="label">
              {content.formerContributorsLabel}
            </ThemedText>
            <ThemedText selectable style={infoScreenStyles.bodyText}>
              {content.formerContributorsText}
            </ThemedText>
          </InfoCard>

          <View style={styles.contributorList}>
            {content.contributorGroups.map((group) => (
              <View key={group.cohort} style={styles.contributorRow}>
                <View
                  style={[
                    styles.contributorBullet,
                    { backgroundColor: Colors.dhbwRed },
                  ]}
                />
                <View style={styles.contributorText}>
                  <ThemedText variant="label">{group.cohort}</ThemedText>
                  <ThemedText selectable style={infoScreenStyles.bodyText}>
                    {group.names}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
        </View>
      </InfoCard>

      <InfoCard>
        <InfoSectionHeader
          label={content.openSourceLabel}
          title={content.openSourceTitle}
        />
        <ThemedText style={infoScreenStyles.bodyText}>
          {content.openSourceText}
        </ThemedText>
        <InfoLinkCard
          accessibilityLabel={content.repositoryLabel}
          label={content.repositoryLabel}
          onPress={() => {
            void Linking.openURL(REPOSITORY_URL);
          }}
          value={REPOSITORY_URL}
        />
      </InfoCard>

      <InfoCard>
        <AppVersion label={content.versionLabel} />
      </InfoCard>
    </ScreenScrollView>
  );
}
