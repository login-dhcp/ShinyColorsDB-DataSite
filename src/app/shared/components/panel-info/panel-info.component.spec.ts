import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';

import { PanelInfoComponent } from './panel-info.component';

describe('PanelInfoComponent', () => {
  let component: PanelInfoComponent;
  let fixture: ComponentFixture<PanelInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
      imports: [ PanelInfoComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PanelInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // TODO: needs @Input fixture data (or pixi renderer mock); skipped since the Karma->Vitest migration.
  it.skip('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('PanelInfoComponent server rendering', () => {
  it('does not initialize a Pixi renderer or register browser assets', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
      imports: [PanelInfoComponent],
    });
    const fixture = TestBed.createComponent(PanelInfoComponent);
    fixture.componentRef.setInput('panelInfo', [{ panelIcon: 1 }]);
    expect(() => fixture.detectChanges()).not.toThrow();
    expect(fixture.componentInstance.app).toBeUndefined();
    expect(fixture.componentInstance.loadedIcon.size).toBe(0);
  });
});
