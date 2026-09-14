# AGENTS.md — KOREA ROUTE

이 저장소에서 작업하는 모든 AI 에이전트(Astra / Codex / Claude 등)와 사람 개발자는
작업을 시작하기 전에 이 파일을 먼저 읽는다. 이 파일의 규칙은 개별 지시보다 우선한다.

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|---|---|
| 제품명 | KOREA ROUTE |
| 형태 | 설치 없이 브라우저에서 쓰는 모바일 우선 웹앱 (PWA) |
| Production | korea-route.com |
| 기술 구조 | 단일 `index.html` 중심 정적 웹앱 + Vercel 서버리스 API 프록시 |
| 핵심 메뉴 | Plan / Move / Explore / Stay / Trip Wallet / Trip Assistant / My Trip |
| 기본 언어 | English (한국어·일본어 등은 전환 언어) |

### 기준선(BASELINE)

이 저장소의 최초 커밋은 **PATCH 01 + PATCH 02 + PATCH 03이 모두 반영된 실제 운영본**이다.
그 이전 원본 소스를 기준으로 되돌리거나 비교하지 않는다.
"원본에는 이렇게 되어 있다"는 이유로 기준선의 수정 내용을 되돌리면 REGRESSION으로 판정한다.

---

## 2. 파일 구조

> v267 index.html을 실제로 조사해 확정한 구조다. 파일이 추가·변경되면 이 표도 함께 갱신한다.
> 경로는 전부 index.html 기준 상대경로다. 파일을 하위 폴더로 옮기면 참조가 깨진다.
