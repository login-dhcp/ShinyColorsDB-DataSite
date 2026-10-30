import { TranslationPipe } from 'src/app/service/translation/translation.pipe';
import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-l-list',
  imports: [TranslationPipe,],
  templateUrl: './l-list.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './l-list.component.css'
})
export class LListComponent {

}
