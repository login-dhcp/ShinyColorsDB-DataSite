import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidebarComponent } from './sidebar.component';
import { TranslationService } from 'src/app/service/translation/translation.service';
import { UtilitiesService } from 'src/app/service/utilities/utilities.service';
import { NgbConfig, NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import menuUnits from '../charlist/menu-units.fixture.json';

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

    TestBed.inject(NgbConfig).animation = false;
    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows only KR, EN, JP, CN in that order and defaults to KR', () => {
    const selection = fixture.nativeElement.querySelector('#headerLanguageSelection') as HTMLSelectElement;
    expect(Array.from(selection.options, option => option.textContent)).toEqual(['KR', 'EN', 'JP', 'CN']);
    expect(selection.value).toBe('ko-KR');
  });

  afterEach(() => {
    TestBed.inject(NgbOffcanvas).dismiss();
    TestBed.inject(HttpTestingController).verify();
    localStorage.removeItem('shinycolors.language');
    document.cookie = 'shinycolors.language=; Path=/; Max-Age=0';
    history.replaceState({}, '', '/');
  });

  it('changes and saves the language immediately from the visible header dropdown', () => {
    const selection = fixture.nativeElement.querySelector('#headerLanguageSelection') as HTMLSelectElement;
    expect(selection.value).toBe('ko-KR');
    expect(selection.querySelector('option[value="ko-KR"]')?.textContent).toBe('KR');
    TestBed.inject(UtilitiesService).mobileTitle.emit('卡片情報');
    selection.value = 'en-US';
    selection.dispatchEvent(new Event('change'));
    TestBed.tick();
    fixture.detectChanges();
    expect(TestBed.inject(TranslationService).language()).toBe('en-US');
    expect(selection.value).toBe('en-US');
    // Selected attributes must also survive server HTML serialization.
    expect(selection.querySelector('option[selected]')?.getAttribute('value')).toBe('en-US');
    expect(selection.querySelectorAll('option[selected]').length).toBe(1);
    expect(selection.getAttribute('aria-label')).toBe('Language');
    expect(fixture.nativeElement.querySelector('h2').textContent).toContain('Card Information');
    expect(localStorage.getItem('shinycolors.language')).toBe('en-US');
    expect(document.cookie).toContain('shinycolors.language=en-US');
    expect(new URL(document.URL).searchParams.get('idolid')).toBe('1');
    expect(new URL(document.URL).searchParams.get('lang')).toBe('en-US');
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

  it('translates the opened right menu including all current units and idols without changing navigation IDs', () => {
    const translation = TestBed.inject(TranslationService);
    translation.setLanguage('ko-KR');
    TestBed.inject(UtilitiesService).storedIds = [1, 1];
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button[aria-label="메뉴 열기"]').click();
    TestBed.inject(HttpTestingController).expectOne('https://api.shinycolors.moe/info/unitInfo').flush(menuUnits);
    TestBed.tick();
    const panel = document.querySelector('ngb-offcanvas-panel') as HTMLElement;
    expect(panel).toBeTruthy();
    for (const label of ['샤이니컬러즈 DB', '홈', '출시 이력', '카드 맞히기', '스킬 검색', '스파인 뷰어', '설정']) {
      expect(panel.textContent).toContain(label);
    }
    expect(panel.querySelector('a[href^="mailto:"]')?.getAttribute('aria-label')).toBe('이메일');
    const groups = panel.querySelectorAll<HTMLButtonElement>('.accordion-button');
    expect(groups.length).toBe(menuUnits.length);
    let checkedIdols = 0;
    menuUnits.forEach((unit, index) => {
      expect(groups[index].textContent).toMatch(/[가-힣]/u);
      expect(groups[index].textContent).not.toMatch(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u);
      if (groups[index].getAttribute('aria-expanded') !== 'true') groups[index].click();
      TestBed.tick();
      for (const idol of unit.idols) {
        const link = panel.querySelector<HTMLAnchorElement>(`a[href="/idolinfo?idolid=${idol.idolId}"]`);
        expect(link, idol.idolName).toBeTruthy();
        expect(link!.textContent).toMatch(/[가-힣]/u);
        expect(link!.textContent).not.toMatch(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u);
        checkedIdols++;
      }
    });
    expect(checkedIdols).toBe(33);
    expect(panel.querySelector('a[href="/idolinfo?idolid=1"]')?.textContent).toContain('사쿠라기 마노');
    expect(panel.querySelector('img[alt="유닛 아이콘: 일루미네이션 스타즈"]')).toBeTruthy();
    translation.setLanguage('en-US');
    TestBed.tick();
    expect(groups[0].textContent).toContain('illumination STARS');
    expect(panel.querySelector('a[href="/idolinfo?idolid=1"]')?.textContent).toContain('Mano Sakuragi');
    for (const label of ['Home', 'Release History', 'Cardle', 'Skill Search', 'Spine Viewer', 'Settings']) {
      expect(panel.textContent).toContain(label);
    }
    expect(panel.textContent).not.toMatch(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u);
    expect(menuUnits[0].idols[0].idolName).toBe('櫻木真乃');
  });
});
