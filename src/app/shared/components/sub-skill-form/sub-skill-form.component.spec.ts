import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubSkillFormComponent } from './sub-skill-form.component';
import { TranslationService } from 'src/app/service/translation/translation.service';

describe('SubSkillFormComponent', () => {
  let component: SubSkillFormComponent;
  let fixture: ComponentFixture<SubSkillFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
      imports: [ SubSkillFormComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubSkillFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('translates option labels while preserving the Japanese API query values', () => {
    fixture.componentRef.setInput('skillList', [{ supSkillIndex: 1, supSkillName: '原文スキル', hasSubOption: true }]);
    fixture.detectChanges();
    const selects = fixture.nativeElement.querySelectorAll('select') as NodeListOf<HTMLSelectElement>;
    selects[0].value = '原文スキル';
    component.subOption();
    selects[1].value = '体力';
    component.updateQueryStr();
    const originalQuery = [...component.queryStr];
    TestBed.inject(TranslationService).setLanguage('ko-KR');
    fixture.detectChanges();
    expect(selects[1].querySelector('option[value="体力"]')?.textContent).toBe('체력 회복');
    expect(selects[1].value).toBe('体力');
    expect(component.queryStr).toEqual(originalQuery);
    expect(component.queryStr[0]).toBe('原文スキル体力');
  });
});
