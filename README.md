# ShinyColorsDBDataSite

## 한국어 지원

상단의 언어 드롭다운에서 **한국어**를 선택하면 확인 버튼 없이 현재 화면의 언어가 즉시 바뀝니다. 메뉴 → 설정에서도 언어를 선택할 수 있습니다. 선택은 쿠키와 로컬 저장소에 보관됩니다. 직접 진입하려면 URL에 `?lang=ko-KR`를 지정합니다. 예: `/idolinfo?idolid=1&lang=ko-KR`.

언어 결정 순서는 URL의 `lang`, 저장된 선택, 브라우저 언어 순입니다. 서버는 쿠키와 `Accept-Language`를 사용하고 선택 결과를 브라우저에 전송해 첫 렌더링의 언어를 일치시킵니다. 원래 혼합 UI로 돌아가려면 설정에서 혼합 모드를 선택하거나 `?lang=zh-JP`를 사용합니다.

한국어 번역은 `src/locale/ko.json`에서 관리합니다. 홈, 메뉴, 설정, 아이돌·카드 상세, 적성·스킬 표, 출시표, 검색, 라이브, Cardle, 오류 화면의 UI 문구와 페이지 제목·메타 설명을 번역합니다. 우측 메뉴의 유닛명·아이돌명도 한국어로 표시합니다. 카드명·스킬 설명·커뮤 본문 등 API의 게임 원문은 별도 번역 데이터가 없으면 그대로 표시합니다. 기존 다른 언어 파일의 번역이 빠진 항목은 원문으로 표시합니다. 일부 외부 UI 라이브러리의 기본 접근성 문구는 라이브러리 기본 언어를 사용합니다.

한국어 글꼴은 운영체제의 한글 지원 글꼴을 사용합니다. 언어 전환은 화면 표시만 바꾸며 카드 ID와 검색 API 값은 유지합니다.

검증 명령:

```bash
npm ci --engine-strict
npm test -- --watch=false
npm run build
```

Node 버전은 `package-lock.json`에 기록된 Angular 도구의 요구사항을 충족해야 합니다. 이번 작업은 Node 24.22.2에서 검증했습니다.

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 14.1.2.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
