import { CATALOGS, DEFAULT_LANGUAGE, LANGUAGE_OPTIONS, normalizeLanguage } from './language-catalogs';

describe('Language catalogs', () => {
  it('exposes exactly KR, EN, JP, CN with Korean first and as the default', () => {
    expect(LANGUAGE_OPTIONS.map(option => option.label)).toEqual(['KR', 'EN', 'JP', 'CN']);
    expect(LANGUAGE_OPTIONS.map(option => option.code)).toEqual(['ko-KR', 'en-US', 'ja-JP', 'zh-CN']);
    expect(DEFAULT_LANGUAGE).toBe('ko-KR');
  });

  it('covers every current UI and menu key in all four catalogs', () => {
    const keys = Object.keys(CATALOGS['ko-KR']).sort();
    for (const { code } of LANGUAGE_OPTIONS) {
      expect(Object.keys(CATALOGS[code]).sort(), code).toEqual(keys);
      for (const key of keys) expect(CATALOGS[code][key]?.trim(), `${code}: ${key}`).toBeTruthy();
    }
  });

  it('has no untranslated CJK UI strings in the English catalog', () => {
    for (const [key, value] of Object.entries(CATALOGS['en-US'])) {
      expect(value, key).not.toMatch(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u);
    }
  });

  it('normalizes display codes and migrates removed choices to supported languages', () => {
    expect(['KR', 'EN', 'JP', 'CN'].map(normalizeLanguage)).toEqual(['ko-KR', 'en-US', 'ja-JP', 'zh-CN']);
    expect(normalizeLanguage('zh-JP')).toBe('ko-KR');
    expect(normalizeLanguage('zh-TW')).toBe('zh-CN');
    expect(normalizeLanguage('__proto__')).toBeUndefined();
  });
});
