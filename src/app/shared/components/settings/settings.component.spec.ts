import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsComponent } from './settings.component';
import { NgbConfig, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslationService } from 'src/app/service/translation/translation.service';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;

  beforeEach(async () => {
    localStorage.removeItem('shinycolors.language');
    document.cookie = 'shinycolors.language=; Path=/; Max-Age=0';
    history.replaceState({}, '', '/');
    await TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
      imports: [ SettingsComponent ]
    })
    .compileComponents();

    TestBed.inject(NgbConfig).animation = false;
    TestBed.inject(TranslationService).setLanguage('en-US');
    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => {
    TestBed.inject(NgbModal).dismissAll();
    localStorage.removeItem('shinycolors.language');
    document.cookie = 'shinycolors.language=; Path=/; Max-Age=0';
    history.replaceState({}, '', '/');
  });

  function openSettings() {
    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();
    TestBed.tick();
    return document.querySelector<HTMLSelectElement>('#languageSelection')!;
  }

  it('offers Korean and applies it to the existing page only after confirmation', () => {
    const selection = openSettings();
    expect(Array.from(selection.options, option => option.textContent)).toEqual(['KR', 'EN', 'JP', 'CN']);
    expect(selection.querySelector('option[value="ko-KR"]')?.textContent).toBe('KR');
    selection.value = 'ko-KR';
    selection.dispatchEvent(new Event('change'));
    expect(TestBed.inject(TranslationService).language()).toBe('en-US');
    document.querySelector<HTMLButtonElement>('.modal-footer .btn-primary')!.click();
    TestBed.tick();
    fixture.detectChanges();
    expect(TestBed.inject(TranslationService).language()).toBe('ko-KR');
    expect(fixture.nativeElement.textContent).toContain('설정');
    expect(openSettings().value).toBe('ko-KR');
  });

  it('discards a cancelled choice when settings are opened again', () => {
    const selection = openSettings();
    selection.value = 'ko-KR';
    selection.dispatchEvent(new Event('change'));
    document.querySelector<HTMLButtonElement>('.modal-footer .btn-secondary')!.click();
    TestBed.tick();
    expect(TestBed.inject(TranslationService).language()).toBe('en-US');
    expect(openSettings().value).toBe('en-US');
  });
});
