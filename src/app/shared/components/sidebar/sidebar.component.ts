import { TranslationPipe } from 'src/app/service/translation/translation.pipe';

import { Component, inject, Input, OnInit, TemplateRef, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgbAccordionModule, NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { UtilitiesService } from 'src/app/service/utilities/utilities.service';
import { CharlistComponent } from '../charlist/charlist.component';
import { SettingsComponent } from '../settings/settings.component';
import { TranslationService } from 'src/app/service/translation/translation.service';

@Component({
  selector: 'app-sidebar',
  imports: [
    TranslationPipe,
    RouterModule,
    NgbAccordionModule,
    CharlistComponent,
    SettingsComponent
],
  templateUrl: './sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  @Input()
  showSideBar = false;

  @Input()
  isBigScreen = false;

  @Input()
  charaListId!: string;

  title!: string;

  private offcanvasService = inject(NgbOffcanvas);
  readonly translation = inject(TranslationService);

  constructor(private utilsService: UtilitiesService) { }

  ngOnInit(): void {
    this.utilsService.mobileTitle.subscribe((title) => {
      this.title = title;
    });
  }

  onSideBarClick() {
    this.showSideBar = !this.showSideBar;
  }

  changeLanguage(event: Event): void {
    this.translation.setLanguage((event.target as HTMLSelectElement).value);
  }

  onCharlistClick(event: boolean) {
    this.offcanvasService.dismiss();
  }

  open(content: TemplateRef<any>) {
    this.offcanvasService.open(content, { panelClass: 'bg-light', position: 'end' });
  }
}
