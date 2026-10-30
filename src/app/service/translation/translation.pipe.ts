import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslationService } from './translation.service';

@Pipe({ name: 'translate', standalone: true, pure: false })
export class TranslationPipe implements PipeTransform {
  private readonly translation = inject(TranslationService);

  transform(value: unknown): string {
    return this.translation.translate(value);
  }
}
