import { translations } from './i18n';

describe('translations', () => {
  const deKeys = Object.keys(translations.de).sort();
  const enKeys = Object.keys(translations.en).sort();

  it('defines the same keys in German and English', () => {
    expect(deKeys).toEqual(enKeys);
  });
});
