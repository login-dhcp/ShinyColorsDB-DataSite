# Cardle 조각 이미지 표시 복구

## 확인한 원인

2026-10-30 UTC에 현재 퍼즐 API와 실제 이미지 응답을 조사했다.

- `https://api.shinycolors.moe/cardle/getCardle`: HTTP 200, 로컬 Origin에 `Access-Control-Allow-Origin: *`.
- 현재 퍼즐 #1493: S 카드 `2040250240`, 이미지 크기 1136×640, 100×100 조각 6개의 좌표는 이미지 범위 안에 있음.
- `https://cf-static.shinycolors.moe/images/content/support_idols/card/2040250240.jpg`에 `Origin: http://localhost:4000`을 붙인 **GET**: HTTP 200, `Content-Type: image/jpeg`, **Access-Control-Allow-Origin 없음**.
- HEAD에서는 허용 헤더가 관찰됐으므로 HEAD만으로 실제 이미지 로딩이 가능하다고 판단할 수 없음.

기존 Cardle은 Pixi Assets를 `crossOrigin: anonymous`로 설정했다. 이 방식에서는 CORS 헤더 없는 GET 응답을 사용할 수 없다. 이미지 로딩 Promise의 실패도 처리하지 않아 조각이 비어 있고 진행 복원도 실행되지 않는다. WebGL 렌더러를 조각마다 만들어 GPU 초기화 실패도 게임을 막는 구조였다.

## 변경

이미지를 일반 HTMLImageElement로 불러온 뒤 Canvas 2D의 drawImage로 필요한 영역만 그린다. 이미지 전체를 기본 화면에 표시하지 않으며 처음에는 첫 조각만, 건너뛰기·오답 뒤에는 다음 조각을 공개한다. Canvas의 픽셀 읽기나 이미지 내보내기는 사용하지 않고 공유는 기존처럼 텍스트를 복사한다. 따라서 이미지 표시를 위해 CORS 픽셀 접근 권한이나 WebGL이 필요하지 않다.

관련 브라우저 동작: [MDN cross-origin canvas 설명](https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/CORS_enabled_image), [drawImage](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage).

게임이 준비되기 전에는 버튼을 비활성화하고, 퍼즐 API나 이미지 로딩 실패는 페이지 내 안내로 표시한다. 완료 뒤 추가 입력은 무시한다. 기존 날짜별 저장 키와 기록 형식은 유지하며 손상된 기록이나 사용할 수 없는 localStorage가 게임을 중단하지 않게 한다.

아이돌·카드 목록과 클릭 처리는 Angular 템플릿에 연결했다. 아이돌을 빠르게 변경하면 이전 카드 요청을 취소하며, 목록의 아이돌명과 그룹명도 선택 언어를 따른다. API 요청값과 카드 ID는 유지한다.

## 검증

- 전체 단위 테스트 74개 통과, 기존 9개 건너뜀 유지.
- Cardle 테스트 18개: 실제 API 응답 fixture, CORS 모드 없는 이미지 로딩, 첫 조각과 다음 조각 좌표, 준비 전 입력, 오답·정답·6회 종료, 진행 복원, 손상·차단된 저장소, API·이미지 실패, 요청 취소, 언어 전환, 화면 이탈, 서버 렌더링.
- Canvas 2D 호출을 모의하여 WebGL 없이 동작하는지와 drawImage의 좌표·공개 순서를 확인했다.
- production 빌드 성공.
- 임시 production 서버의 Cardle URL에 KR·EN·JP·CN 요청을 보내 HTTP 200, 번역된 로딩 안내, 조각 canvas 6개, 초기 버튼 비활성 상태를 확인.

연결된 브라우저가 없어 실제 브라우저에서 조각을 눈으로 확인하거나 클릭하는 검증은 하지 못했다. 실제 원격 HTTP 응답 조사와 DOM·그리기 호출 테스트를 구분한다.
