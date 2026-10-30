import { TranslationPipe } from 'src/app/service/translation/translation.pipe';
import { Component, OnInit, TemplateRef, ChangeDetectionStrategy } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslationService } from 'src/app/service/translation/translation.service';
import { DEFAULT_LANGUAGE, Language, normalizeLanguage } from 'src/app/service/translation/language-catalogs';

@Component({
  imports: [TranslationPipe],
  selector: 'app-settings',
  standalone: true,
  templateUrl: './settings.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  pendingLanguage: Language = DEFAULT_LANGUAGE;

  constructor(private modalService: NgbModal, public translation: TranslationService) { }

  ngOnInit(): void { }

  open(content: TemplateRef<any>) {
    this.pendingLanguage = this.translation.language();
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.catch(() => undefined);
  }

  changeLanguage(event: Event): void {
    const language = normalizeLanguage((event.target as HTMLSelectElement).value);
    if (language) this.pendingLanguage = language;
  }

  applyLanguage(modal: { close: (result?: string) => void }): void {
    this.translation.setLanguage(this.pendingLanguage);
    modal.close('saved');
  }
}
