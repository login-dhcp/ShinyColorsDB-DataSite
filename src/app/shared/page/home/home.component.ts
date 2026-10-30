import { TranslationService } from 'src/app/service/translation/translation.service';
import { TranslationPipe } from 'src/app/service/translation/translation.pipe';
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';


import { ShinyColorsApiService } from 'src/app/service/shinycolors-api/shinycolors-api.service';
import { UtilitiesService } from 'src/app/service/utilities/utilities.service';

import { Card } from '../../interfaces/card';
import { LiveInfo } from '../../interfaces/liveInfo';
import { CD } from '../../interfaces/cd';

import { CardItemComponent } from '../../components/card-item/card-item.component';
import { LiveInfoComponent } from '../../components/live-info/live-info.component';
import { CdInfoComponent } from '../../components/cd-info/cd-info.component';
import { CardItemHolderComponent } from "../../components/card-item-holder/card-item-holder.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [
    TranslationPipe,
    CardItemComponent,
    LiveInfoComponent,
    CdInfoComponent,
    CardItemHolderComponent,
    CommonModule
],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  host: {
    class: 'overflow-auto container-fluid d-flex justify-content-center ',
  }
})
export class HomeComponent implements OnInit {
  togglePS = true;

  recent: Card[] = [];
  liveInfo: LiveInfo[] = [];
  cdInfo: CD[] = [];

  placeholder = Array(12).fill(0).map((x, i) => i);

  constructor(
    private utilsService: UtilitiesService,
    private scApiService: ShinyColorsApiService,
    private title: TranslationService,
    private meta: TranslationService
  ) {
    this.scApiService.getLiveInfos().subscribe((data) => {
      this.liveInfo = data
    });
    this.scApiService.getRecentUpdate().subscribe((data) => {
      this.recent = data;
    });
    this.scApiService.getAlbumInfos().subscribe((data) => {
      this.cdInfo = data;
    });
  }

  ngOnInit(): void {
    this.title.setTitle(' ~ 閃耀色彩資料庫 ~ ');
    this.meta.addTags(this.utilsService.generateDefaultMeta());
    this.utilsService.mobileTitle.emit(' ~ ShinyColorsDB ~ ');
  }
}
