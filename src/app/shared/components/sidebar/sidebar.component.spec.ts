import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidebarComponent } from './sidebar.component';
import { TranslationService } from 'src/app/service/translation/translation.service';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(async () => {
    localStorage.removeItem('shinycolors.language');
    document.cookie = 'shinycolors.language=; Path=/; Max-Age=0';
    history.replaceState({}, '', '/idolinfo?idolid=1#profile');
    await TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
      imports: [ SidebarComponent ]
    })
    .compileComponents();

    TestBed.inject(TranslationService).setLanguage('zh-JP');
    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => {
    localStorage.removeItem('shinycolors.language');
    document.cookie = 'shinycolors.language=; Path=/; Max-Age=0';
    history.replaceState({}, '', '/');
  });

  it('changes and saves the language immediately from the visible header dropdown', () => {
    const selection = fixture.nativeElement.querySelector('#headerLanguageSelection') as HTMLSelectElement;
    expect(selection.value).toBe('zh-JP');
    expect(selection.querySelector('option[value="ko-KR"]')?.textContent).toBe('한국어');
    selection.value = 'ko-KR';
    selection.dispatchEvent(new Event('change'));
    TestBed.tick();
    fixture.detectChanges();
    expect(TestBed.inject(TranslationService).language()).toBe('ko-KR');
    expect(selection.value).toBe('ko-KR');
    expect(selection.getAttribute('aria-label')).toBe('언어 선택');
    expect(localStorage.getItem('shinycolors.language')).toBe('ko-KR');
    expect(document.cookie).toContain('shinycolors.language=ko-KR');
    expect(new URL(document.URL).searchParams.get('idolid')).toBe('1');
    expect(new URL(document.URL).searchParams.get('lang')).toBe('ko-KR');
    expect(location.hash).toBe('#profile');
    expect(document.querySelector('.modal')).toBeNull();
  });

  it('keeps the selected option in sync with a language changed elsewhere', () => {
    TestBed.inject(TranslationService).setLanguage('ko-KR');
    fixture.detectChanges();
    const selection = fixture.nativeElement.querySelector('#headerLanguageSelection') as HTMLSelectElement;
    expect(selection.value).toBe('ko-KR');
    TestBed.inject(TranslationService).setLanguage('ja-JP');
    fixture.detectChanges();
    expect(selection.value).toBe('ja-JP');
  });
});
