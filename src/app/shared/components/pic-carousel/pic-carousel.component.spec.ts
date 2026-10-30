import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';

import { PicCarouselComponent } from './pic-carousel.component';

describe('PicCarouselComponent', () => {
  let component: PicCarouselComponent;
  let fixture: ComponentFixture<PicCarouselComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
      imports: [ PicCarouselComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PicCarouselComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('PicCarouselComponent server rendering', () => {
  it('does not start browser playback or a recurring timer', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
      imports: [PicCarouselComponent],
    });
    const fixture = TestBed.createComponent(PicCarouselComponent);
    expect(() => fixture.detectChanges()).not.toThrow();
    fixture.componentInstance.playThrough();
    expect(fixture.componentInstance.timeOutToClear).toBeNull();
  });
});
