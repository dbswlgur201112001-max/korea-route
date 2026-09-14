# AGENTS.md — KOREA ROUTE

이 저장소에서 작업하는 모든 AI 에이전트(Astra / Codex / Claude 등)와 사람 개발자는 작업을 시작하기 전에 이 파일을 먼저 읽는다. 이 파일의 규칙은 개별 지시보다 우선한다.

## 1. 프로젝트 개요

제품명: KOREA ROUTE
형태: 설치 없이 브라우저에서 쓰는 모바일 우선 웹앱 (PWA)
Production: korea-route.com
기술 구조: 단일 index.html 중심 정적 웹앱 + Vercel 서버리스 API 프록시
핵심 메뉴: Plan / Move / Explore / Stay / Trip Wallet / Trip Assistant / My Trip
기본 언어: English (한국어·일본어 등은 전환 언어)

기준선(BASELINE): 이 저장소의 최초 커밋은 PATCH 01 + PATCH 02 + PATCH 03이 모두 반영된 실제 운영본이다. 그 이전 원본 소스를 기준으로 되돌리거나 비교하지 않는다. "원본에는 이렇게 되어 있다"는 이유로 기준선의 수정 내용을 되돌리면 REGRESSION으로 판정한다.

## 2. 파일 구조

v267 index.html을 실제로 조사해 확정한 구조다. 파일이 추가·변경되면 이 표도 함께 갱신한다. 경로는 전부 index.html 기준 상대경로다. 파일을 하위 폴더로 옮기면 참조가 깨진다.

  /
  ├─ index.html          앱 본체 (23,239줄 / 약 1.9MB, 인라인 스크립트 64개)
  ├─ sw.js               서비스워커 (index.html:15342에서 './sw.js' 등록)
  ├─ manifest.json       PWA 매니페스트
  ├─ icon-192.png        PWA 아이콘 (루트 상대경로)
  ├─ vercel.json         라우팅 / 캐시 헤더 설정
  ├─ AGENTS.md           ← 이 파일
  ├─ README.md
  ├─ .gitignore
  │
  ├─ /vendor             지도 라이브러리 로컬 사본 (5개, CDN 미사용)
  │   ├─ leaflet.js
  │   ├─ leaflet.css
  │   ├─ leaflet-maplibre-gl.js
  │   ├─ maplibre-gl.js
  │   └─ maplibre-gl.css
  │
  ├─ (루트의 데이터 JSON 13개 — 현재 모두 './' 상대경로로 fetch)
  │   air-quality-help.json, cash-and-convenience.json, dietary-map.json,
  │   foreigner-access.json, hospital-help.json, indoor-transfer-guide.json,
  │   kiosk-help.json, payment-access.json, pre-arrival.json,
  │   price-baseline.json, solo-safety.json, taxi-fare.json, two-way-talk.json
  │
  └─ /api                Vercel 서버리스 함수 (5개)
      ├─ bus.js          /api/bus
      ├─ rail.js         /api/rail
      ├─ gemini.js       /api/gemini
      ├─ kiosk.js        /api/kiosk
      └─ check-ride.js   /api/check-ride

/vendor와 데이터 JSON은 절대 .gitignore에 넣지 않는다. 실제 운영에 필요한 파일이다.

외부 의존 (키 불필요): tiles.openfreemap.org (지도 타일), api.frankfurter.dev/v2 (환율), api.odsay.com (대중교통 경로, 브라우저에서 직접 호출, 아래 경고 참조)

## 3. 제품 원칙

1. 모바일 우선. 모든 화면은 좁은 폭 기준으로 먼저 검증한다.
2. 기본 언어는 English.
3. English 핵심 UI에서 한국어 fallback 금지. 역명·날짜·버튼·안내문에 한국어나 YYYYMMDD 원시값이 그대로 노출되면 버그다.
4. 앱 설치 없이 웹에서 완전히 동작해야 한다. 설치를 전제로 한 기능은 넣지 않는다.
5. 기존 정상 기능을 깨뜨리지 않는다.
6. 전체 재작성보다 최소 수정.
7. 실제 확인 없는 PASS 금지. 코드를 읽고 "고쳐진 것으로 보인다"는 PASS가 아니다.
8. 교통·안전 정보는 추측 금지. 확인되지 않은 시간표, 요금, 소요시간, 운영시간을 지어내지 않는다. 데이터가 없으면 없다고 표시한다.
9. 저장 데이터 형식은 이유 없이 변경 금지. localStorage 키 이름, 저장 구조, 필드명을 바꾸면 기존 사용자의 My Trip이 사라진다.
10. NFC 직접 진입 흐름을 고려한다. 사용자가 카드를 태그해 특정 URL로 바로 들어올 수 있다. 홈을 거치지 않고 진입해도 화면이 정상 동작해야 한다.

## 4. QA 원칙

판정값 (5종 중 하나만 사용): FIXED (실제 화면에서 재현 절차를 밟아 정상 동작을 확인함), STILL FAIL (수정 후에도 동일 증상이 재현됨), REGRESSION (이 수정 때문에 다른 정상 기능이 깨짐), UNTESTED (아직 실제로 확인하지 않음), BLOCKED_ENV (환경 문제로 검사 불가). UNTESTED를 FIXED로 올려 적지 않는다.

심각도: P0 (앱이 안 열림, 데이터 소실, 결제/예약 흐름 중단), P1 (핵심 기능 사용 불가), P2 (기능은 되지만 잘못된 표시), P3 (사소한 문구·여백·톤)

서비스워커 주의 (매우 중요): 이 앱은 PWA다. 서비스워커가 옛 버전을 캐시해 수정이 반영됐는데도 옛 화면이 보일 수 있다. QA 시 시크릿 창에서 Preview URL을 열거나, DevTools에서 서비스워커를 해제한 뒤 강력 새로고침해야 한다. 이 절차 없이 나온 STILL FAIL은 무효로 본다.

## 5. 수정 원칙

한 ISSUE에 관련 없는 기능을 함께 고치지 않는다. 수정 전에 실제 소스를 조사해 원인을 특정한다. 수정 범위는 최소로 한다. 변경 사항은 항상 별도 브랜치에 올린다.

## 6. 금지

프레임워크 갈아엎기, 전체 HTML 재작성, 기존 저장키 임의 변경, API 원본 데이터 임의 변경·보정, 확인되지 않은 AI 기능 추가, Production(main) 직접 수정, API 키·토큰·비밀번호를 소스에 하드코딩하거나 커밋, 도메인 연결 변경(사용자 승인 없이 금지)

## 7. 필수 회귀 검사 (모든 수정 후 실행)

아래 3개 중 하나라도 깨지면 판정은 REGRESSION이다.

REG-001 — Move 영문 표기: English → Move → Suwon → Busan. 역명이 영어로 표시되고, YYYYMMDD 원시 날짜 포맷이 노출되지 않고, 한국어 역명이 남아 있지 않아야 한다.

REG-002 — 언어 전환 일관성: English → Korean → Japanese. 오프라인 사본 관련 UI가 일본어로 정상 표시되어야 하며 "No offline copy" / "Save now" 등 영어 문구가 잔존하면 안 된다.

REG-003 — My Trip 저장 지속성: My Trip → Add a plan → Suwon → Create My Trip. 일정이 생성되고, My Trip 목록에 반영되고, 새로고침 후에도 유지되어야 한다.

## 8. 브랜치 / 커밋 규칙

main = Production (korea-route.com), 직접 push 금지, PR merge만 허용
fix/kr-issue-001 = 버그 수정
feature/nfc-entry = 신규 기능
chore/... = 문서·설정 등 코드 외 변경

커밋 메시지 예시: fix(move): English 역명 fallback 제거 (KR-ISSUE-001) / feat(explore): 맛집 필터 추가 / chore(repo): AGENTS.md 추가

## 9. 완료 정의 (Definition of Done)

한 ISSUE는 아래를 전부 만족해야 완료다: 원인을 소스에서 특정했다 / 별도 브랜치에 최소 수정으로 반영했다 / Vercel Preview가 정상 생성됐다 / Preview URL에서 실제 브라우저로 재현 절차를 밟아 확인했다(서비스워커 해제 상태) / REG-001·002·003을 모두 통과했다 / 판정값과 증거를 보고했다 / 사용자에게 merge 승인을 요청했다.

에이전트는 main에 자동 merge하지 않는다. 최종 승인은 항상 사용자에게 있다.

## 10. 비밀정보

API 키는 소스에 넣지 않는다. Vercel 환경변수에만 둔다. .env는 커밋하지 않는다. 클라이언트에서 직접 호출하는 외부 API에 키가 필요하면 반드시 /api 서버리스 프록시를 거친다. 실수로 키를 커밋했다면 즉시 재발급한다.

현재 키 처리 방식 (v267 조사 결과): 하드코딩된 키 없음. ODSAY_WEB_KEY는 사용자가 화면에서 직접 입력해 sessionStorage에 저장한다. Gemini/버스/철도/키오스크/탑승확인은 /api/* 프록시를 거친다. 다만 ODsay만 브라우저에서 api.odsay.com을 직접 호출하며 키가 쿼리스트링에 실린다. 장기적으로 /api/odsay 프록시로 옮기는 것이 맞다 (별도 ISSUE로 관리).

## 11. 부록 A — 저장키 목록 (변경 금지)

아래 키는 사용자의 저장 데이터다. 이름·구조를 바꾸면 기존 사용자의 데이터가 사라진다: ODSAY_WEB_KEY, koreaRouteCanIMakeIt, koreaRouteFxCurrency, koreaRouteLang, koreaRouteLivePosition, koreaRouteMove, koreaRouteMoveSituation, koreaRouteMoveVerify, koreaRoutePlan, koreaRouteRoute, koreaRouteSavedJourney, koreaRouteSavedPlacePlan, koreaRouteSavedPlaces, koreaRouteSavedTrip, koreaRouteStayArea, koreaRouteStopAlertKeepAwake, koreaRouteTransitPayment, koreaRouteTrip, koreaRouteTripChecklist, koreaRouteVisitedPlaces, koreaRouteWalkAlerts, koreaRouteWallet

특히 주의: 여행 저장 키 이중 구조. KR-BLOCK-001의 원인이 여기였다. sessionStorage의 koreaRouteTrip은 My Trip 화면이 읽는 키이고, localStorage의 koreaRouteSavedTrip은 플래너 새로고침 호환용 키다. PATCH 03에서 v11PersistTripData() 함수가 두 키를 동시에 쓰고 koreaRoutePersistSessionState()를 즉시 호출하도록 다리를 놓았다. 이 함수를 우회해 어느 한쪽 키만 쓰는 코드를 추가하면 KR-BLOCK-001이 재발한다. 여행 저장은 반드시 v11PersistTripData()를 통한다.

## 12. 부록 B — 알려진 선결 과제

KR-ISSUE-004 (P1) — 호스트명 하드코딩. index.html 9941행, 15166행에 다음과 같이 박혀 있다: ODsay 경로 조회 코드가 location.hostname이 정확히 'korea-route.vercel.app'일 때만 동작하도록 조건이 걸려 있다. 영향: Vercel Preview URL은 호스트명이 매번 달라서 Preview에서 Move 기능이 운영본과 다르게 동작하며, 이를 모르는 QA는 REG-001을 환경 탓에 STILL FAIL로 오판한다. 또한 korea-route.com 커스텀 도메인에서도 동작하지 않는다. 이 두 줄을 허용 호스트 목록 방식으로 바꾸기 전까지, Preview에서의 ODsay 관련 실패는 BLOCKED_ENV로 판정한다.
