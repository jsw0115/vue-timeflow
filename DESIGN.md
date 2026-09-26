# Timebar Diary Design System

<!-- design-md:section experience -->
## 1. Experience

<!-- design-md:claim scope kind=product-surface lang=en -->
### Scope

Timebar Diary는 계획(Plan)과 실제 기록(Actual)을 같은 시간축에서 비교하는 개인 시간관리 서비스다. 이 디자인 시스템은 정형화된 카드 그리드와 상투적인 블루/퍼플 그라데이션을 피하고, 절제된 모노톤 표면 위에 단 하나의 포인트 컬러만 쓰는 에디토리얼한 절제미를 추구한다.
<!-- design-md:claim-end -->

<!-- design-md:claim primary-tasks kind=user-outcomes count=4 lang=en -->
### Primary tasks

- 오늘의 일정·할 일·루틴을 한눈에 확인하고 실제 기록과 비교하기

- 새 일정/할 일/루틴/다이어리를 빠르게 작성하기

- 모드(J/P/B)와 글양식을 취향에 맞게 세부 설정하기

- 지난 기록과 통계를 돌아보기
<!-- design-md:claim-end -->

### Design direction

- 절제된 모노톤 표면(canvas/surface/hairline) 위에 포인트 컬러 1개만 사용한다

- 제목과 본문의 굵기·크기 대비를 극대화한 에디토리얼 타이포그래피를 쓴다

- 넓은 여백과 명확한 시각적 위계를 우선한다

- 미세한 다단 그림자와 얇은 테두리로 절제된 고급 질감을 표현한다

### Principles

- 실제 기록은 항상 3탭 이내에 남길 수 있어야 한다

- 계획 미완료를 시각적으로 벌점화하지 않는다

- 시간 데이터는 항상 명료한 위계로 보여준다(오늘/이번 주/과거)

### Avoid

- 정형화된 동일 크기 카드 격자의 기계적 반복

- 무난한 블루/퍼플 톤 그라데이션 배경

- 한 화면에서 여러 강조색을 동시에 쓰는 것

- 장식적 이모지, 과도한 그림자, 네온톤 색상

<!-- design-md:section foundations -->
## 2. Foundations

<!-- design-md:claim foundations kind=rules-or-constraints lang=en -->
### Semantic tokens

- **color.accent**: `#2f5d46` — Timebar Diary 전용 포인트 컬러(딥 파인 그린) — 절제된 모노톤 위에 단 하나만 쓰는 강조색. 기존 관행적인 블루/퍼플 SaaS 톤을 의도적으로 피하고, 루틴·성장의 이미지와 맞는 깊은 그린을 greenfield로 제안
- **color.canvas**: `#ffffff` — ElevenLabs 공개 마케팅 표면에서 반복 관찰된 기본 캔버스 배경
- **color.foreground**: `#000000` — ElevenLabs 공개 표면에서 반복 관찰된 기본 전경/텍스트 색
- **color.hairline**: `#e5e5e5` — ElevenLabs 공개 라우트에서 반복 관찰된 computed border 색
- **color.muted**: `#777169` — ElevenLabs 공개 라우트에서 반복 관찰된 보조/설명 텍스트 색
- **color.on-accent**: `#ffffff` — 포인트 컬러 위에 놓이는 텍스트 색
- **color.on-primary**: `#ffffff` — 검정 프라이머리 액션 위에 놓이는 텍스트 색 (ElevenLabs 관찰값)
- **color.surface**: `#f5f3f1` — ElevenLabs 홈에서 관찰된 따뜻한 오프화이트 표면 — 캔버스보다 한 단계 낮은 구획 배경
- **radius.full**: `9999px` — ElevenLabs 공개 액션(pill) 코너 관찰값
- **radius.lg**: `16px` — ElevenLabs 에디토리얼 카드 코너 관찰값
- **radius.md**: `12px` — ElevenLabs 공개 리스트박스/카드 코너 관찰값
- **radius.sm**: `4px` — ElevenLabs 공개 텍스트 컨트롤 코너 관찰값
- **shadow.card**: `0px 2px 4px rgba(0,0,0,0.04), 0px 0px 1.143px rgba(0,0,0,0.4)` — ElevenLabs 에디토리얼 카드에서 관찰된 저알파 다단 그림자
- **shadow.raised**: `0px 0px 1px rgba(0,0,0,0.4), 0px 1px 1px rgba(0,0,0,0.04), 0px 2px 4px rgba(0,0,0,0.04)` — ElevenLabs 화이트 공개 액션에서 관찰된 저알파 3단 그림자
- **space.gutter**: `48px` — 페이지 좌우 기본 거터 — project greenfield 확장
- **space.lg**: `12px` — ElevenLabs 공개 컨트롤/컨테이너 간격
- **space.md**: `8px` — ElevenLabs 공개 컨트롤 간격
- **space.section**: `96px` — 섹션과 섹션 사이의 큰 수직 여백 — ElevenLabs 증거 범위(4~20px) 밖의 페이지 레벨 여백으로, 과감한 화이트스페이스 요구를 충족하기 위한 project greenfield 확장
- **space.sm**: `6px` — ElevenLabs 공개 컨트롤 간격
- **space.xl**: `16px` — ElevenLabs 공개 컨테이너 간격
- **space.xs**: `4px` — ElevenLabs 공개 컨트롤에서 관찰된 최소 간격
- **space.xxl**: `20px` — ElevenLabs 공개 컨테이너 간격

### Contrast pairs

- color.foreground on color.canvas: minimum 7:1
- color.on-primary on color.foreground: minimum 7:1
- color.muted on color.canvas: minimum 4.5:1
- color.on-accent on color.accent: minimum 4.5:1

### Reduced motion

Required.

### Foundation rules

- 배경은 canvas/surface 단색만 사용하고 그라데이션은 쓰지 않는다.

- 포인트 컬러(color.accent)는 한 화면에서 가장 중요한 단일 CTA·강조 요소 하나에만 사용한다.

- 그림자는 shadow.card 또는 shadow.raised 토큰만 사용하며, 임의의 진한 단일 그림자를 새로 만들지 않는다.

- 섹션 간 수직 여백은 최소 space.section(96px)을 기본으로 하고, 좁은 화면에서만 축소한다.

- 정형화된 동일 크기 카드 격자를 기본값으로 삼지 않는다 — 콘텐츠 비중에 따라 폭과 높이를 달리한다.
<!-- design-md:claim-end -->

<!-- design-md:section typography-assets -->
## 3. Typography & Assets

### Type roles

| Role | Usage | Family | Size | Weight | Line height | Tracking |
|---|---|---|---|---|---|---|
| display | 페이지 타이틀, 히어로 헤드라인 | Pretendard Variable, -apple-system, BlinkMacSystemFont, sans-serif | 40-56px (반응형) | 300 | 1.15 | -0.02em |
| heading | 섹션 제목, 카드 타이틀 | Pretendard Variable, -apple-system, BlinkMacSystemFont, sans-serif | 18-24px | 600 | 1.3 | -0.01em |
| body | 본문, 리스트, 설명 텍스트 | Pretendard Variable, -apple-system, BlinkMacSystemFont, sans-serif | 14-15px | 400 | 1.6 | 0em |
| control | 버튼, 입력 라벨, UI 컨트롤 텍스트 | Pretendard Variable, -apple-system, BlinkMacSystemFont, sans-serif | 13px | 500 | 1 | 0em |
| figure | 통계 수치, D-Day 카운터, 타임스탬프 등 숫자 강조 | JetBrains Mono, ui-monospace, monospace | 28-40px | 500 | 1 | -0.01em |

### Assets

| Asset | Kind | Source status | License status | Source | Notes |
|---|---|---|---|---|---|
| pretendard-variable | font | licensed-sourced | verified | Pretendard Variable (OFL-1.1), jsDelivr CDN 자체 호스팅 | 한글+라틴 가변 폰트, weight 45-920. 본문/제목/컨트롤 공통 사용 |
| jetbrains-mono | font | licensed-sourced | verified | JetBrains Mono (OFL-1.1), Google Fonts | 숫자·시간 표기 전용 tabular figure. 타임바 앱의 정밀함을 시각적으로 강조 |

### Rules

- display 역할은 300 굵기의 큰 글자, body 역할은 400 굵기의 작은 글자로 두어 굵기·크기 대비로 위계를 만든다 — 같은 크기에서 굵기만 바꿔 위계를 만들지 않는다.

- 숫자(통계, D-Day, 타임스탬프)는 항상 figure 역할(JetBrains Mono)로 표기해 표 형태 정렬과 이질적 텍스처를 동시에 얻는다.

- 자간은 display/heading에서만 음수(-0.01em~-0.02em)를 주고, body/control은 0em을 유지해 긴 문단 가독성을 지킨다.

<!-- design-md:section components-states -->
## 4. Components & States

### Component: button-primary

**Semantics:** 화면당 가장 중요한 단일 행동에만 쓰는 검정 배경 pill 버튼

- Anatomy: label
- Variants: default
- States: default, hover, focus-visible, disabled, loading
- Token references: color.foreground, color.on-primary, radius.full, space.xl

- Interaction kind: interactive

#### State applicability

| State | Applicability | Reason |
|---|---|---|
| default | applicable |  |
| hover | applicable |  |
| focus-visible | applicable |  |
| disabled | applicable |  |
| loading | applicable |  |
| error | not-applicable | 버튼 자체는 오류 상태를 갖지 않으며 오류는 입력 필드에서 표현한다 |
| success | not-applicable | 버튼 자체는 성공 상태를 갖지 않으며 성공은 토스트/배지로 표현한다 |

### Component: button-secondary

**Semantics:** 보조 행동을 위한 아웃라인/표면 버튼. color.accent는 쓰지 않는다

- Anatomy: label
- Variants: default
- States: default, hover, focus-visible, disabled, loading
- Token references: color.surface, color.foreground, color.hairline, radius.full

- Interaction kind: interactive

#### State applicability

| State | Applicability | Reason |
|---|---|---|
| default | applicable |  |
| hover | applicable |  |
| focus-visible | applicable |  |
| disabled | applicable |  |
| loading | applicable |  |
| error | not-applicable | 버튼 자체는 오류 상태를 갖지 않는다 |
| success | not-applicable | 버튼 자체는 성공 상태를 갖지 않는다 |

### Component: input-field

**Semantics:** 텍스트/선택 입력 공통 스타일. 포커스 시 color.accent 2px 아웃라인

- Anatomy: label, control, helper-text
- Variants: text, select, textarea
- States: default, hover, focus-visible, disabled, error, success
- Token references: color.canvas, color.hairline, color.foreground, color.accent, radius.sm

- Interaction kind: interactive

#### State applicability

| State | Applicability | Reason |
|---|---|---|
| default | applicable |  |
| hover | applicable |  |
| focus-visible | applicable |  |
| disabled | applicable |  |
| loading | not-applicable | 텍스트 입력 자체는 별도의 로딩 상태를 갖지 않는다 |
| error | applicable |  |
| success | applicable |  |

### Component: nav-item

**Semantics:** LNB 내비게이션 항목. active 상태는 surface 배경 + foreground 텍스트로만 표현하고 accent는 쓰지 않는다

- Anatomy: icon, label
- Variants: default, active
- States: default, hover, focus-visible
- Token references: color.foreground, color.muted, color.surface, radius.md

- Interaction kind: interactive

#### State applicability

| State | Applicability | Reason |
|---|---|---|
| default | applicable |  |
| hover | applicable |  |
| focus-visible | applicable |  |
| disabled | not-applicable | 내비게이션 항목은 비활성화하지 않는다 |
| loading | not-applicable | 내비게이션 항목은 로딩 상태를 갖지 않는다 |
| error | not-applicable | 내비게이션 항목은 오류 상태를 갖지 않는다 |
| success | not-applicable | 내비게이션 항목은 성공 상태를 갖지 않는다 |

### Component: surface-card

**Semantics:** 정보를 묶는 정적 표면 컨테이너. 동일 크기로 반복 배치하지 않고 콘텐츠 비중에 따라 폭을 달리한다

- Anatomy: header(optional), body, footer(optional)
- Variants: default
- States: default
- Token references: color.canvas, color.hairline, radius.lg, shadow.card

- Interaction kind: non-interactive
- Interaction reason: 그 자체로 클릭 대상이 아닌 정적 컨테이너이며, 내부의 개별 요소가 상호작용을 담당한다

### Rules

- 모든 interactive 컴포넌트는 focus-visible 상태에서 color.accent 2px 아웃라인을 표시한다.

- color.accent는 button-primary와 input-field의 포커스 표시 외에는 컴포넌트 배경색으로 쓰지 않는다.

<!-- design-md:section layout-platforms -->
## 5. Layout & Platforms

### Responsive constraints

- Minimum supported width: 320px
- Reflow target: 200% zoom

### Layout rules

- 데스크톱 콘텐츠 최대폭은 1180px로 제한하고, 그 이상에서는 좌우 여백을 확장한다.

- LNB(사이드바)와 메인 콘텐츠 영역은 각각 독립적으로 스크롤한다.

- 760px 미만에서는 LNB를 오프캔버스로 전환하고 콘텐츠는 전체 폭을 사용한다.

### Platform: web

- 반응형 웹 우선, 데스크톱 사이드바 폭 244px 고정

<!-- design-md:section content-locales -->
## 6. Content & Locales

### Voice

- 담백하고 절제된 안내형 문장을 쓰고 과도한 이모지·느낌표는 쓰지 않는다.

- 핵심 동사를 문장 앞쪽에 두어 사용자가 취할 행동을 명확히 한다.

- 실패·미완료를 벌점화하는 표현을 쓰지 않는다(예: "실패" 대신 "이월"/"다음에").

### Terminology

| Term | Preferred form |
|---|---|
| Actual | 실제 기록 |
| Diary | 다이어리 |
| Event | 일정 |
| Plan | 계획 |
| Routine | 루틴 |
| Task | 할 일 |

### Locale: ko (supported)

- 기본 로케일. 모든 UI 문자열의 1차 기준이다.

<!-- design-md:section governance -->
## 7. Governance

<!-- design-md:claim authority kind=project-system lang=en -->
### Authority

This document is the project design contract for the declared scope.
<!-- design-md:claim-end -->

<!-- design-md:claim application-priority order=prompt-fact,repository-fact,system-contract,reference-inspiration lang=en -->
### Application priority

1. Direct user instructions for the requested scope.
2. Repository facts.
3. This system contract.
4. Reference inspiration.
<!-- design-md:claim-end -->

<!-- design-md:claim unknowns policy=absent-at-smallest-unresolved-boundary lang=en -->
### Unknowns

Omit only the smallest unresolved value or group. Do not replace it with a plausible default.
<!-- design-md:claim-end -->

<!-- design-md:claim changes policy=review-record-validate-before-adoption lang=en -->
### Changes

Record, review, and validate changes before adoption.
<!-- design-md:claim-end -->

### Project priority details

1. 접근성

2. 일관성

3. 심미성

4. 성능

### Additional change rules

- DESIGN.md 변경은 omd:init/omd:apply 워크플로를 통해서만 이루어지며 파일을 직접 수정하지 않는다.

- 새 토큰을 추가하기 전에 기존 토큰으로 표현 가능한지 먼저 검토한다.
