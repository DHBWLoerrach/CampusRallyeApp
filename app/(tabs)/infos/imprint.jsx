import React from 'react';
import { Linking, StyleSheet, View } from 'react-native';
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

const DHBW_WEBSITE_URL = 'https://dhbw-loerrach.de';
const MINISTRY_WEBSITE_URL = 'https://www.mwk.bwl.de';
const DHBW_EMAIL = 'info@dhbw-loerrach.de';
const MINISTRY_EMAIL = 'poststelle@mwk.bwl.de';
const DHBW_PHONE_LABEL = '+49 7621 2071 - 0';
const DHBW_PHONE_URL = 'tel:+49762120710';

const CONTENT = {
  de: {
    heroEyebrow: 'Herausgeberin',
    heroTitle: 'Duale Hochschule Baden-Württemberg Lörrach',
    heroBody:
      'Hangstraße 46-50\n79539 Lörrach',
    phoneLabel: 'Telefon',
    emailLabel: 'E-Mail',
    websiteLabel: 'Website',
    vatLabel: 'Umsatzsteuer-Identifikationsnummer',
    vatValue: 'DE287664832',
    businessIdLabel: 'Wirtschafts-Identifikationsnummer',
    businessIdValue: 'DE287664832-00001',
    legalLabel: 'Rechtsform',
    legalTitle: 'Aufsicht und Anbieter',
    legalText:
      'Die Duale Hochschule Baden-Württemberg ist eine rechtsfähige Körperschaft des öffentlichen Rechts. Sie wird gesetzlich vertreten durch die Präsidentin der Dualen Hochschule Baden-Württemberg, Frau Prof. Dr. Martina Klärle. Gesetzlicher Vertreter des Hochschulstandorts Lörrach ist der Rektor Herr Prof. Gerhard Jäger.',
    authorityLabel: 'Zuständige Aufsichtsbehörde',
    authorityTitle: 'Ministerium für Wissenschaft, Forschung und Kunst',
    authorityBody:
      'Baden-Württemberg\nKönigstraße 46\n70173 Stuttgart\nTelefon: +49 711 279 0\nTelefax: +49 711 279 3081\npoststelle@mwk.bwl.de\nhttps://www.mwk.bwl.de',
  },
  en: {
    heroEyebrow: 'Publisher',
    heroTitle: 'Duale Hochschule Baden-Württemberg Lörrach',
    heroBody:
      'Hangstraße 46-50\n79539 Lörrach\nGermany',
    phoneLabel: 'Phone',
    emailLabel: 'Email',
    websiteLabel: 'Website',
    vatLabel: 'VAT identification number',
    vatValue: 'DE287664832',
    businessIdLabel: 'Business identification number',
    businessIdValue: 'DE287664832-00001',
    legalLabel: 'Legal status',
    legalTitle: 'Supervision and provider',
    legalText:
      'The Duale Hochschule Baden-Württemberg is a legal entity under public law. It is legally represented by the President of the Duale Hochschule Baden-Württemberg, Prof. Dr. Martina Klärle. The legal representative of the Lörrach campus is Rector Prof. Gerhard Jäger.',
    authorityLabel: 'Responsible supervisory authority',
    authorityTitle: 'Ministry of Science, Research and Art',
    authorityBody:
      'Baden-Württemberg\nKönigstraße 46\n70173 Stuttgart\nGermany\nPhone: +49 711 279 0\nFax: +49 711 279 3081\npoststelle@mwk.bwl.de\nhttps://www.mwk.bwl.de',
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
  linkList: {
    gap: 12,
  },
  legalGroup: {
    gap: 14,
  },
  denseCard: {
    padding: 14,
  },
});

export default function Imprint() {
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
          <ThemedText selectable style={infoScreenStyles.bodyText}>
            {content.heroBody}
          </ThemedText>
        </View>

        <View style={styles.linkList}>
          <InfoLinkCard
            accessibilityLabel={content.phoneLabel}
            label={content.phoneLabel}
            onPress={() => {
              void Linking.openURL(DHBW_PHONE_URL);
            }}
            value={DHBW_PHONE_LABEL}
          />
          <InfoLinkCard
            accessibilityLabel={content.emailLabel}
            label={content.emailLabel}
            onPress={() => {
              void Linking.openURL(`mailto:${DHBW_EMAIL}`);
            }}
            value={DHBW_EMAIL}
          />
          <InfoLinkCard
            accessibilityLabel={content.websiteLabel}
            label={content.websiteLabel}
            onPress={() => {
              void Linking.openURL(DHBW_WEBSITE_URL);
            }}
            value={DHBW_WEBSITE_URL}
          />
        </View>

        <InfoCard style={styles.denseCard} tone="subtle">
          <ThemedText variant="label">{content.vatLabel}</ThemedText>
          <ThemedText selectable style={infoScreenStyles.bodyText}>
            {content.vatValue}
          </ThemedText>
          <ThemedText variant="label">{content.businessIdLabel}</ThemedText>
          <ThemedText selectable style={infoScreenStyles.bodyText}>
            {content.businessIdValue}
          </ThemedText>
        </InfoCard>
      </InfoCard>

      <InfoCard>
        <InfoSectionHeader
          label={content.legalLabel}
          title={content.legalTitle}
        />
        <View style={styles.legalGroup}>
          <ThemedText style={infoScreenStyles.bodyText}>
            {content.legalText}
          </ThemedText>
          <InfoCard style={styles.denseCard} tone="subtle">
            <ThemedText variant="label">{content.authorityLabel}</ThemedText>
            <ThemedText variant="bodyStrong">{content.authorityTitle}</ThemedText>
            <ThemedText selectable style={infoScreenStyles.bodyText}>
              {content.authorityBody}
            </ThemedText>
            <InfoLinkCard
              accessibilityLabel={content.websiteLabel}
              label={content.websiteLabel}
              onPress={() => {
                void Linking.openURL(MINISTRY_WEBSITE_URL);
              }}
              value={MINISTRY_WEBSITE_URL}
            />
            <InfoLinkCard
              accessibilityLabel={`${content.authorityTitle} ${content.emailLabel}`}
              label={content.emailLabel}
              onPress={() => {
                void Linking.openURL(`mailto:${MINISTRY_EMAIL}`);
              }}
              value={MINISTRY_EMAIL}
            />
          </InfoCard>
        </View>
      </InfoCard>
    </ScreenScrollView>
  );
}
