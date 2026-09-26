# Timebar Diary — 디자인 & 기능 구현 가이드

> 기준일: 2026-08-21
> 원본 자료: `/mnt/e/vscode-proj/timeflow 앱웹.xlsx` (문서 버전 2.1, 2026-02-16 수정) — 시트 `화면 목록서 및 기능 목록서`(89개 화면 / 약 300개 기능), `APP 컨셉`, `MVP 핵심 기능`
> 이 문서의 역할: xlsx는 **무엇을 만들지**(기획 원본)를 담고 있다. 이 문서는 **이 저장소 기준으로 어떤 순서·구조로 만들지**를 정리한 실행 가이드다. 기존 `docs/product-spec-v2.md`는 초기 MVP 스코프 기준이라 범위가 좁다 — xlsx의 커뮤니티/채팅/실시간/감사로그 확장분을 반영해 로드맵을 다시 정렬했다.

---

## 0. 지금까지 만든 것 (기준점)

| 영역 | 현재 상태 |
| --- | --- |
| 프론트 라우팅 | `vue-router` 도입 완료. `/`, `/planner`, `/events`, `/tasks`, `/routines`, `/diary`, `/memos`, `/focus`, `/stats`, `/share`, `/report`, `/settings`, `/admin` 13개 실제 URL 라우트, `src/views/*.vue`로 화면 분리, `src/store/appState.js`에 공용 상태(tasks/routines/composer) |
| 백엔드 인프라 | Spring Boot 3.4 + JPA + QueryDSL(`JPAQueryFactory` 빈, `BaseTimeEntity`) 배선 완료. 예시로 `PlannerItemEntity` + `PlannerItemRepository`(Spring Data + QueryDSL 커스텀) 패턴 확립 |
| 데이터 | 전부 인메모리/목업(`ConcurrentHashMap`). 실제 DB 연동·마이그레이션 없음 |
| 디자인 | `App.vue` 하나의 톤(보라 `#7c6cf0` 계열 프라이머리, 흰 카드 + 옅은 그림자, 좌측 사이드바 + 상단 헤더, 유니코드 글리프 아이콘)으로 홈/플래너/관리 화면까지 일관 적용됨 |

이 4가지가 이후 모든 확장의 골격이다. 아래 로드맵은 이 골격을 그대로 반복 적용하는 것을 전제로 한다.

---

## 1. 전체 스코프 요약

xlsx는 22개 기능 도메인, 89개 화면으로 구성된다. 전부 나열하지 않고 도메인별 화면 수와 이 저장소에서의 현재 커버리지만 표로 정리한다(세부 기능 ID는 xlsx 원본이 정본이므로 여기서는 생략).

| 기능 도메인 | 화면 수(대략) | 현재 커버리지 |
| --- | --- | --- |
| 인증/온보딩 (AUTH) | 5 | `AuthController` 목업만 존재, 화면 없음 |
| 홈/알림 (HOME) | 3 | `HomeView` 골격만 존재, 알림 인박스 없음 |
| 플래너 일/주/월/연/템플릿/캔버스 (PLAN) | 6 | `PlannerView`는 일간만, 주/월/연/템플릿/캔버스 없음 |
| 집중모드 (FOCUS) | 2 | `FocusView` 정적 목업만 |
| 일정 (EVT) | 5 | `ManageView`로 리스트만 흉내, CRUD·반복·공유 없음 |
| 할 일 (TASK) | 2 | 동일 |
| 루틴 (ROUT) | 3 | 동일 |
| 다이어리 (DIARY) | 3 | `DiaryView` 정적 목업만 |
| 메모 (MEMO) | 3 | 없음(음성/STT/AI 변환 전부 미착수) |
| 머니로그 (MONEY) | 1(섹션) | 없음 |
| 통계 (STAT) | 4 | `StatsView` 정적 목업만 |
| AI 리포트 (INSIGHT) | 1 | 없음 |
| 전역 검색 (SRCH) | 1 | 없음 |
| 업무 특화 (WORK) | 3 | 없음 |
| 공유 (SHARE) | 4 | 없음 |
| 채팅 (CHAT) | 2 | 없음 |
| 커뮤니티/그룹/게시판/랭킹/챌린지 (COMM) | 10 | 없음 |
| 주소록/관계관리 (ADD) | 3 | 없음 |
| 설정 (SET/TRASH/SYNC) | 10 | `SettingsView` 정적 목업만 |
| 관리자 (ADM) | 9 | 없음(사이드바 항목만 존재) |

즉 현재는 **레이아웃 뼈대와 인프라 배선만** 끝난 상태이고, 실제 데이터·CRUD·도메인 로직은 전 영역에서 시작 전이다.

---

## 2. 구현 로드맵 (Phase 0 ~ 5)

`product-spec-v2.md`의 R1~R5보다 세분화하고, xlsx의 신규 확장분(커뮤니티/채팅/감사로그/PvsA 심화)을 반영했다.

### Phase 0 — 완료
Vue shell + 라우팅, Spring Boot + JPA/QueryDSL 배선, 화면 톤 앤 매너 확정.

### Phase 1 — MVP 핵심 (`MVP 핵심 기능` 시트 그대로)
- **AUTH**: 이메일 가입/로그인/로그아웃, 비밀번호 재설정, 첫 로그인 온보딩(J/P/B 모드)
- **HOME**: 오늘 요약 대시보드, 알림 인박스(시스템 알림만)
- **PLAN-001**: 일간 플래너(Todo, 3구간×4컬럼 테이블, 오늘의 문장, 3분할 회고, 타임블록 CRUD, Plan/Actual 뷰)
- **PLAN-002/003**: 주간·월간 기본 뷰(타임테이블/캘린더 + TOP5 + 도넛)
- **EVT / TASK / ROUT**: 각 CRUD, 리스트, 필터, D-Day 기본, 루틴 체크·달성률
- **DIARY / MEMO**: 일간 회고+캘린더, 텍스트 메모 인박스(음성/AI 변환은 제외)
- **STAT**: 일간 카테고리 도넛 + PvsA 기본 비교
- **SET**: 프로필/환경/카테고리/알림 기본값
- **GLB**: 날짜·주·월 이동, 뷰 탭 전환, 카테고리 공통 참조, 소프트삭제 규칙

이 범위가 끝나야 "제품"이라고 부를 수 있다. 지금 코드베이스 기준으로는 **Event/Task/Routine/Diary/Memo 엔티티와 실제 DB 연동이 최우선 착수 지점**이다.

### Phase 2 — PvsA 심화 + 반복/알림
- `PVA-VIS-F01~F03`: 고스트 오버레이, 히트맵 차이 강조, 성취도 파티클 — 지금의 타임바 UI를 그대로 확장
- `PVA-002-F01~F04`: Time Gap(싱크로율) 계산, Over/Under 경향성, 골든타임 존, 미루기 패턴 감지 — 통계 화면의 핵심 차별점이므로 Phase 1 직후 우선순위 최상단
- 반복 일정(`EVT-005`), 다중 알림, 자동 이월 고급 규칙
- 휴지통/복구(`TRASH-001`), 백업/내보내기(`SET-007`)

### Phase 3 — 계정 확장 + 공유
- 소셜 로그인(`AUTH-004`), 기기 관리
- 공유(`SHARE-001~004`): 친구/캘린더 그룹/가시성/이미지 공유
- 주소록(`ADD-001~003`): 리스트/그룹/검색/프로필카드 — `Global User Picker`(`ADD-INT-F01`)는 일정 공유·인박스 등 여러 화면이 재사용하므로 공통 컴포넌트로 먼저 설계
- 외부 캘린더 연동(`SET-010`, `INT-001`) + 동기화 상태/충돌 해결(`SYNC-001`)

### Phase 4 — 커뮤니티/채팅/실시간
- WebSocket 기반(`WS-001~004`): 연결/인증, 실시간 알림, 실시간 채팅, 실시간 집중 상태
- 커뮤니티 그룹(`COMM-GRP-*`): 생성/탐색/모집/가입신청(채팅형 승인 DM)/멤버관리
- 게시판/인증(`COMM-POST-*`), 랭킹/명예의전당(`COMM-009`), 챌린지(`COMM-010`)
- 채팅(`CHAT-001/002`, `COMM-008` 그룹채팅)
- 업무 특화 리포트(`WORK-001~003`), 머니로그(`MONEY-001`)
- AI 리포트(`INSIGHT-001`, `AI-REP-*`, `AI-PLAN-*`)

### Phase 5 — 관리자(Backoffice)
사용자 관리, 로그/모니터링, 공지/팝업, 관리자 통계, 콘텐츠 관리, CS, 구독/결제, **커뮤니티 관리(신고/제재)**, **감사 로그(`ADM-009`)**. 감사 로그는 Phase 4의 커뮤니티 운영 기능과 함께 설계해야 나중에 로그 스키마를 다시 만들지 않는다.

---

## 3. 디자인 시스템 확장 가이드

현재 톤(보라 프라이머리 + 화이트 카드 + 좌측 nav)을 깨지 않고 신규 화면 유형에 맞는 **패턴만 추가**하는 방식을 권장한다.

| 신규 화면 유형 | 해당 화면 | 재사용/신규 패턴 |
| --- | --- | --- |
| 리스트 + 우측 상세 2단 | EVT-001/002, TASK-001, ADD-001/003 | 이미 `ManageView.vue`에 있는 `.manage { list + aside.detail }` 그리드를 그대로 확장 |
| 모달/피커 | ADD-002(User Picker), EVT-003 공유 대상 선택 | 지금의 `composer` 백드롭 모달 패턴 재사용, 멀티 셀렉트 칩 UI만 추가 |
| 드로어(Drawer) | ADD-003 프로필 상세 카드 | 모바일에서는 하단 시트, 웹에서는 우측 슬라이드 패널로 반응형 처리 |
| 채팅 UI | CHAT-001/002, COMM-008 | 좌측 스레드 목록 + 우측 말풍선 리스트 + 하단 입력창. 기존 사이드바 폭(약 240px)을 스레드 목록 폭으로 재사용 가능 |
| 칸반/보드 | PLAN-006 프로젝트 캔버스 | 카드 드래그 라이브러리 1개만 신규 도입 필요(예: vue-draggable-next), 나머지는 기존 카드 스타일 그대로 |
| 히트맵 캘린더 | PLAN-003/004, PVA-VIS-F02 | 월간 캘린더 셀에 색 농도만 입히는 방식 — CSS 변수로 강도(intensity) 0~1 매핑 |
| 관리자 데이터 테이블 | ADM 전체 | 리스트+필터+페이지네이션 공통 컴포넌트 하나를 먼저 만들고 9개 관리자 화면이 전부 이걸 재사용하도록 설계(중복 구현 방지) |

**아이콘**: 현재 유니코드 글리프(⌂ ▦ ◷ 등)는 화면 수가 적을 때는 괜찮지만, Phase 3 이후 화면이 40개를 넘어가면 일관성이 깨진다. `product-spec-v2.md`에서 이미 제안한 대로 **Lucide 아이콘 세트로 전환**을 Phase 2 착수 시점에 권장한다.

**색상 확장**: 카테고리 색상(`CLR-001-F01`)이 통계 도넛, 타임바 블록, 캘린더 히트맵, 커뮤니티 태그 등 전 영역에서 반복 사용된다. 지금처럼 컴포넌트마다 색을 하드코딩하지 말고 `styles.css`에 카테고리 색 토큰(`--cat-work`, `--cat-study` 등)을 지금 단계에서 미리 정의해두면 이후 재작업을 줄인다.

---

## 4. 프론트엔드 구조 확장안

### 4.1 상태 관리
지금은 `src/store/appState.js` 하나에 모든 공용 상태(tasks/routines/composer 등)가 섞여 있다. Phase 1로 넘어가 Event/Task/Routine/Diary/Memo가 각각 실제 API를 갖게 되면 파일 하나로는 감당이 안 된다. **Pinia 도입 후 도메인별 store 분리**(`stores/event.js`, `stores/task.js`, `stores/auth.js` …)를 Phase 1 착수와 동시에 하는 것을 권장한다(`product-spec-v2.md`의 권고와 동일, 이번 xlsx 검토로도 결론 동일).

### 4.2 라우트 확장
현재 13개 라우트에 Phase 1~2 범위만 추가해도 아래처럼 늘어난다. `router/index.js`의 `navItems` 배열 구조를 그대로 유지한 채 항목만 추가하면 된다.

```
/onboarding            AUTH-005
/events/:id            EVT-002 (상세)
/tasks/:id             TASK-002 (상세/등록)
/routines/history      ROUT-003
/diary/:date           DIARY-002
/memos/:id             MEMO-002/003
/stats/compare         STAT-003 (PvsA 비교)
/planner/weekly        PLAN-002
/planner/monthly       PLAN-003
```
공통 컴포넌트(User Picker, Drawer, Kanban 등)는 `src/components/`로 분리해 여러 뷰에서 import하는 구조를 Phase 1부터 잡아두는 것이 좋다 — 지금은 뷰가 적어 안 보이지만 Phase 3(주소록/공유)부터 재사용 압력이 커진다.

---

## 5. 백엔드 도메인/엔티티 설계 스케치

### 5.1 패키지 구조
지금 확립된 `kr.timebar.diary.planner`(Entity + Repository + QueryDSL Repository + RepositoryImpl) 패턴을 기능 도메인마다 그대로 복제한다.

```
kr.timebar.diary
 ├─ common        (BaseTimeEntity, ApiResponse, 예외 처리 — 완료)
 ├─ config        (WebConfig, QuerydslConfig, JpaConfig — 완료)
 ├─ auth          (User, AuthController — 목업만 있음, User 엔티티화 필요)
 ├─ category      (Category 엔티티 — 여러 도메인이 공통 참조하므로 가장 먼저 필요)
 ├─ event         (Event, EventRepository, EventQueryRepository)
 ├─ task          (Task, TaskRepository, TaskQueryRepository)
 ├─ routine       (Routine, RoutineCheck)
 ├─ timeblock     (TimeBlock — Plan/Actual 공통, PLAN-001의 핵심 데이터 소스)
 ├─ diary         (DiaryEntry)
 ├─ memo          (Memo)
 ├─ stat          (집계는 엔티티보다 QueryDSL 프로젝션/DTO 중심)
 ├─ share / chat / community / admin / search / insight / integration / trash
    (Phase 3~5에서 순차 추가)
```

### 5.2 핵심 엔티티 관계 (Phase 1 기준)

```
User 1─N Category
User 1─N Event / Task / Routine / DiaryEntry / Memo
Event  1─N TimeBlock (planned)
Task   1─N TimeBlock (planned, optional)
TimeBlock : ownerId, categoryId, kind(PLAN/ACTUAL), start, end, linkedEventId?, linkedTaskId?
RoutineCheck : routineId, date, done
Category : ownerId, name, colorId, icon, type(업무/공부/건강 등)
```

`PLAN-001-F07`(타임블록 CRUD)에 명시된 대로 **TimeBlock이 일/주/월/연 통계 전체의 공통 데이터 소스**다. 이 엔티티 설계를 가장 신중하게 먼저 잡아야 Phase 2의 PvsA 심화 분석(Time Gap, 골든타임)을 나중에 갈아엎지 않는다.

### 5.3 지금 만든 QueryDSL 패턴 재사용
`PlannerItemQueryRepositoryImpl`에서 쓴 null-safe `BooleanExpression` 동적 조건 조합 방식은 EVT-001(필터/정렬/검색), TASK-001(상태/우선순위 필터), STAT-003(기간/카테고리 드릴다운)에도 동일하게 적용 가능하다. 새 도메인마다 이 구조를 복사해서 조건만 바꾸면 된다.

---

## 6. 지금 바로 시작하면 좋은 것

1. `Category` 엔티티 — 거의 모든 도메인이 참조하므로 제일 먼저.
2. `User` 엔티티화 — 현재 `AuthController`의 인메모리 `User` record를 JPA 엔티티로 승격, `AUTH-001~003` 실제 인증(비밀번호 해싱, JWT 발급)과 연결.
3. `TimeBlock` 엔티티 — PLAN-001의 핵심, STAT 전체의 데이터 소스이므로 Task/Event보다 먼저 설계.
4. `Event`, `Task`, `Routine`, `DiaryEntry`, `Memo` 엔티티 + Repository — `PlannerItemEntity` 패턴 그대로 복제.
5. 프론트: Pinia 도입 + `stores/event.js` 등으로 상태 분리, 각 View를 실제 API(axios/fetch)로 연결.

이 5가지가 끝나면 Phase 1(MVP)이 완성되고, 이후 Phase 2~5는 이 문서의 로드맵 순서를 따라가면 된다.
