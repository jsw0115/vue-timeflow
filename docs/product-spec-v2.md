# Timebar Diary 제품 명세 v2

> 기준일: 2026-08-15. 이 문서는 기존 기획의 범위를 MVP와 후속 릴리스로 재정리한 실행 기준 문서다.

## 1. 제품 정의

**Timebar Diary**는 일정, 할 일, 루틴, 회고와 실제 시간 기록을 한곳에서 관리하는 개인 시간관리 서비스다.

- 핵심 차별점: `Plan(계획)`과 `Actual(실제)`을 같은 시간축에서 비교한다.
- 핵심 사용자: 업무·학업·개인생활을 함께 관리하며, 플래너 감성과 앱의 알림/통계 편의성을 원하는 개인 사용자.
- 최초 제공 채널: 반응형 웹 + PWA. 네이티브 앱 패키징은 안정화 후 Capacitor로 제공한다.

## 2. 용어와 제품 원칙

| 용어 | 정의 |
| --- | --- |
| Event | 특정 시작/종료 시간이 있는 약속 또는 일정 |
| Task | 완료 여부와 마감일을 중심으로 관리하는 할 일 |
| Routine | 반복 요일/시간을 갖고 매일 실천 여부를 체크하는 항목 |
| Plan block | Event 또는 Task를 시간대에 배치한 계획 블록 |
| Actual block | 사용자가 직접 기록한 실제 활동 시간 블록 |
| Diary | 하루 회고와 기분, 자유 메모를 담는 일일 기록 |

1. **실제 기록은 빠르게:** 타임바에서 시작·종료·수정이 3탭 안에 가능해야 한다.
2. **계획 실패를 벌점화하지 않기:** 이월과 미완료는 분석 데이터이며, 랭킹/비교의 기본 공개 대상이 아니다.
3. **개인정보 기본값은 비공개:** 공유 기능 도입 전에도 데이터는 계정 소유자만 조회한다.
4. **시간은 사용자 시간대 기준:** 모든 저장 시각은 UTC, 화면/집계는 사용자 IANA time zone 기준으로 처리한다.

## 3. MVP 범위 (Release 1)

### 3.1 반드시 포함

| 영역 | MVP 기능 | 수용 기준 |
| --- | --- | --- |
| 인증/온보딩 | 이메일 가입·로그인·로그아웃, 비밀번호 재설정 요청, J/P/Balance 모드 선택 | 로그인한 사용자별 데이터가 분리되고, 온보딩을 완료해야 홈으로 진입 |
| 홈 | 오늘 일정/Task/루틴 요약, D-Day 3개, 미확인 인앱 알림 | 오늘 날짜와 사용자 시간대에 맞춰 계산 |
| 일간 플래너 | Event·Task·Routine·Diary 요약과 타임바, 일자 이동 | Plan/Actual을 켜고 끌 수 있고 블록을 수정 가능 |
| 주/월 뷰 | 주간은 일정/Task/루틴 요약, 월간은 일정과 기록 여부 표시 | 작성/상세 편집은 일간 화면으로 연결 |
| Event | 생성·수정·삭제, 카테고리, 시작/종료, 단일 알림, 단순 D-Day | 반복/참석자/공개범위는 포함하지 않음 |
| Task | 생성·수정·완료·취소, 예정일/카테고리/우선순위, 오늘·기한·카테고리 필터 | 미완료 Task는 사용자 확인 후 다음 날로 한 번 이월 |
| Routine | 생성·수정·비활성화, 요일 설정, 오늘 체크, 주/월 달성률 | 체크 이력은 날짜별로 보존 |
| Diary/Memo | 일일 회고(잘한 점·아쉬운 점·내일·자유 메모), 텍스트 메모 인박스 | 날짜·키워드로 목록 조회 가능 |
| 통계 | 기간별 완료 Task 수, 루틴 달성률, 다이어리 작성일, 카테고리별 Actual 시간 | 일/주/월 단위로 조회 |
| 설정 | 프로필, 모드, 시작 화면, 시간대, 기본 알림 리드타임 | 변경 내용이 즉시 다음 화면에 반영 |

### 3.2 MVP에서 제외

소셜 로그인, Apple/Google/Kakao 알림 연동, 음성 녹음/STT, AI 추천, 공유·친구·그룹 캘린더, 공개 범위, 커뮤니티·랭킹·채팅, 관리자 Backoffice, 고급 반복 규칙, 플래너 템플릿, 연간 뷰는 MVP에서 제외한다. 이 기능들은 외부 계정/정책·비용·권한 또는 운영 설계가 필요하다.

## 4. 후속 릴리스 순서

| 릴리스 | 기능 | 선행 조건 |
| --- | --- | --- |
| R2 | 반복 일정, 다중 알림, Plan vs Actual 주/월 분석, 고급 이월 규칙, PWA 푸시 | 안정적인 타임바 데이터 모델과 알림 작업 스케줄러 |
| R3 | Google/Apple/Kakao 로그인, 음성 메모/STT, 메모→Task 규칙 변환, AI 회고 초안 | 동의 화면, 비용 한도, AI 결과 검수 UX |
| R4 | 공유 캘린더·참석자·가시성, Capacitor Android/iOS 배포 | 권한 모델, 초대/차단 정책, 앱 스토어 계정 |
| R5 | 커뮤니티·스티커·랭킹·채팅·Backoffice | 신고/차단/모더레이션, 개인정보·청소년 정책, 운영 지표 |

## 5. 빠진 요구사항 및 수정 사항

1. **알림**은 ‘기본 알림 설정’만으로 부족하다. `알림 채널`, `조용한 시간`, `수신 동의`, `예약 발송 상태`가 필요하다. MVP는 인앱 + 로컬/PWA 알림 준비까지만 한다.
2. **자동 이월**은 무조건 실행하면 원치 않는 업무가 누적된다. 기본값은 ‘이월 후보로 표시 → 사용자가 확인’으로 한다. 이월 횟수와 원본 날짜를 남긴다.
3. **Actual 기록**에는 제목·카테고리·시작/종료·연결 Task/Event·메모가 필요하다. 겹치는 블록은 허용하되 경고한다.
4. **반복 일정**은 단순한 DB 복제가 아니라 규칙과 예외 날짜 모델이 필요하다. 따라서 R2로 미룬다.
5. **J/P 모드**는 데이터 모델을 분리하지 않는다. 같은 데이터를 두고 시작 화면, 강조 카드, 제안 문구만 다르게 한다. 사용자는 언제든 변경 가능하다.
6. **달성률/랭킹**은 완료율만 비교하면 편향된다. 공개 랭킹은 R5 이후 참여형·비교 비활성 기본값·신고/차단 정책을 갖춘 뒤 검토한다.
7. **검색**은 MVP에서는 제목/본문의 단순 키워드 검색으로 시작한다. 전문 검색과 AI 검색은 데이터량 검증 후 도입한다.
8. 기존 문서의 프론트엔드 구조는 `React + JSX`로 작성되어 현재 Vue 계획과 모순된다. 아래 Vue 구조로 통일한다.

## 6. 권장 기술 방향

### 6.1 이 프로젝트의 권장안

현재 Vue 화면 초안이 존재하고 Android/iOS/PWA 확장이 목표이므로 다음 조합이 비용과 전환 위험이 가장 낮다.

- Frontend: **Vue 3 + TypeScript + Vite + Vue Router + Pinia**
- UI: **Tailwind CSS + Headless UI 계열 또는 shadcn-vue**, 아이콘은 Lucide
- Server state: **TanStack Query for Vue**; Pinia는 로그인 정보·표시 설정 같은 client state에 한정
- Forms/validation: **VeeValidate + Zod**
- PWA/mobile: **vite-plugin-pwa + Capacitor**
- Backend: **Spring Boot + Java 21 LTS + Gradle Wrapper + Spring Security + JPA**
- Storage: **MariaDB + Flyway**; 개발 환경은 Docker Compose
- API: REST + OpenAPI, DTO는 OpenAPI 기반 TypeScript client 생성
- Operations: Testcontainers, GitHub Actions, OpenTelemetry/Sentry(후속)

Java 17도 가능하지만 새 프로젝트라면 장기 지원과 언어 기능 면에서 Java 21 LTS를 권장한다. QueryDSL은 복잡한 동적 검색이 실제로 생기는 R2부터 제한적으로 도입한다. 초기 CRUD까지 QueryDSL을 전면 도입하면 빌드 설정과 유지비만 커진다.

### 6.2 Vue/Spring 외의 유력 선택지

| 조합 | 적합한 상황 | 이 프로젝트에서의 판단 |
| --- | --- | --- |
| React + Next.js + NestJS | React 경험이 많고 공개 랜딩/SEO와 BFF를 한 프레임워크로 운영할 때 | 가능하나 기존 Vue UI를 재작성해야 하므로 지금은 비추천 |
| React Native/Expo + NestJS | 네이티브 앱 경험이 웹보다 중요한 서비스 | 모바일 UX는 좋지만 웹·PWA와 코드를 완전히 공유하기 어렵다 |
| Flutter + Kotlin/Ktor 또는 NestJS | 모바일 앱 품질을 최우선으로 하고 웹은 보조 채널일 때 | Android/iOS/웹 배포는 가능하지만 웹 UI 자산 재사용이 어렵다 |
| SvelteKit + NestJS/Go | 작은 팀에서 가벼운 웹 개발 경험을 원할 때 | 좋은 선택이지만 Vue 자산과 인력 전환 비용을 상쇄할 장점이 부족 |
| Nuxt + Spring Boot | Vue를 유지하면서 SEO용 소개 페이지와 앱을 함께 운영할 때 | 향후 공개 웹/콘텐츠 비중이 커지면 Vite SPA에서 고려할 업그레이드 경로 |
| Go + Vue/React | 실시간/고동시성 API를 아주 단순하게 운영할 때 | 초기 도메인 규칙과 인증/관리 기능에는 Spring 생태계가 더 생산적 |

Next.js App Router는 서버 컴포넌트·서버 함수·파일 기반 라우팅을 중심으로 발전하고 있고, NestJS는 TypeScript 기반의 모듈형 서버 구조와 인증·OpenAPI·작업 큐 등을 지원한다. Flutter는 Android/iOS/웹을 지원한다. 다만 이는 모두 ‘더 최신이라서’가 아니라 팀의 언어, 기존 코드, 제품 채널 우선순위에 맞을 때 선택하는 대안이다.

## 7. Vue 도메인 모듈 구조

```text
frontend/src/
  app/                 # 앱 시작, Router, 전역 Provider
  shared/              # API client, UI primitives, utils, 타입, 상수
  entities/            # user, event, task, routine, time-block 등 모델/API
  features/            # auth, onboarding, timebar-record, task-complete 등 사용자 행위
  widgets/             # daily-planner, dashboard-summary, calendar 등 조합 UI
  pages/               # route 단위 화면
```

도메인 모듈 내부에는 `api/`, `model/`, `ui/`, `lib/`만 두고, 페이지가 다른 도메인의 내부 상태를 직접 수정하지 않도록 한다. 기존의 화면별 대형 CSS 파일 하나로 관리하는 구조 대신 컴포넌트 범위 스타일과 디자인 토큰을 사용한다.

## 8. 최소 데이터 모델

```text
User 1 ── * Category
User 1 ── * Event
User 1 ── * Task
User 1 ── * Routine 1 ── * RoutineCheck
User 1 ── * TimeBlock (PLAN | ACTUAL) ── 0..1 Task/Event
User 1 ── * DiaryEntry
User 1 ── * Memo
User 1 ── * Notification
```

공통 필드: `id`, `user_id`, `created_at`, `updated_at`, `deleted_at(선택)`.
시간 관련 엔터티에는 `local_date`, `start_at`, `end_at`, `timezone`을 명시한다. 통계는 원본 데이터에서 조회해 시작하고, 성능이 확인된 뒤 일별 집계 테이블을 추가한다.

## 9. 다음 구현 순서

1. 현재 Maven/JS 데모를 Gradle, TypeScript, Router/Pinia 기반 뼈대로 전환한다.
2. 사용자·카테고리·Event·Task·Routine·RoutineCheck·TimeBlock의 DB 마이그레이션과 인증을 구현한다.
3. 일간 플래너와 Actual 기록을 API 연결해 첫 번째 사용 가능 흐름을 완성한다.
4. 홈, 주/월 뷰, 회고, 메모, 기본 통계를 차례로 붙인다.
5. PWA와 Capacitor는 웹 QA가 끝난 뒤 같은 코드베이스에 추가한다.

