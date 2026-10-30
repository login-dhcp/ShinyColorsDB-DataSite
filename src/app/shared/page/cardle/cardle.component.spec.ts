import { PLATFORM_ID } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbConfig, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { vi } from 'vitest';
import { CardleComponent } from './cardle.component';
import { TranslationService } from 'src/app/service/translation/translation.service';
import puzzle from './cardle.fixture.json';
import units from '../../components/charlist/menu-units.fixture.json';

const api = 'https://api.shinycolors.moe';

describe('CardleComponent', () => {
  let component: CardleComponent;
  let fixture: ComponentFixture<CardleComponent>;
  let http: HttpTestingController;
  let images: HTMLImageElement[];
  let contexts: Map<HTMLCanvasElement, {fillRect: ReturnType<typeof vi.fn>; drawImage: ReturnType<typeof vi.fn>; fillStyle: string}>;

  beforeEach(async () => {
    localStorage.clear();
    document.cookie = 'shinycolors.language=; Path=/; Max-Age=0';
    history.replaceState({}, '', '/cardle');
    images = [];
    contexts = new Map();
    vi.stubGlobal('Image', function () {
      const image = document.createElement('img');
      images.push(image);
      return image;
    });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement, type: string) {
      if (type !== '2d') throw new Error('WebGL must not be required for Cardle');
      if (!contexts.has(this)) contexts.set(this, {fillRect: vi.fn(), drawImage: vi.fn(), fillStyle: ''});
      return contexts.get(this) as unknown as CanvasRenderingContext2D;
    } as typeof HTMLCanvasElement.prototype.getContext);
    await TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), {provide: PLATFORM_ID, useValue: 'browser'}],
      imports: [CardleComponent],
    }).compileComponents();
    TestBed.inject(NgbConfig).animation = false;
    fixture = TestBed.createComponent(CardleComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    TestBed.inject(NgbModal).dismissAll();
    http.verify();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
    document.cookie = 'shinycolors.language=; Path=/; Max-Age=0';
    history.replaceState({}, '', '/');
  });

  function flushLists(): void {
    http.expectOne(`${api}/info/unitInfo`).flush(units);
    http.expectOne(`${api}/info/idolInfo?idolId=1`).flush({cardLists: [
      {enzaId: '100001', cardName: 'P card'},
      {enzaId: puzzle.enzaId, cardName: puzzle.enza.cardName},
    ]});
  }

  async function loadPuzzle(): Promise<void> {
    flushLists();
    http.expectOne(`${api}/cardle/getCardle`).flush(puzzle);
    images[0].dispatchEvent(new Event('load'));
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function skipButton(): HTMLButtonElement { return component.skipBtn.nativeElement; }
  function guessButton(): HTMLButtonElement { return component.guessBtn.nativeElement; }

  it('keeps controls disabled until the puzzle image is loaded', async () => {
    expect(skipButton().disabled).toBe(true);
    expect(guessButton().disabled).toBe(true);
    component.processGuessPress();
    component.processSkipPress(0);
    expect(component.guessResults).toEqual([]);
    flushLists();
    http.expectOne(`${api}/cardle/getCardle`).flush(puzzle);
    fixture.detectChanges();
    expect(skipButton().disabled).toBe(true);
    expect(images[0].crossOrigin).toBeNull(); // The CDN GET may omit Access-Control-Allow-Origin.
    expect(images[0].src).toBe(`${'https://cf-static.shinycolors.moe'}/images/content/support_idols/card/${puzzle.enzaId}.jpg`);
    images[0].dispatchEvent(new Event('load'));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(skipButton().disabled).toBe(false);
    expect(guessButton().disabled).toBe(false);
  });

  it('draws only the first API crop without WebGL and reveals the next after skipping', async () => {
    await loadPuzzle();
    const canvases = Array.from(contexts.values());
    expect(canvases).toHaveLength(6);
    expect(canvases[0].drawImage).toHaveBeenCalledWith(images[0], puzzle.cardleChunks[0].chunkX, puzzle.cardleChunks[0].chunkY, 100, 100, 0, 0, 100, 100);
    expect(canvases.slice(1).every(canvas => canvas.drawImage.mock.calls.length === 0)).toBe(true);
    skipButton().click();
    fixture.detectChanges();
    expect(component.guessResults).toEqual([0]);
    expect(component.currentChunk).toBe(1);
    expect(canvases[1].drawImage).toHaveBeenCalledWith(images[0], puzzle.cardleChunks[1].chunkX, puzzle.cardleChunks[1].chunkY, 100, 100, 0, 0, 100, 100);
    expect(JSON.parse(localStorage.getItem(puzzle.cardleDate)!).result).toEqual([0]);
  });

  it('handles a wrong answer, then a correct answer and prevents extra submissions', async () => {
    await loadPuzzle();
    guessButton().click();
    expect(component.guessResults).toEqual([1]);
    component.cardList.nativeElement.value = puzzle.enzaId;
    component.cardList.nativeElement.dispatchEvent(new Event('change'));
    guessButton().click();
    fixture.detectChanges();
    expect(component.guessResults).toEqual([1, 2]);
    expect(document.querySelector('.modal-body')?.textContent).toContain(puzzle.enza.cardName);
    expect(skipButton().disabled).toBe(true);
    expect(guessButton().disabled).toBe(true);
    component.processSkipPress(0);
    component.processGuessPress();
    expect(component.guessResults).toEqual([1, 2]);
  });

  it('ends after six attempts without accessing a seventh crop', async () => {
    await loadPuzzle();
    for (let i = 0; i < 7; i++) component.processSkipPress(0);
    fixture.detectChanges();
    expect(component.guessResults).toHaveLength(6);
    expect(component.finished).toBe(true);
    expect(skipButton().disabled).toBe(true);
    expect(document.querySelectorAll('.modal')).toHaveLength(1);
  });

  it('restores existing daily progress and resumes from the right crop', async () => {
    localStorage.setItem(puzzle.cardleDate, JSON.stringify({result: [0, 1]}));
    await loadPuzzle();
    expect(component.guessResults).toEqual([0, 1]);
    expect(component.currentChunk).toBe(2);
    expect(component.finished).toBe(false);
    expect([...contexts.values()][2].drawImage).toHaveBeenCalled();
    skipButton().click();
    expect(component.guessResults).toEqual([0, 1, 0]);
  });

  it('restores a completed game once and disables further guesses', async () => {
    localStorage.setItem(puzzle.cardleDate, JSON.stringify({result: [1, 2]}));
    await loadPuzzle();
    expect(component.guessResults).toEqual([1, 2]);
    expect(component.finished).toBe(true);
    expect(guessButton().disabled).toBe(true);
    expect(document.querySelectorAll('.modal')).toHaveLength(1);
  });

  it.each(['{broken', '{"result":[0,0,0,0,0,0,0]}', '{"result":[2,1]}', '{"result":[99]}'])('ignores invalid saved progress: %s', async saved => {
    localStorage.setItem(puzzle.cardleDate, saved);
    await loadPuzzle();
    expect(component.ready).toBe(true);
    expect(component.guessResults).toEqual([]);
    expect(skipButton().disabled).toBe(false);
  });

  it('continues playing when storage reads and writes are denied', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('storage denied'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('storage denied'); });
    await loadPuzzle();
    expect(() => skipButton().click()).not.toThrow();
    expect(component.guessResults).toEqual([0]);
    expect(component.currentChunk).toBe(1);
  });

  it('shows an actionable error if the image fails instead of allowing broken guesses', async () => {
    flushLists();
    http.expectOne(`${api}/cardle/getCardle`).flush(puzzle);
    images[0].dispatchEvent(new Event('error'));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('새로고침');
    expect(skipButton().disabled).toBe(true);
    expect(guessButton().disabled).toBe(true);
  });

  it('keeps API errors on Cardle with a message instead of navigating to notfound', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate');
    flushLists();
    http.expectOne(`${api}/cardle/getCardle`).flush('Unavailable', {status: 503, statusText: 'Unavailable'});
    await fixture.whenStable();
    fixture.detectChanges();
    expect(navigate).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
    expect(component.ready).toBe(false);
  });

  it('rejects incomplete puzzle data with a message', async () => {
    flushLists();
    http.expectOne(`${api}/cardle/getCardle`).flush({...puzzle, cardleChunks: []});
    fixture.detectChanges();
    expect(component.loadError).toBe(true);
    expect(images).toHaveLength(0);
  });

  it('cancels stale card requests when the selected idol changes quickly', async () => {
    await loadPuzzle();
    const selection = component.idolList.nativeElement;
    selection.value = '2';
    selection.dispatchEvent(new Event('change'));
    const oldRequest = http.expectOne(`${api}/info/idolInfo?idolId=2`);
    expect(component.cardsLoading).toBe(true);
    selection.value = '3';
    selection.dispatchEvent(new Event('change'));
    expect(oldRequest.cancelled).toBe(true);
    http.expectOne(`${api}/info/idolInfo?idolId=3`).flush({cardLists: [{enzaId: '100003', cardName: 'New idol card'}]});
    fixture.detectChanges();
    expect(component.cardList.nativeElement.textContent).toContain('New idol card');
    expect(component.cardList.nativeElement.textContent).not.toContain('P card');
    expect(component.cardsLoading).toBe(false);
  });

  it('updates idol names and card group labels when language changes', async () => {
    await loadPuzzle();
    expect(component.idolList.nativeElement.textContent).toContain('사쿠라기 마노');
    TestBed.inject(TranslationService).setLanguage('EN');
    fixture.detectChanges();
    expect(component.idolList.nativeElement.textContent).toContain('Mano Sakuragi');
    expect(component.cardList.nativeElement.querySelector('optgroup')?.label).toBe('Produce');
    expect(component.cardList.nativeElement.options[1].value).toBe(puzzle.enzaId);
  });

  it('cancels a pending image load when leaving the page', async () => {
    flushLists();
    http.expectOne(`${api}/cardle/getCardle`).flush(puzzle);
    fixture.destroy();
    await Promise.resolve();
    expect(images[0].getAttribute('src')).toBeNull();
    expect(images[0].onload).toBeNull();
    expect(component.ready).toBe(false);
  });
});

describe('CardleComponent server rendering', () => {
  it('does not request puzzle data, images, or a renderer on the server', () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting(), {provide: PLATFORM_ID, useValue: 'server'}],
      imports: [CardleComponent],
    });
    const fixture = TestBed.createComponent(CardleComponent);
    expect(() => fixture.detectChanges()).not.toThrow();
    expect(fixture.componentInstance.ready).toBe(false);
    TestBed.inject(HttpTestingController).expectNone(`${api}/cardle/getCardle`);
    fixture.destroy();
  });
});
