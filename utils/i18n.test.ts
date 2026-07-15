import { translations } from './i18n';

describe('translations', () => {
  const deKeys = Object.keys(translations.de).sort();
  const enKeys = Object.keys(translations.en).sort();

  it('defines the same keys in German and English', () => {
    expect(deKeys).toEqual(enKeys);
  });

  it('has no English key missing from German', () => {
    const missingInDe = enKeys.filter((key) => !deKeys.includes(key));
    expect(missingInDe).toEqual([]);
  });

  it('has no German key missing from English', () => {
    const missingInEn = deKeys.filter((key) => !enKeys.includes(key));
    expect(missingInEn).toEqual([]);
  });

  it('has no empty translation values', () => {
    const empty = (['de', 'en'] as const).flatMap((language) =>
      Object.entries(translations[language])
        .filter(([, value]) => value.trim().length === 0)
        .map(([key]) => `${language}:${key}`)
    );
    expect(empty).toEqual([]);
  });
});
