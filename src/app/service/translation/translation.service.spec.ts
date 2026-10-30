import { DOCUMENT } from '@angular/common';
import { PLATFORM_ID, REQUEST, TransferState } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { LANGUAGE_STATE, TranslationService } from './translation.service';

describe('TranslationService', () => {
  beforeEach(() => {
    localStorage.removeItem('shinycolors.language');
    document.cookie = 'shinycolors.language=; Path=/; Max-Age=0';
    history.replaceState({}, '', '/');
  });

  afterEach(() => {
    localStorage.removeItem('shinycolors.language');
    document.cookie = 'shinycolors.language=; Path=/; Max-Age=0';
    history.replaceState({}, '', '/');
  });

  function server(url: string, headers: Record<string, string> = {}) {
    TestBed.configureTestingModule({ providers: [
      { provide: PLATFORM_ID, useValue: 'server' },
      { provide: REQUEST, useValue: new Request(url, { headers }) },
    ] });
    return TestBed.inject(TranslationService);
  }

  it('renders Korean on the server from a shareable URL while preserving game text', () => {
    const service = server('http://localhost/pcardinfo?uuid=original-card&lang=ko');
    expect(service.language()).toBe('ko-KR');
    expect(service.translate('實裝日')).toBe('출시일');
    expect(service.translate('【原文のカード】櫻木真乃')).toBe('【原文のカード】櫻木真乃');
    expect(service.translate(42)).toBe('42');
    expect(service.translate('constructor')).toBe('constructor');
    expect(TestBed.inject(TransferState).get(LANGUAGE_STATE, 'zh-JP')).toBe('ko-KR');
  });

  it('honors an explicit language before a saved cookie or browser preference', () => {
    const service = server('http://localhost/?lang=zh-JP', {
      cookie: 'shinycolors.language=ko-KR', 'accept-language': 'ko-KR',
    });
    expect(service.language()).toBe('zh-JP');
    expect(service.translate('首頁')).toBe('首頁');
  });

  it('restores saved server preferences and respects Accept-Language quality', () => {
    const service = server('http://localhost/', { cookie: 'shinycolors.language=ko-KR', 'accept-language': 'ja-JP' });
    expect(service.language()).toBe('ko-KR');
  });

  it('selects the highest supported nonzero Accept-Language preference', () => {
    const service = server('http://localhost/', { 'accept-language': 'ja-JP;q=0, en-US;q=0.3, ko-KR;q=0.9' });
    expect(service.language()).toBe('ko-KR');
  });

  it('does not access browser-only document properties for a server request without cookies', () => {
    const serverDocument = { documentElement: { lang: '' }, title: '', getElementById: () => null };
    for (const key of ['cookie', 'location', 'defaultView']) {
      Object.defineProperty(serverDocument, key, { get() { throw new Error('Browser-only property'); } });
    }
    TestBed.configureTestingModule({ providers: [{ provide: DOCUMENT, useValue: serverDocument }] });
    const service = server('http://localhost/', { 'accept-language': 'ko-KR' });
    expect(service.language()).toBe('ko-KR');
  });

  it('ignores invalid locale values without exposing object prototype properties', () => {
    const service = server('http://localhost/?lang=constructor', { 'accept-language': 'ko-KR' });
    expect(service.language()).toBe('ko-KR');
    expect(() => service.setLanguage('__proto__')).not.toThrow();
    expect(service.language()).toBe('ko-KR');
  });

  it('translates menu names and icon descriptions with an original-text fallback for unknown names', () => {
    const service = server('http://localhost/?lang=ko-KR');
    expect(service.translate('アンティーカ')).toBe('안티카');
    expect(service.translate("L'Antica")).toBe('안티카');
    expect(service.translate('Icon of idol 櫻木真乃')).toBe('아이돌 아이콘 사쿠라기 마노');
    expect(service.translate('Icon of unit illumination STARS')).toBe('유닛 아이콘: 일루미네이션 스타즈');
    expect(service.translate('未知の新ユニット')).toBe('未知の新ユニット');
    expect(service.translate('Picture of 【原文のカード】櫻木真乃')).toBe('카드 이미지: 【原文のカード】櫻木真乃');
  });

  it('uses the server-transferred language during hydration instead of differing local storage', () => {
    localStorage.setItem('shinycolors.language', 'ja-JP');
    TestBed.configureTestingModule({});
    TestBed.inject(TransferState).set(LANGUAGE_STATE, 'ko-KR');
    expect(TestBed.inject(TranslationService).language()).toBe('ko-KR');
  });

  it('persists a selection and preserves route IDs and fragments in the URL', () => {
    history.replaceState({}, '', '/pcardinfo?uuid=original-card#skills');
    TestBed.configureTestingModule({});
    const service = TestBed.inject(TranslationService);
    service.setLanguage('ko-KR');
    TestBed.tick();
    expect(localStorage.getItem('shinycolors.language')).toBe('ko-KR');
    expect(document.cookie).toContain('shinycolors.language=ko-KR');
    expect(new URL(document.URL).searchParams.get('uuid')).toBe('original-card');
    expect(new URL(document.URL).searchParams.get('lang')).toBe('ko-KR');
    expect(location.hash).toBe('#skills');
    expect(TestBed.inject(DOCUMENT).documentElement.lang).toBe('ko-KR');
  });

  it('still changes language when local storage is blocked', () => {
    TestBed.configureTestingModule({});
    const service = TestBed.inject(TranslationService);
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new DOMException('Storage blocked', 'SecurityError'); };
    try {
      expect(() => service.setLanguage('ko-KR')).not.toThrow();
      expect(service.translate('設定')).toBe('설정');
    } finally { Storage.prototype.setItem = original; }
  });

  it('updates the page title and metadata when switching languages without reloading', () => {
    TestBed.configureTestingModule({});
    const service = TestBed.inject(TranslationService);
    service.setLanguage('zh-JP');
    service.setTitle(' ~ 出卡時間表 ~ ');
    service.updateTag({ name: 'description', content: '卡名: 原文\n 稀有度: P_SSR' });
    TestBed.tick();
    expect(TestBed.inject(Title).getTitle()).toBe('~ 出卡時間表 ~');
    service.setLanguage('ko-KR');
    TestBed.tick();
    expect(TestBed.inject(Title).getTitle()).toBe('카드 출시표');
    expect(TestBed.inject(Meta).getTag('name="description"')?.content).toBe('카드명: 原文\n 레어도: P_SSR');
    service.setLanguage('zh-JP');
    TestBed.tick();
    expect(TestBed.inject(Title).getTitle()).toBe('~ 出卡時間表 ~');
  });
});
