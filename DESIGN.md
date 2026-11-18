# Timebar Diary Design System

Timebar Diary(저장소 이름 vue-timeflow)의 디자인 계약이다. 2026-11-18에 9개 섹션 형식으로 다시 썼다.

- 기존 계약(이전 DESIGN.md 1~7장)의 토큰 값과 규칙을 이어받는다.
- Figma 레퍼런스(`.claude/data/references/figma/DESIGN.md`)에서는 중립 크롬 원칙, 보조 버튼·세그먼트 탭·원형 아이콘 버튼 형태, 테두리 색, 오버레이 그림자를 가져왔다.
- 각 값의 출처는 `계약`(이전 DESIGN.md), `Figma`(Figma 레퍼런스), `코드`(현재 `frontend/src`), `보완`(2026-11-18 기존 규칙의 톤과 비율에서 유도해 채운 값. 근거를 함께 적는다)으로 표기한다.
- 토큰과 공통 컴포넌트 클래스의 코드 위치는 [부록 A](#코드-위치)에 있다.
- 이 문서의 목표 값과 현재 코드 값이 다른 곳은 [부록 B](#부록-b-현재-코드와의-차이)에 모았다.

## 1. Visual Theme & Atmosphere

### 제품

Timebar Diary는 계획(Plan)과 실제 기록(Actual)을 같은 시간축에서 비교하는 개인 시간관리 서비스다. 사용자 화면은 다섯 묶음으로 나뉘고, 관리자용 운영·콘텐츠 묶음은 따로 있다(`frontend/src/router/index.js`).

| 묶음 | 대표 화면 |
|---|---|
| 메인 | 홈, 알림, 캘린더, D-Day, 멘션함 |
| 플래너 | 일간 플래너(계획과 실제 비교), 템플릿, 프로젝트 캔버스, 집중 모드, 같이 집중 |
| 기록 | 일정, 할 일, 루틴, 다이어리, 메모, 태그, 머니로그 |
| 인사이트 | 통계 보드, 일간·카테고리 통계, 비교 분석, 업무 리포트, WBS, 경력·포트폴리오 |
| 소셜 | 공유 캘린더, 주소록, 채팅, 커뮤니티 |

사용자는 J/P/B 세 가지 모드 중 하나를 고르고, 모드마다 글양식과 홈·통계 포틀릿 구성을 바꿀 수 있다(`SettingsEnvView.vue`, `SettingsFormStyleView.vue`).

### 분위기

화면은 "기록을 담는 중립적인 틀"이다. Figma가 흰 캔버스와 검정 크롬으로 사용자 작업물을 돋보이게 하듯, Timebar Diary도 크롬을 모노톤으로 두고 사용자가 고른 카테고리 색과 기록 내용이 색을 갖게 한다. 정형화된 카드 그리드와 상투적인 블루·퍼플 그라데이션을 피하고, 포인트 컬러는 딥 파인 그린 하나만 쓴다.

### 핵심 특징

- 흰 캔버스(`#ffffff`)와 따뜻한 오프화이트 표면(`#f5f3f1`), 검정 텍스트와 검정 주 액션
- 포인트 컬러 `#2f5d46` 하나만 사용
- 굵기 300의 큰 제목과 굵기 400의 본문으로 위계를 만드는 에디토리얼 타이포그래피
- 숫자·시간은 JetBrains Mono로 표기해 자릿수를 맞춤
- 넓은 여백, 얇은 테두리, 저알파 다단 그림자

### 주요 작업 (계약)

- 오늘의 일정·할 일·루틴을 한눈에 확인하고 실제 기록과 비교하기
- 새 일정·할 일·루틴·다이어리를 빠르게 작성하기
- 모드(J/P/B)와 글양식을 취향에 맞게 세부 설정하기
- 지난 기록과 통계를 돌아보기

### 원칙

| 원칙 | 출처 |
|---|---|
| 실제 기록은 항상 3탭 이내에 남길 수 있어야 한다. | 계약 |
| 계획 미완료를 시각적으로 벌점화하지 않는다. | 계약 |
| 시간 데이터는 항상 명료한 위계(오늘 → 이번 주 → 과거)로 보여준다. | 계약 |
| 크롬은 중립으로 두고 색은 사용자의 기록이 갖게 한다. | Figma |
| 굵기·자간·형태의 정밀한 차이로 위계를 만든다. | Figma |

## 2. Color Palette & Roles

### 인터페이스 토큰

| 토큰 | CSS 변수 | 값 | 역할 | 출처 |
|---|---|---|---|---|
| color.canvas | `--color-canvas` | `#ffffff` | 페이지 배경, 카드 배경, 입력 배경 | 계약 (Figma canvas와 같은 값) |
| color.surface | `--color-surface` | `#f5f3f1` | 캔버스보다 한 단계 낮은 구획, nav 활성 배경, 세그먼트 컨테이너, 배지 배경 | 계약 |
| color.foreground | `--color-foreground` | `#000000` | 본문 텍스트, 주 액션 배경 | 계약 (Figma primary와 같은 값) |
| color.muted | `--color-muted` | `#777169` | 보조 설명 텍스트, 비활성 nav 텍스트 | 계약 |
| color.hairline | `--color-hairline` | `#ebebeb` | 구분선, 카드·입력·보조 버튼 테두리 | Figma border (이전 계약 값 `#e5e5e5`) |
| color.on-primary | `--color-on-primary` | `#ffffff` | 검정 주 액션 위 텍스트 | 계약 |
| color.accent | `--color-accent` | `#2f5d46` | 화면당 단일 강조, 포커스 표시 | 계약 |
| color.on-accent | `--color-on-accent` | `#ffffff` | 포인트 컬러 위 텍스트 | 계약 |
| color.data | `--color-data` | `#4e7963` | 기록·달성 데이터 표시(진행 막대, 실제 기록 막대·선, 히트맵, 연속 점, 다이어리 작성일) | 보완 |
| color.on-data | `--color-on-data` | `#ffffff` | 데이터 색 위 텍스트 | 보완 |

### 색 역할 나눔 (보완)

accent를 컴포넌트 배경으로 쓰지 않는다는 규칙(4장)을 지키면서 화면에 필요한 채움 색을 쓰임새로 나눴다. 2026-11-18 사용자 요청으로 정했다.

| 쓰임새 | 색 | 이유 |
|---|---|---|
| 단일 강조, 포커스 표시 | color.accent | 계약. 화면에서 가장 짙은 그린은 이것 하나다. 예: 플래너 "실제 기록" 버튼의 기록 중 채움(`.record.record-on`) |
| 선택·켜짐 상태(체크박스, 토글 스위치, 눌린 요일, 현재 보기, 선택한 목록 항목) | color.foreground 채움 + color.on-primary 글자 | segmented-tab 선택과 같은 규칙이다. 모노톤 크롬과 맞고, 포커스 표시(accent)와 색이 겹치지 않아 "선택됨"과 "포커스"가 구분된다 |
| 개수 배지(알림·안 읽음 수) | color.foreground 채움 + color.on-primary 글자 | 크롬 요소라 모노톤으로 둔다. 화면에 여러 개 나와도 단일 강조를 흐리지 않는다 |
| 기록·달성 데이터 | color.data | accent와 같은 파인 그린 계열(색상 150°)에서 밝기를 높이고 채도를 낮춘 세이지 톤이다. 기록의 분위기를 유지하면서 accent보다 한 단계 약해 단일 강조를 가리지 않는다 |
| 연결·온라인 상태 점 | color.accent | 상태 색 표의 성공 표시. 작은 점에만 쓴다 |
| 카테고리·템플릿 색 | 콘텐츠 색 | 사용자가 고르는 색이다. 아래 콘텐츠 색 규칙을 따른다 |

- 데이터 단계 표현(히트맵 단계)은 color.data를 color.surface와 섞어 만든다. 가장 진한 단계가 color.data다.
- 선택 상태를 표시하는 테두리(선택한 카드·옵션의 1px 테두리)는 배경 규칙과 별개라 아직 accent를 쓴다. 정리 여부는 부록 B에서 다룬다.

### 상태 색

코드에서 이미 쓰는 값을 공식 토큰으로 기록했다. 의미 이름은 실제 사용 클래스에서 가져왔다.

| 토큰 | 값 | 현재 사용처 | canvas 대비 | surface 대비 |
|---|---|---|---|---|
| color.status-danger | `#b23b3b` | `.danger`, `.out`, `.sla-over`, `.wip-over`, 공유 동의 모달 오류 문구 | 5.86:1 | 5.30:1 |
| color.status-warning | `#8a6a3c` | `.warn`, `.offline` | 4.99:1 | 4.51:1 |
| color.status-info | `#43596b` | `.info` | 7.29:1 | 6.59:1 |
| 성공 표시 | color.accent | `.ok` (surface 배경 + accent 텍스트) | 7.57:1 | 6.84:1 |

- 상태 색은 텍스트, 배지, 작은 점처럼 좁은 면적에만 쓴다. 버튼 배경이나 넓은 면에는 쓰지 않는다.
- `status-danger`는 오류, 기한·한도 초과에만 쓴다. 계획 미완료에는 쓰지 않는다.

### 콘텐츠 색

카테고리·일정 블록·차트 색은 인터페이스 토큰이 아니라 사용자가 고르는 콘텐츠 색이다. Figma 레퍼런스가 작업물 안의 색을 인터페이스 팔레트로 끌어오지 않는 것과 같은 원칙이다.

- 현재 카테고리 스와치(`SettingsCategoryView.vue`): `var(--color-accent)`, `#43596b`, `#8a6a3c`, `#b23b3b`, `#4a4740`, `#2f7a56`
- 통계·일정 블록에서 추가로 쓰는 값: `#b5843f`, `#5c7891`
- 콘텐츠 색은 시간 블록 왼쪽 3px 띠, 차트 막대, 범례 점처럼 작은 면적에만 쓴다.
- `#b5843f`는 흰 배경 대비 3.31:1이라 텍스트 색으로 쓰지 않는다.
- 상태 색과 같은 값(`#b23b3b`·`#8a6a3c`·`#43596b`)이 콘텐츠 색으로도 쓰인다. 오류·경고·안내 같은 상태 표시는 반드시 `--color-status-*` 변수를 쓰고, 콘텐츠 색 자리에서만 hex를 쓴다. 테마가 상태 색을 바꿔도 사용자가 고른 카테고리 색은 바뀌지 않게 하려는 구분이다. (보완)

### 채택하지 않은 Figma 색

| 값 | Figma 역할 | 채택하지 않은 이유 |
|---|---|---|
| `#4d49fc` | 인디고 보조 강조 액션 | 포인트 컬러 1개 원칙과 블루·퍼플 강조 회피 원칙에 어긋난다. |
| `#0d99ff` | 점선 포커스 | 흰 배경 대비 2.99:1로 비텍스트 대비 기준 3:1(WCAG 2.1 1.4.11)에 못 미친다. 포커스는 color.accent(7.57:1)로 표시한다. |

### 대비 기준

| 조합 | 최소 기준 (계약) | 실측 |
|---|---|---|
| foreground on canvas | 7:1 | 21:1 |
| on-primary on foreground | 7:1 | 21:1 |
| muted on canvas | 4.5:1 | 4.83:1 |
| on-accent on accent | 4.5:1 | 7.57:1 |
| on-data on data (보완) | 4.5:1 | 4.95:1 |
| data on canvas, 그래픽 (보완) | 3:1 | 4.95:1 |
| data on surface, 그래픽 (보완) | 3:1 | 4.48:1 |
| data on hairline, 막대와 트랙 (보완) | 3:1 | 3.93:1 (현재 `#e5e5e5`), 4.16:1 (목표 `#ebebeb`) |
| on-primary on foreground, 선택 상태 (보완) | 4.5:1 | 21:1 |
| muted on surface | 4.5:1 | **4.36:1 (미달)** |

surface 위 본문 크기 텍스트에는 color.muted 대신 color.foreground를 쓴다.

### CSS 변수

```css
:root {
  --color-canvas: #ffffff;
  --color-surface: #f5f3f1;
  --color-foreground: #000000;
  --color-muted: #777169;
  --color-hairline: #ebebeb;
  --color-on-primary: #ffffff;
  --color-accent: #2f5d46;
  --color-on-accent: #ffffff;
  --color-data: #4e7963;
  --color-on-data: #ffffff;
  --color-status-danger: #b23b3b;
  --color-status-warning: #8a6a3c;
  --color-status-info: #43596b;
}
```

코드 정의는 `frontend/src/design-system/tokens.css`다. 간격·모서리·그림자·서체·상호작용 변수도 같은 파일에 있다. 목표 값과 다른 현재 값은 부록 B에 있다.

## 3. Typography Rules

### 서체

| 서체 | 용도 | 불러오는 곳 | 라이선스 |
|---|---|---|---|
| Pretendard Variable | 제목, 본문, 컨트롤 | jsDelivr `orioncactus/pretendard@v1.3.9` dynamic subset | OFL-1.1 (계약 확인) |
| JetBrains Mono | 숫자, 시간, 화면 ID | Google Fonts, `wght@400;500;600` | OFL-1.1 (계약 확인) |

- 대체 스택(코드): `'Pretendard Variable', 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif`, `'JetBrains Mono', ui-monospace, monospace`
- Google Fonts 대체안: Pretendard는 Google Fonts에 없다. jsDelivr를 쓸 수 없는 환경에서만 Google Fonts의 Noto Sans KR로 바꾼다. JetBrains Mono는 이미 Google Fonts에서 불러온다.

### 타입 스케일 (계약)

| 역할 | 용도 | 서체 | 크기 | 굵기 | 행간 | 자간 |
|---|---|---|---|---|---|---|
| display | 페이지 타이틀, 히어로 헤드라인 | Pretendard Variable | 40–56px | 300 | 1.15 | -0.02em |
| heading | 섹션 제목, 카드 타이틀 | Pretendard Variable | 18–24px | 600 | 1.3 | -0.01em |
| body | 본문, 리스트, 설명 | Pretendard Variable | 14–15px | 400 | 1.6 | 0 |
| control | 버튼, 입력 라벨, 컨트롤 | Pretendard Variable | 13px | 500 | 1 | 0 |
| figure | 통계 수치, D-Day, 타임스탬프 | JetBrains Mono | 28–40px | 500 | 1 | -0.01em |

### 규칙

- 위계는 굵기와 크기를 함께 바꿔 만든다. display는 300의 큰 글자, body는 400의 작은 글자로 둔다. 같은 크기에서 굵기만 바꿔 위계를 만들지 않는다. (계약)
- 통계·D-Day·타임스탬프 숫자는 항상 figure 역할로 표기한다. 작은 시간 표기에도 JetBrains Mono와 `font-variant-numeric: tabular-nums`를 쓴다. (계약, 코드)
- 음수 자간은 display와 heading에만 준다. body와 control은 0을 유지한다. (계약)
- 모노 서체는 숫자·시간·ID 같은 구조 신호에만 쓰고 문단에는 쓰지 않는다. (Figma)
- 섹션 위 작은 안내 라벨(`.eyebrow`)은 12px, 굵기 600, 대문자, 양수 자간 0.04em을 쓴다. (코드)
- 글자 크기는 rem으로 지정한다. 앱의 글자 크기 설정이 `:root` font-size를 93.75%(작게)·112.5%(크게)로 바꾸기 때문이다. (코드 `typography.css`)
- 한국어 제목에는 `word-break: keep-all`을 쓴다. (코드)
- 역할별 굵기·행간·자간은 `--type-{역할}-weight`·`-leading`·`-tracking` 변수로 쓴다. 크기가 하나로 정해진 body·control은 `--type-body-size`·`--type-control-size`를, 도움말 같은 12px 글자는 `--type-caption-size`를 쓴다. 범위로 정한 display·heading·figure 크기는 화면에서 범위 안의 값을 고른다. (보완)

## 4. Component Stylings

### 공통 규칙

- 모든 interactive 컴포넌트는 `:focus-visible`에서 color.accent 2px 실선 아웃라인, 오프셋 2px을 표시한다. (계약, 코드)
- color.accent는 button-primary 포커스와 input-field 포커스 외에는 컴포넌트 배경색으로 쓰지 않는다. (계약) 선택·켜짐 상태는 foreground로, 기록·달성 데이터는 color.data로 채운다. (2장 색 역할 나눔, 보완)
- 색·테두리·배경 전환은 0.15s로 한다. `prefers-reduced-motion: reduce`에서는 전환·애니메이션 시간을 0으로 만든다. (코드)
- 계약에 상태가 있지만 값이 없던 hover·disabled·loading과 빈 상태는 2026-11-18에 아래 세 원칙으로 채우고 `보완`으로 표기했다. 원칙으로 정할 수 없는 값은 여전히 "미정"으로 두고 그럴듯한 기본값으로 채우지 않는다.
  - hover는 테두리나 배경을 한 단계만 진하게 바꾼다. 버튼·아이콘 버튼은 테두리를 foreground로, 입력은 muted로, surface 위 항목은 canvas 배경으로 바꾼다. 위치 이동은 button-primary에만 쓴다. 기존 규칙(보조 버튼·아이콘 버튼 hover의 테두리 변화, nav-item hover의 배경 변화)을 컴포넌트 강도에 맞춰 넓힌 것이다.
  - disabled는 모든 컨트롤에서 불투명도 0.45(`--opacity-disabled`)와 `cursor: not-allowed`로 같게 표현하고 hover 변화를 없앤다. button-primary의 기존 값을 그대로 넓혔다. 비활성 컨트롤은 대비 기준(WCAG 2.1 1.4.3)의 예외지만, 왜 쓸 수 없는지는 근처 문구로 알린다.
  - loading은 회전 표시 같은 장식 모션 없이 라벨을 "저장하는 중"처럼 진행형 문구로 바꾸고 `aria-busy="true"`와 `progress` 커서로 표현한다. 크기·대비·그림자는 그대로 둔다. 동작 줄이기 설정과 관계없이 같은 정보를 주고, 화면낭독기에도 라벨 변화로 전달된다. 요청이 끝날 때까지 다시 누른 입력은 처리하지 않는다.

### 코드 클래스

공통 클래스는 `frontend/src/design-system/components.css`에, 기존 클래스는 `styles.css`에 있다. "기존 화면 클래스"는 아직 이 문서와 값이 다르며 부록 B 순서로 공통 클래스에 옮긴다.

| 컴포넌트 | 공통 클래스 | 기존 화면 클래스 |
|---|---|---|
| button-primary | `.primary` | 같음 |
| button-secondary | `.button-secondary` | `.modal-secondary` |
| icon-button | `.icon-button` | `.icon` |
| input-field | `.input-field`, `.input-field-help` | `.detail label`, `.modal-card input` 등 |
| segmented-tab | `.segmented-tab` | `.tabs`, `.filter`, `.compose-tabs` |
| surface-card | `.card` | 같음 |
| status-badge | `.tag` | `.state`, `.ok`, `.warn`, `.danger`, `.info` |
| empty-state | `.empty-state` | 같음. 2026-11-18 빈 목록 문구 44곳을 옮겼다. 멤버 칩 줄 안의 인라인 문구 1곳만 `.form-note` |

### button-primary (계약)

화면당 가장 중요한 단일 행동에만 쓰는 검정 pill 버튼이다.

| 속성 | 값 |
|---|---|
| 배경 / 텍스트 | color.foreground / color.on-primary |
| 모서리 | radius.full |
| 여백 / 최소 높이 | 11px 18px / 40px (코드) |
| 그림자 | shadow.raised |

| 상태 | 표현 |
|---|---|
| default | 위 표 |
| hover | 위로 1px 이동. 그림자는 shadow 토큰 안에서만 바꾼다. |
| focus-visible | accent 2px 아웃라인 |
| disabled | 불투명도 0.45, 이동·그림자 없음 (코드) |
| loading | 라벨을 진행형 문구로 바꾸고 `aria-busy="true"`, `progress` 커서. hover 이동 없음, shadow.raised 유지 (보완) |
| error / success | 해당 없음. 오류는 입력 필드, 성공은 토스트·배지로 표현한다. (계약) |

### button-secondary (계약 역할 + Figma outline-action 형태)

보조 행동용 아웃라인 버튼이다. color.accent는 쓰지 않는다.

| 속성 | 값 |
|---|---|
| 배경 / 텍스트 | color.canvas(Figma는 투명) / color.foreground |
| 테두리 | 1px color.hairline |
| 모서리 | radius.control (8px, Figma) |
| 여백 / 최소 높이 | button-primary와 같게 11px 18px / 40px |

| 상태 | 표현 |
|---|---|
| hover | 테두리를 color.foreground로 바꾼다. |
| focus-visible | accent 2px 아웃라인 |
| disabled | button-primary와 같은 0.45 불투명도, 테두리는 hairline으로 고정 (보완) |
| loading | button-primary와 같다. 테두리는 hairline으로 고정 (보완) |
| error / success | 해당 없음 (계약) |

### icon-button (Figma round-icon 형태)

헤더 액션처럼 아이콘만 있는 버튼이다.

| 속성 | 값 |
|---|---|
| 크기 / 모서리 | 40×40px / radius.full (Figma 40px 원형) |
| 배경 / 아이콘 | color.canvas / color.foreground |
| 테두리 | 1px color.hairline |
| hover | 테두리를 color.foreground로 바꾼다. (코드 `.icon:hover`) |
| focus-visible | accent 2px 아웃라인 (계약 공통 규칙) |
| disabled | 0.45 불투명도, 테두리는 hairline으로 고정 (보완) |
| 접근성 | 보이는 라벨이 없으므로 `aria-label`로 이름을 준다. |

Figma의 검정 채움 원형 버튼은 button-primary와 시선을 다투므로 쓰지 않는다.

### input-field (계약)

텍스트·선택·여러 줄 입력의 공통 스타일이다. Figma 레퍼런스는 입력 컴포넌트 근거가 없어 계약과 코드 값만 쓴다.

| 속성 | 값 |
|---|---|
| 구조 | label, control, helper-text |
| 배경 / 테두리 | color.canvas / 1px color.hairline |
| 모서리 / 여백 | radius.sm / 9px (코드) |
| 라벨 | 13px, 굵기 600 (코드 `.detail label`) |

| 상태 | 표현 |
|---|---|
| hover | 테두리를 color.muted로 바꾼다. 버튼(foreground)보다 한 단계 약하게 둬서 포커스(accent)와 구분한다. 포커스 중에는 바꾸지 않는다. (보완) |
| focus-visible | accent 2px 아웃라인 |
| disabled | 0.45 불투명도, `cursor: not-allowed` (보완) |
| error | helper-text를 color.status-danger, 굵기 600으로 표시한다. (코드 공유 동의 모달) 컨트롤에 `aria-invalid="true"`를 주고 helper-text를 `aria-describedby`로 연결한다. (보완) |
| success | helper-text를 color.accent, 굵기 600으로 표시한다. error와 같은 형식이고 상태 색 표의 성공 표시(accent)를 따른다. (보완) |
| loading | 해당 없음 (계약) |

- helper-text는 12px(`--type-caption-size`), 굵기 400, color.muted다. 오류·성공일 때는 색과 함께 문구도 바꿔 색만으로 알리지 않는다. (보완)
- 테두리 색으로 오류를 표시하지 않는다. 상태 색은 좁은 면적의 글자에만 쓴다는 2장 규칙을 따른다. (보완)

체크박스·라디오는 17px 원형 테두리(1.5px hairline)를 쓰고, 선택하면 foreground로 채우고 안쪽에 4px canvas 링을 둔다. 네이티브 체크박스는 `accent-color`를 foreground로 둔다. (코드 `.task input`, 2026-11-18 accent에서 바꿈, 보완)

### segmented-tab (Figma product-segment 형태 + 코드 색)

필터·보기 전환·작성 유형 전환에 쓴다(`.tabs`, `.filter`, `.compose-tabs`).

| 속성 | 값 |
|---|---|
| 컨테이너 | color.surface 배경, 안쪽 여백 3–4px, radius.full (Figma pill) |
| 항목 | 최소 높이 32px, radius.full (코드 높이, Figma 형태) |
| 선택 항목 | color.foreground 배경, color.on-primary 텍스트, 굵기 600 (코드) |
| 비선택 항목 | color.foreground 텍스트 (surface 위 muted 대비 미달 때문) |
| 비선택 hover | color.canvas 배경. surface 위 항목을 한 단계 올린다. (보완) |
| focus-visible | accent 2px 아웃라인 (계약 공통 규칙) |
| disabled | 0.45 불투명도, `cursor: not-allowed` (보완) |

선택 상태는 탭 역할이면 `aria-selected`, 토글 버튼이면 `aria-pressed`로 표시한다. 좁은 화면에서는 가로 스크롤 대신 줄을 바꾼다. (보완)

### nav-item (계약)

LNB 내비게이션 항목이다. 활성 상태는 surface 배경과 foreground 텍스트로만 표현하고 accent는 쓰지 않는다.

| 속성 | 값 |
|---|---|
| 구조 | icon, label |
| 높이 / 여백 / 간격 | 40px / 0 11px / 13px (코드) |
| 모서리 | radius.md (계약) |
| 기본 | color.muted 텍스트, 14px |
| hover | color.surface 배경, color.foreground 텍스트 (코드) |
| active | color.surface 배경, color.foreground 텍스트, 굵기 600 |
| focus-visible | accent 2px 아웃라인 |

### surface-card (계약)

정보를 묶는 정적 컨테이너다. 자체 클릭 대상이 아니며 안쪽 요소가 상호작용을 맡는다.

| 속성 | 값 |
|---|---|
| 구조 | header(선택), body, footer(선택) |
| 배경 / 테두리 | color.canvas / 1px color.hairline |
| 모서리 / 그림자 | radius.lg / shadow.card |
| 여백 | 20px (코드 `.card`) |

같은 크기로 반복 배치하지 않고 콘텐츠 비중에 따라 폭을 달리한다.

### time-block (코드)

플래너 타임라인에서 계획과 실제 기록을 구분하는 블록이다. Timebar Diary의 핵심 시각 언어다.

| 종류 | 표현 |
|---|---|
| 계획(Plan) | canvas 배경, 1px **점선** color.muted 테두리, muted 텍스트 (`.plan`) |
| 실제 기록(Actual) | canvas 배경, 1px hairline 테두리, 왼쪽 3px 콘텐츠 색 띠 (`.block`) |
| 공통 | radius.sm, 여백 6px 8px, 12px 텍스트, 제목만 13px 굵게 |

### status-badge (코드)

`.tag`, `.state`, `.ok`, `.warn`, `.danger`, `.info`에 해당한다.

| 속성 | 값 |
|---|---|
| 배경 | color.surface |
| 텍스트 | 기본 color.foreground, 상태별로 상태 색 |
| 크기 / 여백 / 모서리 | 12px / 4px 7px / radius.sm |

### empty-state (코드 클래스 + 보완)

목록·카드·검색 결과가 비었을 때 쓴다. 코드에 `.empty-state` 클래스가 있었지만 규칙이 없어 2026-11-18에 정했다. 기존 빈 목록 문구(`.form-note`)의 톤을 따른다.

| 속성 | 값 |
|---|---|
| 구조 | 문구(필수), 행동(선택, button-secondary 하나) |
| 글자 | body 크기, color.muted. surface 위에서는 color.foreground (2장 대비 규칙) |
| 여백 | 위아래 space.xxl, 행동 버튼 위 space.lg. 목록 시작선에 맞춰 왼쪽 정렬 |
| 장식 | 이모지·일러스트·아이콘 타일을 쓰지 않는다. (7장 Don't) |

- 문구는 무엇이 비었는지를 먼저, 할 수 있는 다음 행동을 뒤에 쓴다. 예: "오늘 예정된 루틴이 없어요. 새 루틴을 만들어 보세요."
- 비어 있음을 실패처럼 말하지 않는다. "기록 실패", "아무것도 하지 않았어요" 대신 "아직 남긴 기록이 없어요"를 쓴다. (계약 문구 규칙)
- 행동은 화면의 주 액션과 겹치지 않게 button-secondary로 둔다. 주 액션(button-primary)이 이미 화면에 있으면 행동을 생략한다.
- 검색·필터 결과로 비었으면 `role="status"`로 결과 변화를 알린다.

### modal (코드 구조 + Figma 그림자)

작성 모달(composer)과 확인 대화상자에 쓴다.

| 속성 | 값 |
|---|---|
| 배경막 | `rgba(0,0,0,.4)` (코드 `.backdrop`) |
| 패널 | color.canvas, radius.lg, 여백 24px |
| 폭 | `min(420px, calc(100vw - 32px))` (코드 `.composer`) |
| 그림자 | shadow.overlay (Figma panel) |
| 주 액션 | 패널 폭 전체를 쓰는 button-primary |

## 5. Layout Principles

### 간격 스케일 (계약)

| 토큰 | 값 | 용도 |
|---|---|---|
| space.xs | 4px | 최소 간격 |
| space.sm | 6px | 컨트롤 안 간격 |
| space.md | 8px | 컨트롤 사이 간격 |
| space.lg | 12px | 컨트롤·컨테이너 간격 |
| space.xl | 16px | 카드 사이 간격 |
| space.xxl | 20px | 카드 안쪽 여백 |
| space.gutter | 48px | 페이지 좌우 거터 |
| space.section | 96px | 섹션 사이 수직 여백, 페이지 상단 여백 |

### 모서리 스케일

| 토큰 | 값 | 용도 | 출처 |
|---|---|---|---|
| radius.sm | 4px | 입력, 배지, 시간 블록 | 계약 |
| radius.control | 8px | button-secondary | Figma |
| radius.md | 12px | nav-item, 선택형 카드 | 계약 |
| radius.lg | 16px | surface-card, 모달 | 계약 |
| radius.full | 9999px | button-primary, icon-button, segmented-tab, 아바타 | 계약 |

### 그리드

- 데스크톱 콘텐츠 최대폭은 1180px로 제한하고, 그보다 넓으면 좌우 여백을 늘린다. (계약)
- 사이드바(LNB)는 244px로 고정한다. LNB와 메인 영역은 각각 따로 스크롤한다. (계약, 코드)
- 메인 영역 기본 여백은 위아래 space.section, 좌우 space.gutter다. (코드)
- 열 폭은 콘텐츠 비중에 따라 다르게 준다. 현재 코드의 비율은 다음과 같다.

| 화면 | 열 구성 |
|---|---|
| 홈 3단 | `1.1fr 1fr .7fr` |
| 플래너 | `1.2fr .8fr` |
| 목록 + 상세 | `1fr 300px` |
| 다이어리 | `1fr 290px` |
| 설정 | `280px 1fr` |
| 통계 | `1.3fr .7fr` |

- 홈 포틀릿은 크기 단계(`w-sm`, `w-md`, `w-lg`)가 있는 위젯 그리드로 배치한다. (코드)

### 여백 리듬

- 컨테이너를 늘리기 전에 글자 크기와 여백으로 먼저 구분한다. (Figma)
- 섹션 사이는 space.section, 카드 사이는 space.xl, 카드 안쪽은 space.xxl을 기본으로 한다.
- 목록 행은 위아래 14px 여백과 hairline 구분선으로 나눈다. (코드 `.event`, `.task`)

## 6. Depth & Elevation

### 표면 위계

| 단계 | 표면 | 표현 |
|---|---|---|
| 0 | 페이지 | color.canvas, 그림자 없음 |
| 1 | 구획 | color.surface, 그림자 없음. 배경색 차이로만 구분한다. |
| 2 | 카드 | color.canvas + 1px hairline + shadow.card |
| 3 | 주 액션 | button-primary + shadow.raised |
| 4 | 오버레이 | 배경막 `rgba(0,0,0,.4)` + 패널 + shadow.overlay |

### 그림자 토큰

| 토큰 | 값 | 용도 | 출처 |
|---|---|---|---|
| shadow.card | `0px 2px 4px rgba(0,0,0,0.04), 0px 0px 1.143px rgba(0,0,0,0.4)` | surface-card | 계약 |
| shadow.raised | `0px 0px 1px rgba(0,0,0,0.4), 0px 1px 1px rgba(0,0,0,0.04), 0px 2px 4px rgba(0,0,0,0.04)` | button-primary | 계약 |
| shadow.overlay | `0 24px 70px rgba(0,0,0,0.1)` | 모달, 작성 패널 | Figma panel |

### 규칙

- 대부분의 크롬은 평평하게 둔다. 그림자는 위 세 토큰만 쓰고 진한 단일 그림자를 새로 만들지 않는다. (계약, Figma)
- shadow.overlay는 화면 위에 뜨는 패널에만 쓰고 일반 카드 그림자로 쓰지 않는다. (Figma)
- 배경은 canvas·surface 단색만 쓰고 그라데이션을 쓰지 않는다. (계약) 차트 도넛(`conic-gradient`)과 타임라인 격자선(`repeating-linear-gradient`)은 데이터 표현이라 배경 규칙과 별개다. (코드)

## 7. Do's and Don'ts

### Do

- 크롬은 canvas·surface·foreground·hairline으로 구성하고, 포인트 컬러는 화면에서 가장 중요한 요소 하나에만 쓴다.
- 선택·켜짐 상태는 foreground로, 진행 막대·차트·히트맵 같은 기록 데이터는 color.data로 칠한다.
- 계획은 점선, 실제 기록은 실선과 콘텐츠 색 띠로 구분한다.
- 숫자와 시간은 JetBrains Mono로 표기한다.
- 콘텐츠 비중에 따라 카드 폭과 높이를 달리한다.
- 새 화면도 실제 기록을 3탭 이내에 남길 수 있게 설계한다.
- 아이콘만 있는 버튼에는 `aria-label`을 준다.
- 핵심 동사를 문장 앞쪽에 두어 사용자가 할 행동을 분명히 한다. (계약)

### Don't

- 같은 크기 카드 격자를 기계적으로 반복하지 않는다. (계약)
- 블루·퍼플 그라데이션 배경을 쓰지 않는다. Figma 인디고(`#4d49fc`)도 쓰지 않는다. (계약)
- 한 화면에 강조색을 여러 개 쓰지 않는다. (계약)
- 장식용 이모지, 과한 그림자, 네온 색을 쓰지 않는다. (계약)
- 사용자 콘텐츠 색(카테고리 색)을 버튼·nav 같은 크롬에 쓰지 않는다. (Figma)
- 팔레트와 모서리 스케일 밖의 값을 새로 만들지 않는다. 필요하면 먼저 기존 토큰으로 표현할 수 있는지 검토한다. (계약)
- 계획 미완료를 빨간색, "실패" 같은 벌점 표현으로 보여주지 않는다. (계약)
- 로컬 시연 저장 화면을 서버 저장이 끝난 화면처럼 표현하지 않는다. AI·음성·결제·외부 캘린더 연동을 성공한 것처럼 표시하지 않는다. (CLAUDE.md)

### 문구

- 담백하고 절제된 안내형 문장을 쓴다. 과한 이모지와 느낌표를 쓰지 않는다. (계약)
- 실패·미완료는 "이월", "다음에"처럼 벌점 없는 말로 쓴다. (계약)
- 기본 로케일은 ko다. 모든 UI 문자열은 한국어를 1차 기준으로 한다. (계약)

| 용어 | 화면 표기 |
|---|---|
| Plan | 계획 |
| Actual | 실제 기록 |
| Event | 일정 |
| Task | 할 일 |
| Routine | 루틴 |
| Diary | 다이어리 |

## 8. Responsive Behavior

### 지원 범위 (계약)

- 최소 지원 폭은 320px이다.
- 200% 확대에서도 가로 스크롤 없이 다시 배치되어야 한다.
- 웹 반응형을 우선한다.

### 브레이크포인트 (코드)

| 폭 | 동작 |
|---|---|
| 1150px 초과 | 사이드바 244px + 메인 여백 96px/48px |
| 1150px 이하 | 메인 여백 30px 25px. 지표 2열, 홈 3단은 2열, 플래너·집중·목록 상세·다이어리·설정·통계는 1열. D-Day 카드와 상세·캘린더 보조 패널 숨김. 위젯 그리드 2열 |
| 1000px 이하 | 히어로를 세로로 쌓음. 루틴 표 머리행 숨김 |
| 860px 이하 | 통계 보드 1열 |
| 760px 이하 | LNB를 오프캔버스로 전환(왼쪽에서 0.2s 이동, 배경막 `rgba(0,0,0,.4)`), 햄버거 버튼 표시. 메인 여백 22px 15px. 페이지 제목 1.75rem·행간 1.3, 헤더 액션은 제목 아래 줄로 내림. 위젯 그리드 1열. 헤더 아이콘 버튼 숨김. 목록 표는 가로 스크롤. 입력 글자는 16px 이상 |
| 600px 이하 | 도움말 팝오버 용어 목록 1열 |
| 높이 600px 이하 | 사이드바 전체를 세로 스크롤 |

### 터치 타깃

- 주 컨트롤(button-primary, nav-item, 요일 선택)은 높이 40px이다. (코드)
- segmented-tab 항목은 최소 32px이다. (코드)
- 새 컨트롤은 높이 40px 이상을 기본으로 한다.

### 접힘 규칙

- 760px 미만에서는 LNB를 오프캔버스로 바꾸고 콘텐츠가 전체 폭을 쓴다. (계약)
- 섹션 여백 space.section은 좁은 화면에서만 줄인다. (계약)

## 9. Agent Prompt Guide

새 화면이나 컴포넌트를 만들 때 아래 프롬프트를 그대로 쓰거나 화면에 맞게 고쳐 쓴다.

### 기본 프롬프트

> Timebar Diary 화면을 만든다. 흰 캔버스(#ffffff)와 따뜻한 오프화이트 표면(#f5f3f1), 검정 텍스트와 검정 pill 주 액션을 쓰고, 포인트 컬러 #2f5d46은 화면에서 가장 중요한 요소 하나에만 쓴다. 테두리는 1px #ebebeb, 카드는 16px 모서리와 저알파 다단 그림자를 쓴다. 제목은 Pretendard Variable 300의 큰 글자, 본문은 400의 14–15px로 위계를 만들고, 숫자와 시간은 JetBrains Mono로 표기한다. 크롬은 모노톤으로 두고 색은 사용자의 카테고리 색이 갖게 한다. 체크·토글 같은 선택 상태는 검정으로, 진행 막대·차트·히트맵 같은 기록 데이터는 세이지 그린 #4e7963으로 칠한다. 카드 폭은 콘텐츠 비중에 따라 달리하고, 섹션 사이에는 96px 여백을 둔다. 모든 컨트롤은 :focus-visible에서 #2f5d46 2px 아웃라인을 보이고, 760px 미만에서는 사이드바를 오프캔버스로 바꾼다.

### 화면 유형별 프롬프트

| 화면 | 프롬프트 |
|---|---|
| 홈 | 오늘 → 이번 주 → 과거 순으로 위계를 둔다. 히어로에 오늘의 핵심 문장 하나를 display로 두고, 지표는 figure 숫자로, 일정·루틴·D-Day는 폭이 다른 카드로 배치한다. 포인트 컬러는 "실제 기록 남기기" 하나에만 쓴다. |
| 플래너 | 왼쪽에 시간 눈금(JetBrains Mono), 오른쪽에 time-block을 둔다. 계획은 점선 muted 블록, 실제 기록은 실선 블록과 왼쪽 3px 카테고리 색 띠로 구분한다. 계획 미완료는 벌점 색으로 칠하지 않는다. |
| 작성 모달 | modal 패턴을 쓴다. 상단에 segmented-tab으로 일정·할 일·루틴·다이어리를 전환하고, input-field를 한 열로 쌓고, 패널 폭 전체 button-primary 하나로 저장한다. |
| 목록 + 상세 | `1fr 300px` 2단으로 두고, 목록 행은 hairline 구분선과 14px 위아래 여백을 쓴다. 상태는 status-badge로 표시한다. 1150px 이하에서는 상세 패널을 숨긴다. |
| 통계 | 큰 수치는 figure 역할로, 비교 막대는 계획 hairline 색과 실제 color.data 색으로 그린다. 카테고리 비중은 사용자 콘텐츠 색을 쓴다. |

### 생성 전 점검

- [ ] 팔레트(2장)와 모서리 스케일(5장) 밖의 값을 쓰지 않았다.
- [ ] 포인트 컬러가 화면에 하나만 있다. 선택 상태와 데이터 표시에 accent를 쓰지 않았다.
- [ ] 숫자·시간이 JetBrains Mono로 표기되었다.
- [ ] surface 위 본문 크기 텍스트에 color.muted를 쓰지 않았다.
- [ ] 모든 interactive 요소에 accent 2px 포커스 아웃라인이 보인다.
- [ ] 아이콘만 있는 버튼에 `aria-label`이 있다.
- [ ] 320px 폭과 200% 확대에서 가로 스크롤이 생기지 않는다.
- [ ] 계획 미완료를 벌점처럼 표현하지 않았다.
- [ ] hover·disabled·loading이 4장 공통 원칙과 같고, 비어 있는 목록에 empty-state가 있다.
- [ ] 새 스타일이 `design-system/tokens.css` 변수를 쓰고 색 코드를 직접 쓰지 않았다.

## 부록 A. 문서 관리

### 적용 우선순위 (계약)

1. 요청 범위에 대한 사용자의 직접 지시
2. 저장소 사실
3. 이 디자인 계약
4. 레퍼런스 영감

### 프로젝트 우선순위 (계약)

1. 접근성
2. 일관성
3. 심미성
4. 성능

### 변경 규칙

- 새 토큰을 추가하기 전에 기존 토큰으로 표현할 수 있는지 먼저 검토한다. (계약)
- 정하지 못한 값은 가장 작은 단위만 "미정"으로 남기고, 그럴듯한 기본값으로 채우지 않는다. (계약)
- 변경은 기록하고 검토한 뒤 채택한다. (계약)

### 코드 위치

| 파일 | 내용 |
|---|---|
| `frontend/src/design-system/tokens.css` | 2~6장 토큰과 근거 주석. 화면 밀도 설정의 간격 덮어쓰기 |
| `frontend/src/design-system/components.css` | 4장 공통 클래스와 상태. 토큰만 쓴다 |
| `frontend/src/main.js` | 토큰을 가장 먼저, 공통 클래스를 가장 나중에 불러온다 |
| `frontend/tests/design-tokens.test.mjs` | 이 문서와 tokens.css 값 일치, 부록 B 예외, 공통 클래스의 토큰 사용을 검사한다 |

### 변경 기록

| 날짜 | 내용 |
|---|---|
| 2026-11-18 | 9장 형식으로 재작성 |
| 2026-11-18 | 4장 hover·disabled·loading 원칙과 빈 상태(empty-state) 보완, 코드 클래스 표·코드 위치 추가, 부록 B 갱신 |
| 2026-11-18 | 2장 color.data·color.on-data와 색 역할 나눔 추가. 체크박스 선택 색을 accent에서 foreground로 바꿔 4장 안의 충돌을 없앰. 부록 B의 accent 배경 사용 항목 해소 |
| 2026-11-18 | 빈 목록 44곳을 empty-state로 통일. 상태 표시의 hex를 상태 색 변수로 바꾸고 콘텐츠 색과 구분하는 규칙 추가, 부록 B의 상태 색 변수 항목 해소 |

### omd 시스템 그래프 상태

`.omd/system/graph.json`과 `manifest.json`은 이전 7장 형식 DESIGN.md를 기준으로 해시가 묶여 있다. 이번 9장 형식으로 바꾸면서 해시가 맞지 않게 되었으므로, omd 도구는 그래프 대신 이 DESIGN.md를 기준으로 읽는다. 그래프를 다시 기준으로 쓰려면 omd 워크플로로 다시 채택해야 한다.

## 부록 B. 현재 코드와의 차이

이 문서의 목표 값과 2026-11-18 기준 `frontend/src` 값이 다른 항목이다. 토큰 파일과 공통 클래스는 만들었지만 화면 모양은 아직 바꾸지 않았다. 맞추는 순서는 [개발 문서 06의 IM-11](docs/dev-docs/06-구현-방안.md#im-11-디자인-기준-단일화)을 따른다. 항목을 맞추면 이 표와 `design-tokens.test.mjs`의 예외 목록에서 함께 지운다.

| 항목 | 이 문서 | 현재 코드 | 위치 |
|---|---|---|---|
| color.hairline | `#ebebeb` (Figma) | `#e5e5e5` | `design-system/tokens.css` |
| shadow.card | `0px 2px 4px rgba(0,0,0,0.04), 0px 0px 1.143px rgba(0,0,0,0.4)` | `0px 2px 4px rgba(0,0,0,.04), 0px 1px 1px rgba(0,0,0,.05)` | `design-system/tokens.css` |
| shadow.raised | `0px 0px 1px rgba(0,0,0,0.4), …` | `0px 1px 1px rgba(0,0,0,.16), …` | `design-system/tokens.css` |
| shadow.overlay | `var(--shadow-overlay)` 사용 | 변수는 정의됨. 사용처는 `0 22px 70px rgba(0,0,0,.2)`, `0 22px 60px rgba(0,0,0,.14)` | `.composer`, `.modal-preview` |
| button-primary hover | shadow 토큰 안에서 변경 | `0 6px 18px rgba(0,0,0,.16)` | `.primary:hover` |
| control 글자 | 13px / 500 | 14px / 600 | `.primary` |
| display 행간 | 1.15 | 1.2 | `typography.css` |
| button-secondary | `.button-secondary` (radius.control 8px, 13px/500) | 화면은 `.modal-secondary` (radius.full, 13px/400, 여백 10px 18px) | `components/Modal.vue` |
| icon-button | `.icon-button` 40px 원형 | 화면은 `.icon` 37px, radius.sm | `.icon` |
| segmented-tab | `.segmented-tab` radius.full, 비선택 foreground | 화면은 radius.sm·radius.md, 비선택 muted | `.tabs`, `.filter`, `.compose-tabs` |
| nav-item 모서리 | radius.md | radius.sm | `nav button` |
| 콘텐츠 최대폭 | 1180px | 주석 처리됨 | `main` |
| 선택 테두리의 accent | 2장 색 역할 나눔에 따라 정리 여부 결정 | 선택한 카드·옵션·날짜 테두리, 태그 hover 테두리에 accent | `.mode.selected`, `.policy-row button.selected`, `.confirm-option.selected`, `.tag-chip:hover`, `.cal-cell.selected` |
| muted on surface | 사용 금지 (4.36:1) | 사용 중 | `.workspace small`, `.filter button`, `.phase-badge` 등 |
| 모서리 스케일 밖 값 | 사용 금지 | 2px·3px 사용 | `.omd/preferences.md` pending 항목 |
