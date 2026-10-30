import { TranslationService } from 'src/app/service/translation/translation.service';
import { TranslationPipe } from 'src/app/service/translation/translation.pipe';
import { AfterViewInit, ChangeDetectorRef, Component, DestroyRef, ElementRef, Inject, OnDestroy, OnInit, PLATFORM_ID, QueryList, ViewChild, ViewChildren, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { Unit } from '../../interfaces/unit';
import { Card } from '../../interfaces/card';
import { ShinyColorsApiService } from 'src/app/service/shinycolors-api/shinycolors-api.service';
import { ShinyColorsUrlService } from 'src/app/service/shinycolors-url/shinycolors-url.service';

import { UtilitiesService } from 'src/app/service/utilities/utilities.service';
import { Cardle } from '../../interfaces/cardle';
import { isPlatformBrowser, CommonModule } from '@angular/common';

@Component({
    selector: 'app-cardle',
    imports: [
    TranslationPipe,
        NgbModalModule,
        CommonModule
    ],
    templateUrl: './cardle.component.html',
    styleUrls: ['./cardle.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    host: {
        class: 'justify-content-center ',
    }
})
export class CardleComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('cardleTitle') cardleTitle!: ElementRef<HTMLHeadingElement>;
  @ViewChild('canvasDiv') canvasDiv!: ElementRef<HTMLDivElement>;

  @ViewChild('slice1') slice1!: ElementRef<HTMLCanvasElement>;
  @ViewChild('slice2') slice2!: ElementRef<HTMLCanvasElement>;
  @ViewChild('slice3') slice3!: ElementRef<HTMLCanvasElement>;
  @ViewChild('slice4') slice4!: ElementRef<HTMLCanvasElement>;
  @ViewChild('slice5') slice5!: ElementRef<HTMLCanvasElement>;
  @ViewChild('slice6') slice6!: ElementRef<HTMLCanvasElement>;

  @ViewChildren('resultDiv') resultDiv!: QueryList<ElementRef<HTMLDivElement>>;

  @ViewChild('idolList') idolList!: ElementRef<HTMLSelectElement>;
  @ViewChild('cardList') cardList!: ElementRef<HTMLSelectElement>;

  @ViewChild('skipBtn') skipBtn!: ElementRef<HTMLButtonElement>;
  @ViewChild('guessBtn') guessBtn!: ElementRef<HTMLButtonElement>;

  @ViewChild('resultModal') resultModal!: ElementRef<NgbModal>;

  units: Unit[] = [];
  produceCards: Card[] = [];
  supportCards: Card[] = [];
  cardsLoading = true;
  ready = false;
  finished = false;
  loadError = false;
  private destroyed = false;
  private cardRequest?: Subscription;
  private cancelImageLoad?: () => void;

  cardleInfo!: Cardle;
  private cardleImage?: HTMLImageElement;

  imgUri: string | null = "";

  selectedIdol: number = 1;
  selectedCardId = '';
  currentChunk: number = 0;

  guessResults: number[] = [];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private utilitiesService: UtilitiesService,
    private scApiService: ShinyColorsApiService,
    private scUrlService: ShinyColorsUrlService,
    private modalService: NgbModal,
    private meta: TranslationService,
    private title: TranslationService,
    private changeDetector: ChangeDetectorRef,
    private destroyRef: DestroyRef,
  ) {
    this.title.setTitle('ShinyColors Cardle');
    this.meta.addTags([
      { name: 'og:type', content: 'website' },
      { name: 'og:title', content: 'ShinyColors Cardle' },
      { name: 'og:description', content: '每日卡牌猜猜樂, Daily Cardle Game from ShinyColors' },
      { name: 'og:url', content: 'https://shinycolors.moe/cardle/' },
      //{ name: 'og:image', content: 'https://shinycolors.moe/assets/images/cardle.png' },
      { name: 'theme-color', content: "#25c22a" },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'ShinyColors Cardle' },
      { name: 'twitter:description', content: '每日卡牌猜猜樂, Daily Cardle Game from ShinyColors' },
      //{ name: 'twitter:image', content: 'https://shinycolors.moe/assets/images/cardle.png' },
      { name: 'twitter:url', content: 'https://shinycolors.moe/cardle/' },
      { name: 'description', content: '每日卡牌猜猜樂, Daily Cardle Game from ShinyColors'}
    ]);
  }

  ngOnInit(): void {
    this.utilitiesService.mobileTitle.emit('ShinyColors Cardle');
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      console.log('platform is not browser');
      return;
    }
    this._getCardle();
    this._initIdolList();
    this._initCardList();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.cancelImageLoad?.();
  }

  _getCardle(): void {
    this.loadError = false;
    this.scApiService.getCardleInfo().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: data => {
        if (!data?.enzaId || data.cardleChunks?.length !== 6) {
          this.showLoadError();
          return;
        }
        this.cardleInfo = data;
        void this._initCanvas().catch(() => this.showLoadError());
      },
      error: () => this.showLoadError(),
    });
  }

  private showLoadError(): void {
    if (this.destroyed) return;
    this.ready = false;
    this.loadError = true;
    this.changeDetector.markForCheck();
  }

  getImageUrl(): string {
    if (this.cardleInfo.enzaId.startsWith('1')) {
      if (this.cardleInfo.cardleType == 0) { // P card normal
        return this.scUrlService.getCardUrl(Number(this.cardleInfo.enzaId));
      }
      else { // P card fes
        return this.scUrlService.getFesCardUrl(Number(this.cardleInfo.enzaId));
      }
    }
    else { // S card
      return this.scUrlService.getSupportCardUrl(Number(this.cardleInfo.enzaId));
    }
  }

  // Static image crops only need Canvas 2D, not six WebGL renderers/tickers.
  async _initCanvas(): Promise<void> {
    this.imgUri = this.getImageUrl();
    this.cardleImage = await this.loadCardImage(this.imgUri);
    if (this.destroyed) return;
    this.drawChunks();
    this.ready = true;
    this._restoreProgress();
    this.changeDetector.markForCheck();
  }

  loadCardImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const cleanup = () => {
        image.onload = null;
        image.onerror = null;
        this.cancelImageLoad = undefined;
      };
      this.cancelImageLoad = () => {
        cleanup();
        image.removeAttribute('src');
        reject(new Error('Cardle destroyed'));
      };
      image.onload = () => { cleanup(); resolve(image); };
      image.onerror = () => { cleanup(); reject(new Error('Cardle image failed to load')); };
      // Sharing copies text only; no cross-origin pixel readback is needed.
      image.src = url;
    });
  }

  private drawChunks(): void {
    const slices = [this.slice1, this.slice2, this.slice3, this.slice4, this.slice5, this.slice6];
    slices.forEach((slice, index) => {
      const canvas = slice.nativeElement;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas 2D unavailable');
      context.fillStyle = '#d9d9d9';
      context.fillRect(0, 0, 100, 100);
      if (index <= this.currentChunk) {
        const chunk = this.cardleInfo.cardleChunks[index];
        context.drawImage(this.cardleImage!, chunk.chunkX, chunk.chunkY, 100, 100, 0, 0, 100, 100);
      }
    });
  }

  _initIdolList(): void {
    this.scApiService.getUnitList().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(data => {
      this.units = data;
      this.changeDetector.markForCheck();
    });
  }

  changeIdol(event: Event): void {
    this.selectedIdol = Number((event.target as HTMLSelectElement).value);
    this._initCardList();
  }

  changeCard(event: Event): void {
    this.selectedCardId = (event.target as HTMLSelectElement).value;
  }

  _initCardList(): void {
    this.cardRequest?.unsubscribe();
    this.produceCards = [];
    this.supportCards = [];
    this.selectedCardId = '';
    this.cardsLoading = true;
    this.cardRequest = this.scApiService.getIdolInfo(this.selectedIdol)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe(data => {
        if (!data?.cardLists) return;
        this.produceCards = data.cardLists.filter(card => String(card.enzaId).startsWith('1'));
        this.supportCards = data.cardLists.filter(card => !String(card.enzaId).startsWith('1'));
        const firstCard = this.produceCards[0] ?? this.supportCards[0];
        this.selectedCardId = firstCard ? String(firstCard.enzaId) : '';
        this.cardsLoading = false;
        this.changeDetector.markForCheck();
      });
  }

  _restoreProgress(): void {
    try {
      const saved = JSON.parse(localStorage.getItem(this.cardleInfo.cardleDate) ?? 'null');
      const results: unknown = saved?.result;
      if (!Array.isArray(results) || results.length > 6 ||
        !results.every((result, index) => [0, 1, 2].includes(result) && (result !== 2 || index === results.length - 1))) return;
      for (const result of results) this.processSkipPress(result, false);
    } catch { /* Corrupt or unavailable storage must not prevent playing. */ }
  }

  processGuessPress(): void {
    if (!this.ready || this.finished || this.cardsLoading || !this.selectedCardId) return;
    this.processSkipPress(this.selectedCardId === String(this.cardleInfo.enzaId) ? 2 : 1);
  }

  processSkipPress(skipType: number, saveLocalstorage = true): void {
    if (!this.ready || this.finished || ![0, 1, 2].includes(skipType)) return;
    const resultBlock = this.resultDiv.get(this.currentChunk)!.nativeElement;
    resultBlock.classList.remove('guessBlock');
    resultBlock.classList.add(['skipBlock', 'wrongBlock', 'correctBlock'][skipType]);
    this.guessResults.push(skipType);

    if (saveLocalstorage) {
      try {
        localStorage.setItem(this.cardleInfo.cardleDate, JSON.stringify({ guesses: this.currentChunk, result: this.guessResults, win: skipType === 2 }));
      } catch { /* Playing is still available when browser storage is blocked. */ }
    }

    if (this.currentChunk === 5 || skipType === 2) {
      this.finished = true;
      this.changeDetector.markForCheck();
      this.open();
      return;
    }
    this.currentChunk++;
    this.drawChunks();
    this.changeDetector.markForCheck();
  }

  open(): void {
    this.modalService.open(this.resultModal);
  }

  _generateBlock(): string {
    let blocks: string = "";
    this.guessResults.forEach(i => {
      switch (i) {
        case 0:
          blocks += "🔲";
          break;
        case 1:
          blocks += "🟥";
          break;
        case 2:
          blocks += "🟩";
          break;
      }
    });
    return blocks;
  }

  shareTwitter(): void {
    const shareText = `text=Shiny%20Colors%20Cardle%20%23${this.cardleInfo.cardleIndex}%20${this.guessResults.length}/6%0a${this._generateBlock()}%0a&url=https%3A%2F%2Fshinycolors.moe%2Fcardle%0a&hashtags=シャニマス,シャイニーカラーズ`;
    window.open(`https://twitter.com/intent/tweet?${shareText}`, "_blank")
  }

  shareClipboard(): void {
    const shareText = `Shiny Colors Cardle #${this.cardleInfo.cardleIndex} ${this.guessResults.length}/6\n${this._generateBlock()}\nhttps://shinycolors.moe/cardle`;
    navigator.clipboard.writeText(shareText);
    //
  }
}

// 🟥 🟩 🔲
