import { TranslationPipe } from 'src/app/service/translation/translation.pipe';
import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-c-info',
  imports: [TranslationPipe,],
  templateUrl: './c-info.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './c-info.component.css'
})
export class CInfoComponent {

}
