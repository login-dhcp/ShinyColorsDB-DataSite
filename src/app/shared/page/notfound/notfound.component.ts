import { TranslationPipe } from 'src/app/service/translation/translation.pipe';
import { TranslationService } from 'src/app/service/translation/translation.service';
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';

import { UtilitiesService } from 'src/app/service/utilities/utilities.service';

@Component({
  selector: 'app-notfound',
  imports: [
    TranslationPipe,
    RouterModule,
  ],
  templateUrl: './notfound.component.html',
  styleUrls: ['./notfound.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  host: {
    class: 'overflow-auto container-fluid d-flex justify-content-center h-100',
  }
})
export class NotfoundComponent implements OnInit {
  constructor(
    private title: TranslationService,
    private utilsService: UtilitiesService,
  ) {
    // HTTP 404 status is set via serverRoutes (app.routes.server.ts). Setting it here
    // would also apply to in-app redirects to /notfound and break them (404 + Location).
    this.title.setTitle("Error");
    this.utilsService.emitMobileTitle("Error", false);
  }

  ngOnInit(): void { }
}
