import { TranslationPipe } from 'src/app/service/translation/translation.pipe';
import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-c-list',
  imports: [TranslationPipe,],
  templateUrl: './c-list.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './c-list.component.css'
})
export class CListComponent {

}
