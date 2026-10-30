import english from 'src/locale/en.json';
import japanese from 'src/locale/ja.json';
import simplified from 'src/locale/cn.json';
import korean from 'src/locale/ko.json';

export type Language = 'ko-KR' | 'en-US' | 'ja-JP' | 'zh-CN';
export const DEFAULT_LANGUAGE: Language = 'ko-KR';
export const LANGUAGE_OPTIONS: ReadonlyArray<{ code: Language; label: string }> = [
  { code: 'ko-KR', label: 'KR' },
  { code: 'en-US', label: 'EN' },
  { code: 'ja-JP', label: 'JP' },
  { code: 'zh-CN', label: 'CN' },
];

export const CATALOGS: Record<Language, Readonly<Record<string, string>>> = {
  'ko-KR': korean.translations,
  'en-US': english.translations,
  'ja-JP': japanese.translations,
  'zh-CN': simplified.translations,
};

export function normalizeLanguage(value: string | null | undefined): Language | undefined {
  const normalized = value?.toLowerCase();
  const aliases: Record<string, Language> = {
    // Migrate removed mixed/traditional choices to one of the supported options.
    'zh-ja': DEFAULT_LANGUAGE, 'zh-jp': DEFAULT_LANGUAGE,
    'zh-tw': 'zh-CN', 'zh-hant': 'zh-CN',
    cn: 'zh-CN', 'zh-cn': 'zh-CN', 'zh-hans': 'zh-CN', zh: 'zh-CN',
    jp: 'ja-JP', 'jp-ja': 'ja-JP', ja: 'ja-JP', 'ja-jp': 'ja-JP',
    en: 'en-US', 'en-us': 'en-US', kr: 'ko-KR', ko: 'ko-KR', 'ko-kr': 'ko-KR',
  };
  return normalized && Object.hasOwn(aliases, normalized) ? aliases[normalized] : undefined;
}
