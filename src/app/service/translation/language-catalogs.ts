import source from 'src/locale/messages.json';
import english from 'src/locale/en.json';
import japanese from 'src/locale/ja.json';
import simplified from 'src/locale/cn.json';
import traditional from 'src/locale/tw.json';
import korean from 'src/locale/ko.json';

export type Language = 'zh-JP' | 'zh-TW' | 'zh-CN' | 'ja-JP' | 'en-US' | 'ko-KR';
export const LANGUAGE_OPTIONS: ReadonlyArray<{ code: Language; label: string }> = [
  { code: 'zh-JP', label: '混合模式' },
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'zh-CN', label: '简体中文' },
  { code: 'ja-JP', label: '日本語' },
  { code: 'en-US', label: 'English' },
  { code: 'ko-KR', label: '한국어' },
];

function legacyCatalog(catalog: { translations: Record<string, string> }): Record<string, string> {
  return Object.fromEntries(Object.entries(source.translations).flatMap(([id, text]) =>
    catalog.translations[id] ? [[text, catalog.translations[id]]] : []));
}

export const CATALOGS: Record<Language, Readonly<Record<string, string>>> = {
  'zh-JP': {},
  'zh-TW': legacyCatalog(traditional),
  'zh-CN': legacyCatalog(simplified),
  'ja-JP': legacyCatalog(japanese),
  'en-US': legacyCatalog(english),
  'ko-KR': korean.translations,
};

export function normalizeLanguage(value: string | null | undefined): Language | undefined {
  const normalized = value?.toLowerCase();
  const aliases: Record<string, Language> = {
    'zh-ja': 'zh-JP', 'zh-jp': 'zh-JP', 'zh-tw': 'zh-TW', 'zh-hant': 'zh-TW',
    'zh-cn': 'zh-CN', 'zh-hans': 'zh-CN', zh: 'zh-TW',
    'jp-ja': 'ja-JP', ja: 'ja-JP', 'ja-jp': 'ja-JP',
    en: 'en-US', 'en-us': 'en-US', ko: 'ko-KR', 'ko-kr': 'ko-KR',
  };
  return normalized && Object.hasOwn(aliases, normalized) ? aliases[normalized] : undefined;
}
