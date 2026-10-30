import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { effect, inject, Injectable, makeStateKey, PLATFORM_ID, REQUEST, signal, TransferState } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { CATALOGS, DEFAULT_LANGUAGE, Language, LANGUAGE_OPTIONS, normalizeLanguage } from './language-catalogs';

const preferenceKey = 'shinycolors.language';
export const LANGUAGE_STATE = makeStateKey<Language>('shinycolors-language');
type MetaTag = { name: string; content: string };

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private readonly document = inject(DOCUMENT);
  private readonly transferState = inject(TransferState);
  private readonly request = inject(REQUEST, { optional: true });
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly selectedLanguage = signal<Language>(this.resolveLanguage());
  readonly language = this.selectedLanguage.asReadonly();
  readonly options = LANGUAGE_OPTIONS;
  private readonly pageTitle = signal('ShinyColorsDB-DataSite');
  private readonly pageMetadata = signal<Record<string, MetaTag>>({});

  constructor() {
    if (!this.browser) this.transferState.set(LANGUAGE_STATE, this.language());
    effect(() => {
      const language = this.language();
      this.document.documentElement.lang = language;
      this.title.setTitle(this.translate(this.pageTitle()));
      for (const tag of Object.values(this.pageMetadata())) {
        this.meta.updateTag({ ...tag, content: this.translate(tag.content) });
      }
    });
  }

  private resolveLanguage(): Language {
    if (this.browser && this.transferState.hasKey(LANGUAGE_STATE)) {
      const language = normalizeLanguage(this.transferState.get(LANGUAGE_STATE, DEFAULT_LANGUAGE)) ?? DEFAULT_LANGUAGE;
      this.transferState.remove(LANGUAGE_STATE);
      return language;
    }
    const request = this.request;
    const url = new URL(request?.url ?? (this.browser ? this.document.location.href : '/'), 'http://localhost');
    const explicit = normalizeLanguage(url.searchParams.get('lang'));
    if (explicit) return explicit;
    const cookies = request?.headers.get('cookie') ?? (this.browser ? this.document.cookie : '') ?? '';
    const storedCookie = cookies.split(';').map(entry => entry.trim()).find(entry => entry.startsWith(`${preferenceKey}=`));
    const cookie = normalizeLanguage(storedCookie?.slice(preferenceKey.length + 1));
    if (cookie) return cookie;
    if (this.browser) {
      try {
        const saved = normalizeLanguage(this.document.defaultView?.localStorage.getItem(preferenceKey));
        if (saved) return saved;
      } catch { /* Storage can be unavailable in privacy modes. */ }
    }
    return DEFAULT_LANGUAGE;
  }

  setLanguage(value: string): void {
    const language = normalizeLanguage(value);
    if (!language) return;
    this.selectedLanguage.set(language);
    if (!this.browser) return;
    try { this.document.defaultView?.localStorage.setItem(preferenceKey, language); } catch { /* Optional persistence. */ }
    try {
      this.document.cookie = `${preferenceKey}=${language}; Path=/; Max-Age=31536000; SameSite=Lax${this.document.location.protocol === 'https:' ? '; Secure' : ''}`;
    } catch { /* The URL still retains the selected language. */ }
    const url = new URL(this.document.location.href);
    url.searchParams.set('lang', language);
    this.document.defaultView?.history.replaceState(this.document.defaultView.history.state, '', url);
  }

  translate(value: unknown): string {
    if (value === null || value === undefined) return '';
    const text = String(value);
    const dictionary = CATALOGS[this.language()];
    const lookup = (key: string): string | undefined => Object.hasOwn(dictionary, key) ? dictionary[key] : undefined;
    const direct = lookup(text) ?? lookup(text.trim());
    if (direct !== undefined) return direct;
    for (const prefix of ['Picture of', 'Image of', 'General image of', 'Illust image of', 'Fes image of', 'Icon of unit', 'Icon of idol', 'Icon of idea mark', 'Icon of hirameki', 'Icon of proficiency']) {
      if (text.startsWith(`${prefix} `) && lookup(prefix)) {
        const suffix = text.slice(prefix.length).trimStart();
        return `${lookup(prefix)} ${lookup(suffix) ?? suffix}`;
      }
    }
    return text.split('\n').map(line => line.replace(/^(\s*)([^:：]+)([:：])(.*)$/, (match, space, label: string, colon, rest) =>
      lookup(label) ? `${space}${lookup(label)}${colon}${rest}` : match)).join('\n');
  }

  setTitle(source: string): void { this.pageTitle.set(source); }

  addTags(tags: MetaTag[]): void {
    this.pageMetadata.update(current => ({ ...current, ...Object.fromEntries(tags.map(tag => [tag.name, tag])) }));
  }

  updateTag(tag: MetaTag): void { this.addTags([tag]); }
}
