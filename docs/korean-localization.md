# 언어 지원 검증

- 작업 브랜치: `feat/korean-localization`
- 실행 환경: Node 24.22.2, 원본 package-lock.json 기준의 설치된 의존성
- 지원 언어: **KR → EN → JP → CN**, 기본값 **KR**
- 번역 사전: `src/locale/{ko,en,ja,cn}.json`, 언어별 동일한 266개 UI·이름 키

## 언어 선택

상단 드롭다운은 선택 즉시 적용한다. 메뉴 → 설정에서는 선택 후 확인하면 적용하며, 취소하면 기존 언어를 유지한다. 두 선택 목록은 KR, EN, JP, CN만 같은 순서로 표시한다.

선택 우선순위는 URL의 `lang`, 저장된 선택(쿠키/로컬 저장소), 기본값 KR이다. 브라우저 언어와 Accept-Language는 기본값을 바꾸지 않는다. 명시적으로 선택한 EN 등의 저장값은 다음 방문에도 유지한다.

`?lang=KR`, `?lang=EN`, `?lang=JP`, `?lang=CN` 또는 표준 locale 코드 `ko-KR`, `en-US`, `ja-JP`, `zh-CN`으로 직접 열 수 있다. 다른 query parameter와 fragment는 유지한다. 이전 혼합 모드 `zh-JP`는 KR, 번체 중국어 `zh-TW`는 CN으로 처리한다.

서버는 선택 결과를 TransferState로 브라우저에 전달한다. 드롭다운의 선택 항목은 HTML의 selected 속성에도 기록하므로 초기 HTML과 화면 문구의 언어가 일치한다. 사용자별 응답에는 `Cache-Control: private, no-cache`, `Vary: Cookie`를 적용한다.

## EN 표시 수정

기존 EN 사전은 예전 숫자 ID를 사용하여 현재 원문 키와 맞지 않았고, 새 UI 문구와 메뉴 이름도 빠져 있었다. EN·JP·CN 사전을 현재 KR 사전과 동일한 원문 키로 정리했다. 홈, 설정, 아이돌·카드 상세, 검색, 출시표, Cardle, 오류 화면, 페이지 제목·메타 설명과 메뉴의 유닛·아이돌 이름을 포함한다.

우측 메뉴는 API 목록의 11개 그룹·33명 이름을 포함한다. fixture는 메뉴에 필요한 ID·이름·색상만 저장한다. 단독 이름과 이미지 대체 설명을 번역해도 API 요청값과 탐색 ID는 유지한다.

## 자동 검증

동일 코드의 검증 작업본에서 다음을 확인했다.

- production 빌드 성공.
- 단위 테스트 **74개 통과**, 기존 **9개 건너뜀** 유지.
- 네 언어의 사전 키 일치·빈 번역 없음·EN의 미번역 CJK 문구 없음.
- KR 기본값, 저장된 선택과 URL의 우선순위, 별칭과 이전 설정값 처리.
- 상단 및 설정의 네 선택지와 순서, 즉시 적용·확인·취소·선택 동기화.
- 언어 변경 시 제목·메타 설명·접근성 문구 갱신, query parameter·fragment 보존.
- 실제 offcanvas 컴포넌트를 열어 모든 그룹·33명과 이동 ID를 확인하고 KR → EN 전환 후 영어 메뉴 문구를 확인.
- 서버에서 브라우저 전용 document 속성, Pixi 렌더러와 캐러셀 타이머를 실행하지 않음.

## 실제 HTTP·SSR 검증

검증 시각: 2026-10-30T05:02:34.932Z

임시 production 서버와 원본 API로 다음 **13개 요청**을 통과했다. 모든 요청에서 html lang, 네 선택지의 순서와 선택 상태, private 캐시 정책을 확인했다. 번역 문구는 script의 데이터가 아닌 화면 DOM의 텍스트로 확인했다.

| 요청 | 확인 |
| --- | --- |
| 홈 + 영어 Accept-Language | KR 기본값과 최근 업데이트·CD·라이브 정보 |
| 홈 `?lang=KR` | KR 선택과 한국어 문구 |
| 홈 `?lang=EN` | EN 선택과 Latest Updates·CD Information·Live Information |
| 홈 `?lang=JP` | JP 선택과 일본어 CD·라이브 문구 |
| 홈 `?lang=CN` | CN 선택과 간체 중국어 CD·라이브 문구 |
| 홈 + 저장된 EN 쿠키 | EN 선택 유지 |
| 홈 `?lang=KR` + EN 쿠키 | URL의 KR 우선 |
| EN 아이돌 프로필 | Name·Birthday·Mano Sakuragi·Produce Cards·Support Cards |
| EN P 카드 상세 | Release Date·How to Obtain·Rarity·Memory Appeal |
| EN S 카드 상세 | Release Date·Support Skills·Music Proficiency |
| EN 출시표 | Overview·Limited·Permanent |
| EN 스킬 검색 | Skill Search·Support Skills·Idols·Stamina Recovery |
| EN 오류 화면 | HTTP 404·Page not found·Return to Home |

## 범위와 확인 한계

등록된 UI 문구와 단독 유닛명·아이돌명은 선택 언어로 번역한다. 카드명·스킬 설명·커뮤 본문 등 미등록 게임 데이터는 원문으로 표시한다. 일부 외부 UI 라이브러리의 기본 접근성 문구는 라이브러리 기본 언어를 사용한다.

연결된 브라우저가 없어 실제 브라우저의 화면 배치·폰트 렌더링·hydration 완료 여부는 확인하지 못했다. 화면 변경은 DOM 단위 테스트, 초기 HTML은 실제 HTTP·SSR 검증으로 각각 확인했다.

원본 CSS deep selector와 일부 CommonJS 의존성의 빌드 경고는 남아 있다.
