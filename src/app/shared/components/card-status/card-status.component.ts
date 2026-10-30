import { TranslationPipe } from 'src/app/service/translation/translation.pipe';
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CardStatus } from '../../interfaces/cardStatus';

@Component({
  selector: 'app-card-status',
  imports: [
    TranslationPipe,],
  templateUrl: './card-status.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './card-status.component.css'
})
export class CardStatusComponent {

  @Input()
  cardStatus!: CardStatus;

  constructor() { }
}
