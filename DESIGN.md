---
version: alpha
name: Timebar Diary
description: >-
  A calm, precise time-planning workspace that helps people compare what they planned
  with what they actually did. A warm paper-neutral canvas, deep readable ink, and
  one user-selected nature-inspired accent create a focused interface. Information
  hierarchy comes from spacing, typography, and alignment rather than decorative
  gradients, excessive cards, or loud color.
colors:
  primary: "#2F5D46"
  primary-hover: "#254A38"
  on-primary: "#FFFFFF"
  ink: "#242721"
  body: "#41463F"
  muted: "#62675F"
  canvas: "#FAF9F6"
  surface-soft: "#F3F0E9"
  surface-card: "#FFFFFF"
  hairline: "#E1DDD4"
  control-border: "#767B72"
  focus: "#2F5D46"
  data: "#4E7963"
  on-data: "#FFFFFF"
  success: "#356B49"
  warning: "#815E26"
  error: "#A83F3A"
  info: "#3C617B"
typography:
  display-lg:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: 36px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.8px
  display-md:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: 30px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.6px
  title-lg:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: 22px
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: -0.3px
  title-md:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: -0.2px
  body-md:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0
  body-sm:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0
  caption:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.45
    letterSpacing: 0
  button:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0
  time:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
rounded:
  xs: 4px
  sm: 8px
  md: 10px
  lg: 14px
  xl: 18px
  pill: 9999px
spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  section: 64px
components:
  app-shell:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
  sidebar:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.body}"
    padding: "{spacing.md}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm} {spacing.lg}"
    height: 42px
  button-secondary:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm} {spacing.lg}"
    height: 42px
  icon-button:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    size: 40px
  text-input:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm} {spacing.md}"
    height: 44px
  content-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  segmented-control:
    backgroundColor: "{colors.surface-soft}"
    textColor: "{colors.body}"
    typography: "{typography.button}"
    rounded: "{rounded.md}"
    padding: "{spacing.xxs}"
  theme-option-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
  time-block-plan:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.body}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.sm}"
  time-block-actual:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.sm}"
---

# Timebar Diary Design System

## 1. Overview

### Product and design intent

Timebar Diary(저장소 이름 `vue-timeflow`)는 계획(Plan)과 실제 기록(Actual)을 같은 시간축에서 비교하는 기반 위에, 업무·학습·프로젝트 활동을 경력·지원 문서·포트폴리오로 이어 가는 통합 커리어 관리 서비스로 확장 중이다(제품 방향은 [docs/design](docs/design/README.md) v2.1). 개인 사용 화면은 메인, 커리어, 플래너, 업무·프로젝트, 기록, 인사이트, 소셜 영역으로 구성된다. 운영·관리 화면은 사용자 화면과 별도 정보 구조를 유지한다.

핵심 사용자 작업은 다음 네 가지다.

1. 오늘의 일정과 할 일을 빠르게 파악한다.
2. 계획한 시간과 실제로 사용한 시간을 비교한다.
3. 작성 흐름을 끊지 않고 일정·할 일·루틴·다이어리 기록을 남긴다.
4. 지난 기록과 통계를 부담 없이 되돌아본다.

사용자는 J/P/B 모드와 글양식·포틀릿 구성을 선택할 수 있다. 새 UI는 이 개인화 구조를 존중하고, 화면마다 별도의 시각 언어를 만들지 않는다.

### Atmosphere

**따뜻하고 정돈된 작업 공간**을 기본 분위기로 삼는다. 종이처럼 미세하게 따뜻한 배경, 읽기 쉬운 짙은 잉크색, 얇고 선명한 경계, 안정적인 녹색 계열의 기본 포인트를 사용한다. 차분하지만 밋밋하지 않고, 생산적이지만 차갑지 않은 인상을 목표로 한다.

Claude 또는 다른 서비스의 화면을 그대로 복제하지 않는다. 참고 사이트에서 가져오는 것은 토큰과 근거를 함께 문서화하는 방식, 따뜻한 뉴트럴 표면, 절제된 타이포그래피, 일관된 컴포넌트 규칙이다. Timebar Diary의 색상·로고·정보 구조는 독자적으로 유지한다.

### Key characteristics

- 기본 테마는 **라이트 + 포레스트**다.
- 기본 캔버스는 순백 대신 따뜻한 오프화이트를 사용하고, 카드 표면은 흰색으로 분리한다.
- 주 액션, 선택 상태, 포커스, 데이터 시각화는 서로 다른 역할 토큰을 사용한다.
- 화면의 우선순위는 색보다 정보 구조·크기·간격·정렬로 전달한다.
- Plan은 점선, Actual은 실선과 시간 정보로 구분한다. 색만으로 두 상태를 구별하지 않는다.
- 카드 수를 늘려 화면을 채우지 않는다. 실제 콘텐츠와 작업 흐름에 필요한 영역만 묶는다.
- 320px 화면과 200% 확대에서도 핵심 흐름을 유지한다.

### Product principles

| 원칙 | 실제 적용 |
|---|---|
| 기록 우선 | 실제 기록은 주요 흐름에서 3번의 탭/클릭 이내에 시작할 수 있어야 한다. |
| 비난하지 않는 피드백 | 계획 미완료를 빨간색, 실패 아이콘, 벌점 문구로 표시하지 않는다. |
| 시간 정보의 명료성 | 오늘 → 이번 주 → 과거 순서로 시간 범위를 구분한다. |
| 한 화면 한 가지 주목점 | 가장 중요한 행동 또는 데이터 하나만 강하게 강조한다. |
| 일관성 | 동일한 역할의 버튼·입력·탭·상태는 서비스 전역에서 같은 규칙을 따른다. |
| 신뢰 | 로컬 시연 저장이나 미연결 기능을 서버 저장·실제 연동처럼 표현하지 않는다. |

## 2. Colors

### Default palette

아래 값은 문서의 **목표 디자인 토큰**이다. 실제 UI 코드에 반영되었다고 간주하지 않는다. UI 구현 전 `frontend/src/design-system/tokens.css`와 `frontend/src/utils/colorTheme.mjs`의 실제 값을 확인하고, 변경이 필요하면 코드·테스트·이 문서를 함께 맞춘다.

| 역할 | 토큰 / CSS 변수 | 기본값 | 사용 위치 |
|---|---|---:|---|
| Primary | `--color-accent` | `#2F5D46` | 가장 중요한 CTA, 링크, 포커스 링, 선택 표시의 핵심 신호 |
| Primary hover | `--color-accent-hover` | `#254A38` | 주 버튼 hover/pressed |
| On primary | `--color-on-accent` | `#FFFFFF` | 기본 주 버튼 텍스트·아이콘 |
| Canvas | `--color-canvas` | `#FAF9F6` | 앱 전체 배경 |
| Surface | `--color-surface` | `#F3F0E9` | 사이드바, 구획, 세그먼트 컨테이너 |
| Card | `--color-card` | `#FFFFFF` | 입력, 카드, 팝오버, 모달 패널 |
| Foreground | `--color-foreground` | `#242721` | 제목과 본문 기본 텍스트 |
| Body | `--color-body` | `#41463F` | 설명·보조 본문 |
| Muted | `--color-muted` | `#62675F` | 캡션, 보조 메타데이터, 비활성 텍스트 |
| Hairline | `--color-hairline` | `#E1DDD4` | 장식성 구분선과 카드 외곽선 |
| Control border | `--color-control-border` | `#767B72` | 입력 등 조작 가능한 컨트롤의 외곽선 |
| Data | `--color-data` | `#4E7963` | 실제 기록, 진행, 차트, 히트맵 |
| On data | `--color-on-data` | `#FFFFFF` | 데이터 색 위 텍스트가 필요한 경우 |
| Success | `--color-status-success` | `#356B49` | 저장 완료, 연결 성공 등 성공 상태 |
| Warning | `--color-status-warning` | `#815E26` | 주의가 필요한 상태 |
| Danger | `--color-status-danger` | `#A83F3A` | 오류, 위험, 초과 상태 |
| Info | `--color-status-info` | `#3C617B` | 정보·도움말 상태 |

기존 코드 호환을 위해 `--color-foreground`, `--color-surface`, `--color-accent`, `--color-on-accent`, `--color-on-primary`, `--color-data`, `--color-on-data`, `--color-status-*` 이름을 우선 유지한다. `colors.on-primary`는 신규 주 버튼의 `--color-on-accent`와 같은 값으로 사용하고, 구형 `--color-on-primary`는 마이그레이션 동안 호환 alias로 남긴다. 새 변수는 기존 변수의 실제 사용처를 검색한 뒤 점진적으로 추가한다. 토큰 이름을 한 번에 바꾸는 대규모 치환은 하지 않는다.

### Color roles

| 역할 | 사용 규칙 | 사용하지 말아야 할 곳 |
|---|---|---|
| Primary / accent | 화면에서 가장 중요한 CTA, 링크, 포커스, 현재 선택을 알아보게 하는 작은 신호 | 모든 카드의 테두리, 모든 아이콘, 넓은 배경 장식 |
| Surface | 페이지 영역과 보조 구획을 나누는 배경 단계 | 상태 의미를 나타내는 유일한 수단 |
| Neutral text | 제목·본문·설명 등 정보 전달 | 장식용 색상 블록 |
| Data | 기록량·달성도·실제 시간 등 수치와 데이터 | 일반 버튼이나 내비게이션 |
| Semantic status | 성공·주의·오류·정보를 일관되게 전달 | 카테고리 및 사용자 콘텐츠 색 |
| Content color | 사용자 카테고리·템플릿·일정의 구분 | 주 버튼, 사이드바, 서비스 브랜드 로고 |

- 한 화면에서 강조색은 기본적으로 하나만 사용한다. 여러 차트 시리즈가 필요한 경우 데이터 색상은 예외지만, CTA의 시각적 우선순위를 넘지 않도록 채도와 면적을 통제한다.
- 선택됨은 `accent`의 옅은 배경 틴트 + accent 테두리/텍스트 + 체크 또는 선택 아이콘으로 표현한다. 색상만으로 선택을 알리지 않는다.
- 선택 상태와 키보드 포커스는 다르게 표현한다. 선택은 지속되는 배경·테두리, 포커스는 2px 외곽 링으로 표시한다.
- `hairline`은 장식성 구분에만 쓴다. 입력·체크박스 등 조작 가능한 경계는 `control-border` 또는 포커스 링처럼 충분히 구별되는 토큰을 쓴다.
- 오류·경고 상태는 아이콘과 문구를 함께 제공한다. 색만 바꿔 알리지 않는다.
- 계획 미완료는 `danger`를 사용하지 않는다. `다음에`, `이월`, `미기록`처럼 중립적 문구를 사용한다.

### Theme moods: accent presets

사용자는 같은 화면 구조를 유지한 채 색상 분위기를 바꾼다. 프리셋은 포인트 색의 시작값(seed)이며, 표면 테마에 따라 접근성 대비를 만족하도록 최종 렌더링 값을 조정한다.

| 프리셋 | 시작 색 | 분위기 | 권장 사용자 인상 |
|---|---:|---|---|
| 포레스트 (기본) | `#2F5D46` | 차분함, 성장, 균형 | 오래 사용해도 편안한 기본 작업 공간 |
| 잉크 | `#243B53` | 집중, 신뢰, 절제 | 업무·일정·분석 중심 |
| 플럼 | `#5B2F4D` | 사색, 창의, 개성 | 다이어리·개인 기록 중심 |
| 클레이 | `#7A4327` | 따뜻함, 안정, 온기 | 편안하고 부드러운 분위기 |
| 모스 | `#3F4D24` | 자연, 고요, 지속성 | 루틴·습관·장기 기록 중심 |

각 프리셋은 동일한 컴포넌트 위치와 동일한 의미에 적용한다. 테마를 변경해도 버튼 위치, 정보 구조, 글자 크기, 간격, 모서리, 그림자, 데이터 의미는 바뀌지 않는다.

### Light-mode preset contrast check

아래 값은 각 accent 프리셋을 기본 라이트 캔버스(`#FAF9F6`)에 올렸을 때와, 주 버튼 위에 흰색 텍스트를 올렸을 때의 sRGB 대비 계산값이다. 모든 프리셋은 일반 텍스트 4.5:1을 넘는다. 다크·세피아·고대비는 별도의 표면 보정 후 전체 조합을 다시 검사한다.

| 프리셋 | Accent / canvas | White text / accent |
|---|---:|---:|
| 포레스트 | 7.19:1 | 7.57:1 |
| 잉크 | 10.93:1 | 11.50:1 |
| 플럼 | 10.18:1 | 10.72:1 |
| 클레이 | 7.50:1 | 7.90:1 |
| 모스 | 8.68:1 | 9.14:1 |

기본 `muted`(`#62675F`)는 canvas 대비 5.50:1, surface 대비 5.09:1이다. 이 수치는 해당 기본 밝은 표면 조합의 기준값이며, 테마 변경 후에는 다시 계산한다.

### Surface themes

| 표면 모드 | Canvas | Surface | Card | Foreground | Muted | Hairline | Control border | 목적 |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| 라이트 (기본) | `#FAF9F6` | `#F3F0E9` | `#FFFFFF` | `#242721` | `#62675F` | `#E1DDD4` | `#767B72` | 일상적인 기본 모드 |
| 다크 | `#171B18` | `#222822` | `#292F29` | `#F4F2EC` | `#B8C0B7` | `#3B443D` | `#7E8C80` | 저조도 환경, 눈부심 감소 |
| 세피아 | `#F4EBDD` | `#EBDDCA` | `#FBF6ED` | `#30291F` | `#685847` | `#D4C3AB` | `#82715D` | 종이와 잉크의 따뜻한 분위기 |
| 고대비 | `#FFFFFF` | `#F0F0F0` | `#FFFFFF` | `#000000` | `#404040` | `#BDBDBD` | `#767676` | 시각적 구분을 최우선으로 하는 모드 |

표면 모드는 `frontend/src/store/theme.js`의 기존 `THEMES`를 기준으로 확인한다. 위 값과 실제 코드가 다르면 디자인 계약을 목표로 삼되, 구현 전에 기존 컴포넌트의 영향을 조사하고 관련 테스트를 갱신한다.

### Theme contrast rules

- 일반 텍스트는 배경과 최소 4.5:1, 큰 텍스트는 최소 3:1을 목표로 한다.
- 조작 가능한 경계, 의미 있는 아이콘, 포커스 표시와 같이 시각적으로 구분되어야 하는 UI는 인접 색상과 최소 3:1을 목표로 한다.
- 기본 라이트 테마에서 `muted`는 canvas 및 surface 모두 4.5:1 이상이어야 한다. 이전 문서에 기록된 `muted on surface` 4.36:1 미달을 허용하지 않는다.
- 주 버튼 텍스트와 버튼 배경은 4.5:1 이상을 만족한다. 링크 색상으로 쓰는 accent 역시 인접 표면에서 4.5:1 이상이어야 한다.
- 다크·세피아·고대비 조합에서도 모든 프리셋을 다시 계산한다. 라이트 모드에서 통과한 색을 다른 모드에 그대로 복사하지 않는다.
- `on-accent`와 `on-data`는 흰색 또는 해당 표면의 짙은 foreground 중 더 높은 대비를 내는 색으로 선택한다. 기준을 통과하지 못하면 accent/data의 명도와 채도를 조정한다.
- 사용자 지정 색상은 원본 선택값과 실제 적용값을 함께 보여준다. 접근성 대비를 만족하지 못하면 자동 조정 사실과 대비 수치를 설정 화면에서 안내한다.
- 색상 계산은 `frontend/src/utils/colorTheme.mjs` 한 곳에서 처리한다. 컴포넌트별로 임의의 색 보정 함수를 만들지 않는다.

### Category and chart colors

- 카테고리 색상은 사용자가 고른 콘텐츠 데이터로 저장하며, 서비스의 accent와 분리한다.
- 테마를 바꿔도 카테고리 이름과 색상 매핑은 유지한다. 다크 모드에서 식별이 어려운 색은 렌더링용 밝기만 보정하고 저장된 원본값을 덮어쓰지 않는다.
- 차트는 범례·선 모양·점 모양·라벨을 함께 사용한다. 색상만으로 시리즈를 구분하지 않는다.
- 차트의 녹색은 Actual/완료 데이터, 중립 회색은 Plan/기준 데이터처럼 일관된 의미를 갖는다.
- 빨강은 오류·위험 상태에 예약한다. 카테고리 팔레트에 사용하더라도 오류 UI에서는 반드시 semantic status 토큰을 사용한다.

코드의 콘텐츠 색 토큰(2026-11-20 추가, `tokens.css`). 카테고리·종류·메모 띠처럼 사용자 콘텐츠를 구분할 때만 쓰고, 이름·라벨·모양과 함께 보인다. 다크 표면에서는 `:root[data-theme='dark']` 규칙이 밝은 값으로 바꾼다.

| 토큰 | 라이트 | 다크 | 예 |
|---|---:|---:|---|
| `--color-content-sage` | `#4E7963` | `#8FB5A0` | 일정·건강 |
| `--color-content-slate` | `#43596B` | `#9DB1C2` | 할 일·업무 |
| `--color-content-steel` | `#5C7891` | `#A3B8CB` | 공부 |
| `--color-content-ochre` | `#8A6A3C` | `#CFAE7C` | 내 기록·휴식 |
| `--color-content-rose` | `#A15A72` | `#D69BB0` | 개인 |

### CSS token mapping

기본 테마의 목표 매핑 예시는 다음과 같다. 실제 코드 구조를 확인한 뒤 `tokens.css`의 변수명을 유지하면서 적용한다.

```css
:root {
  --color-canvas: #FAF9F6;
  --color-surface: #F3F0E9;
  --color-card: #FFFFFF;
  --color-foreground: #242721;
  --color-body: #41463F;
  --color-muted: #62675F;
  --color-hairline: #E1DDD4;
  --color-control-border: #767B72;
  --color-accent: #2F5D46;
  --color-accent-hover: #254A38;
  --color-on-accent: #FFFFFF;
  --color-on-primary: #FFFFFF; /* 이전 컴포넌트 호환 alias */
  --color-data: #4E7963;
  --color-on-data: #FFFFFF;
  --color-status-success: #356B49;
  --color-status-warning: #815E26;
  --color-status-danger: #A83F3A;
  --color-status-info: #3C617B;
}
```

## 3. Typography

### Font families

| 서체 | 용도 | 원칙 |
|---|---|---|
| Pretendard Variable | 제목, 본문, 버튼, 내비게이션, 입력 | 한국어 가독성과 굵기 위계의 기본 서체 |
| JetBrains Mono | 시간, 날짜, 통계 수치, 화면 ID, 코드 | 정렬이 필요한 숫자와 기술 정보에 한정 |
| system sans-serif | 폰트 로딩 실패 시 대체 | 레이아웃 이동을 줄이고 기본 가독성을 보존 |

기존 프로젝트의 Pretendard 및 JetBrains Mono 로딩 경로를 우선 재사용한다. 새로운 유료/상용 폰트를 추가하지 않으며, 폰트 라이선스와 외부 CDN 이용 가능 여부를 확인하지 않고 의존성을 변경하지 않는다.

### Type scale

| 역할 | 크기 | 굵기 | 행간 | 사용 |
|---|---:|---:|---:|---|
| display-lg | 36px | 600 | 1.2 | 랜딩·주요 환영 문구 등 제한된 대형 제목 |
| display-md | 30px | 600 | 1.25 | 앱 페이지 제목 |
| title-lg | 22px | 600 | 1.35 | 주요 섹션 제목 |
| title-md | 18px | 600 | 1.4 | 카드·패널 제목 |
| body-md | 15px | 400 | 1.6 | 기본 본문, 목록, 설명 |
| body-sm | 14px | 400 | 1.55 | 보조 본문, 조밀한 표 |
| caption | 12px | 500 | 1.45 | 날짜 메타데이터, 보조 라벨 |
| button | 14px | 600 | 1.0 | 버튼·탭 라벨 |
| time | 13px | 500 | 1.4 | 시간, 숫자, 타임스탬프 |

### Principles

- 앱 내부 화면은 랜딩 페이지처럼 과도하게 큰 제목을 사용하지 않는다. 기본 페이지 제목은 30px, 좁은 화면에서는 24–26px로 낮춘다.
- 글자 위계는 크기·굵기·간격을 함께 사용한다. 본문 전체를 굵게 만들거나 색상으로만 위계를 구분하지 않는다.
- 긴 한국어 제목과 버튼은 `word-break: keep-all` 및 자연스러운 줄바꿈을 적용한다. 한 글자씩 끊기는 줄바꿈은 금지한다.
- 시간·수치에는 JetBrains Mono와 `font-variant-numeric: tabular-nums`를 사용한다. 일반 문단 전체를 모노스페이스로 표시하지 않는다.
- 본문은 14px 미만으로 내리지 않는다. 보조 캡션 12px는 짧은 메타 정보에만 제한한다.
- 글자 크기는 `rem`을 우선 사용해 사용자 글자 크기 설정과 브라우저 확대를 존중한다.
- 대문자 영문 eyebrow를 장식처럼 반복하지 않는다. 한국어 서비스에서 제목·섹션 이름은 한국어를 우선한다.

## 4. Components

### Shared component rules

- 화면마다 새로운 버튼·입력·탭 디자인을 만들지 않는다. 공통 디자인 시스템 컴포넌트를 재사용한다.
- 색상은 위의 semantic tokens만 사용한다. 컴포넌트 CSS에 임의의 hex 색상을 직접 쓰지 않는다.
- 모든 상태를 정의한다: default, hover, focus-visible, active/pressed, selected, disabled, loading, error, success.
- 모션은 기본 160ms 안팎의 짧은 전환으로 제한한다. `prefers-reduced-motion: reduce`에서는 필수 정보 전달을 제외한 애니메이션을 제거한다.
- 상호작용 가능한 요소의 클릭 영역은 데스크톱 40px 이상, 터치 환경 44×44px 이상을 목표로 한다.

### Buttons

| 종류 | 배경 | 텍스트 | 모서리 | 용도 |
|---|---|---|---|---|
| Primary | accent | on-accent | 10px | 화면의 가장 중요한 행동 하나 |
| Secondary | card | foreground | 10px, control-border 1px | 취소·보조 행동 |
| Tertiary / text | 투명 | foreground 또는 accent | 8px | 문맥 안의 낮은 우선순위 행동 |
| Icon button | card 또는 투명 | foreground | 원형 | 툴바·헤더의 단일 아이콘 행동 |

- Primary 버튼은 화면당 1개를 기본으로 한다. 정말로 서로 다른 핵심 작업이 있을 때만 2개까지 허용한다.
- 기본 주 버튼은 선택한 theme accent를 사용한다. 검정 버튼을 모든 테마에 강제하지 않는다.
- Hover는 `primary-hover`로 배경만 자연스럽게 변경한다. 과한 확대, 큰 그림자, 3D 이동을 사용하지 않는다.
- Loading은 버튼 너비를 유지하고, 중복 제출을 막으며, `aria-busy="true"`와 진행 문구를 제공한다.
- Disabled는 불투명도만 낮춰 텍스트까지 읽기 어렵게 만들지 않는다. 비활성 이유를 필요할 때 근처에 설명한다.

### Inputs and selection controls

- 입력은 명확한 label, 입력 컨트롤, 선택적 helper text로 구성한다. placeholder를 label 대용으로 사용하지 않는다.
- 입력 높이는 기본 44px, 최소 높이는 터치 환경 44px로 한다. 배경은 card, 기본 테두리는 control-border, 모서리는 10px이다.
- Focus-visible는 2px accent 외곽 링과 2px offset을 사용한다. 포커스가 outline을 잘라먹는 `overflow: hidden` 컨테이너 안에 갇히지 않게 한다.
- Error는 입력과 연결된 텍스트 및 `aria-describedby`, `aria-invalid="true"`로 전달한다. 단순히 테두리만 빨갛게 바꾸지 않는다.
- Checkbox·radio·toggle의 선택 상태는 체크 아이콘·손잡이 위치·레이블로도 확인할 수 있어야 한다.

### Segmented controls and tabs

- 그룹 배경은 surface, 선택 항목은 card 또는 accent의 옅은 틴트로 한다.
- 선택 항목은 테두리/체크/`aria-selected` 또는 `aria-pressed`를 함께 적용한다.
- 탭과 토글을 의미에 맞게 구별한다. 페이지 전환에는 tab/navigation, 값 on/off에는 switch, 같은 화면 보기 변경에는 segmented control을 사용한다.
- 좁은 화면에서 탭 텍스트가 잘리지 않도록 항목을 줄바꿈하거나 가로 스크롤을 제공하고, 선택 항목이 보이게 한다.

### Existing class compatibility

아래는 이전 디자인 계약에서 기록한 현재 클래스 별칭이다. 실제 사용처와 우선순위는 소스에서 재확인하고, 새 컴포넌트는 공통 클래스를 우선 사용한다.

| 역할 | 공통 클래스 | 기존 별칭/화면 클래스 |
|---|---|---|
| Primary button | `.primary` | 기존 동일 클래스 |
| Secondary button | `.button-secondary` | `.modal-secondary` |
| Icon button | `.icon-button` | `.icon` |
| Input | `.input-field`, `.input-field-help` | 기존 입력 구조 |
| Segmented tab | `.segmented-tab` | `.tabs`, `.filter`, `.compose-tabs` |
| Card | `.card` | 기존 동일 클래스 |
| Status badge | `.tag` | `.state`, `.ok`, `.warn`, `.danger`, `.info` |
| Empty state | `.empty-state` | 기존 동일 클래스 |
| Tertiary(text) button | `.button-text` | `.review`(button) |
| Switch | `.toggle` | `role="switch"` + `aria-label` 필수 |
| 화면 대표 행동 자리 | `.page-actions` | `components/PageActions.vue` |

### Navigation

- 데스크톱 LNB는 기존 구조를 존중하며 목표 너비는 244–248px다.
- 기본 nav는 muted 또는 body 텍스트, hover는 surface, active는 accent의 옅은 배경 + foreground/accent 텍스트 + 선택 표식으로 표현한다.
- 현재 위치를 색상 하나로만 나타내지 않는다. 굵기, 표식 또는 `aria-current="page"`를 함께 사용한다.
- 아이콘은 같은 라이브러리와 같은 스트로크 스타일을 사용한다. 메뉴마다 다른 아이콘 스타일을 섞지 않는다.

### Cards, lists and tables

- Card는 실제로 서로 다른 콘텐츠 단위나 작업 흐름이 있을 때 사용한다. 모든 영역을 카드로 감싸는 'card soup'를 피한다.
- 카드 기본은 흰 표면, 1px hairline, 14px 모서리, 20–24px 패딩이다. 기본 카드에 진한 그림자를 사용하지 않는다.
- 목록은 정렬된 행과 미세한 구분선으로 구성한다. 행 높이와 좌우 정렬을 통일하고 제목·설명·시간의 정보 위계를 유지한다.
- 표는 열 제목, 정렬 기준, 빈 상태, 로딩 상태, 오류 상태를 제공한다. 모바일에서는 열을 줄이거나 명시적으로 가로 스크롤 컨테이너를 사용한다.
- 클릭 가능한 카드 전체 영역은 실제 단일 행동을 나타낼 때만 허용한다. 카드 안에 별도 버튼이 여러 개라면 중첩된 클릭 대상을 만들지 않는다.

### Plan and Actual time blocks

| 타입 | 모양 | 의미 |
|---|---|---|
| Plan | card 배경 + 1px 점선 경계 + 중립 텍스트 | 예정·의도한 시간 |
| Actual | card 배경 + 1px 실선 경계 + 왼쪽 3px 콘텐츠 컬러 띠 | 실제로 기록한 시간 |
| Shared | 같은 시간축, 같은 시간 포맷, 같은 기준선 | 비교가 가능한 시각적 정렬 |

Plan과 Actual 차이는 점선/실선, 라벨, 패턴 및 수치로도 구분한다. 실제 기록이 없거나 계획이 미완료여도 오류 화면처럼 만들지 않는다.

### Empty, loading and feedback states

- Empty state는 무엇이 비어 있는지 먼저 설명하고, 다음 행동이 유용한 경우에만 보조 버튼 하나를 제공한다.
- Empty state에 장식용 이모지나 거대한 일러스트를 넣지 않는다. 필요한 경우 제품 내 기존 아이콘 세트에서 단일 아이콘을 사용한다.
- Loading은 가능한 경우 기존 레이아웃을 유지하는 skeleton 또는 진행 문구를 사용한다. 불필요하게 화면 전체를 깜박이지 않는다.
- 성공·오류 피드백은 간결한 한국어 문구와 일관된 semantic status를 사용한다.

### Settings: theme customization screen

화면 경로의 목표 명칭은 `환경설정 > 화면 테마`다. 기존 설정 구조와 라우팅을 먼저 확인하고, 실제 화면 위치는 프로젝트의 현재 IA에 맞춘다.

**레이아웃**

- 페이지 헤더: 제목 `화면 테마`, 한 줄 설명, 현재 적용 중인 테마 상태.
- 주 편집 영역: 왼쪽 또는 위쪽에 선택 컨트롤, 오른쪽 또는 아래쪽에 큰 실시간 미리보기.
- 데스크톱은 `controls 360px + preview minmax(0, 1fr)`의 2열을 권장한다. 설정 콘텐츠 최대 폭은 1120px 안팎으로 한다.
- 태블릿은 1열로 쌓고, 모바일에서는 컨트롤을 먼저 보여준 다음 미리보기를 제공한다.

**사용자 선택 순서**

1. 표면 모드: 라이트, 다크, 세피아, 고대비.
2. 색상 분위기: 포레스트, 잉크, 플럼, 클레이, 모스.
3. 고급 설정(선택): 사용자 지정 accent. 기본 사용자에게는 숨기거나 접힌 영역으로 둔다.

**Theme option cards**

- 각 옵션 카드는 팔레트 칩, 이름, 짧은 분위기 설명, 선택 상태를 함께 보여준다.
- 선택된 카드에는 accent 테두리, 체크 아이콘, `aria-pressed="true"` 또는 적절한 radio semantics를 적용한다.
- 실제 테마를 연상시키는 작은 미리보기 조각(페이지 배경·카드·텍스트·주 버튼)을 포함한다. 색 원 5개만 나열하지 않는다.
- 모든 옵션 이름과 설명은 스크린리더가 읽을 수 있어야 한다. 색상 차이만으로 옵션을 구분하지 않는다.

**Preview and apply behavior**

- 사용자가 옵션을 선택하면 미리보기 영역을 즉시 업데이트하되, 저장 전에는 `미리보기 중` 상태를 분명하게 표시한다.
- `적용하기`는 사용자별 설정 저장이 성공한 뒤에만 완료 상태를 표시한다.
- `취소`는 저장 전 변경을 이전 저장값으로 되돌린다.
- `기본값으로 복원`은 라이트 + 포레스트를 미리보기 값으로 설정한 뒤, 실제 저장은 사용자가 적용을 확정했을 때 수행한다.
- 저장 중 중복 클릭을 막고, 실패하면 기존 설정을 유지하며 오류를 안내한다.
- 설정은 기존 계정별 환경설정 저장 경로를 먼저 확인해 연결한다. 서버 저장이 구현되지 않았다면 로컬 저장을 서버 동기화처럼 표현하지 말고, 구현 범위를 명시한다.

**Recommended microcopy**

| 상황 | 문구 |
|---|---|
| 설명 | 배경과 포인트 색을 조합해 나에게 편한 화면을 만들어 보세요. |
| 미리보기 | 아직 저장되지 않은 테마를 미리 보고 있어요. |
| 저장 중 | 테마를 적용하는 중이에요. |
| 저장 완료 | 화면 테마를 적용했어요. |
| 오류 | 테마를 저장하지 못했어요. 기존 설정을 유지했어요. |
| 기본값 복원 | 기본 테마(라이트 · 포레스트)로 돌아갑니다. |

## 5. Layout

### App shell

- 데스크톱 기본 구조는 LNB + 상단 컨텍스트/헤더 + 메인 콘텐츠다.
- LNB는 244–248px 범위를 기준으로 하며, 콘텐츠 영역과 독립적으로 스크롤한다.
- 메인 콘텐츠는 최대 폭 1240px를 권장한다. 화면이 넓어져도 한 줄의 텍스트나 데이터가 지나치게 길어지지 않도록 한다.
- 앱 내부 페이지의 기본 좌우 패딩은 데스크톱 32–40px, 태블릿 24px, 모바일 16px다.
- 주요 페이지 제목은 좌측, 화면 대표 CTA는 우측에 배치한다. 한 줄에 들어가지 않으면 자연스럽게 다음 줄로 이동한다.
- 구현: 화면은 대표 행동을 `<PageActions>`로 감싸 앱 헤더 오른쪽 끝(`#page-actions`)에 둔다. 헤더가 없는 화면(대화·관리자 창)은 제자리에 그린다. 화면이 대표 행동을 내놓으면 760px 이하에서 같은 작성 창을 여는 전역 '새 글 작성'을 접는다.
- 표·목록은 600px 이하에서 표 머리를 숨기고 행을 '제목 줄 + 메타 줄'로 쌓는다. 페이지 전체 가로 스크롤을 만들지 않는다.

### Page composition

각 화면은 다음 순서를 기본 골격으로 삼되, 콘텐츠에 맞춰 필요한 영역만 사용한다.

1. **Context** — 현재 위치, 날짜 범위, 필터 또는 선택된 프로젝트.
2. **Page header** — 명확한 제목, 짧은 설명, 대표 행동.
3. **Primary content** — 사용자의 핵심 작업을 수행하는 영역.
4. **Supporting content** — 비교·참고·최근 활동 등 보조 정보.
5. **Feedback** — 저장·오류·빈 상태를 작업 문맥 가까이에 제공.

첫 화면에서 핵심 작업을 찾기 어렵게 만드는 배너, 과도한 hero, 사용하지 않는 장식 카드, 동일한 중요도의 CTA 반복을 금지한다.

### Grid and density

- 12-column 또는 콘텐츠에 맞는 CSS Grid/Flex를 사용하고, 열에는 `minmax(0, 1fr)`를 적용한다.
- 홈의 3열 위젯은 화면 너비가 충분할 때만 사용한다. 카드 수가 많아도 모든 카드를 동일한 크기로 강제하지 않는다.
- 플래너는 시간축과 작업 블록의 정렬을 우선한다. 통계는 비교 기준과 실제 값을 같은 시각 단위로 읽을 수 있게 한다.
- 목록 + 상세는 넓은 화면에서 1fr + 280–320px를 사용하고, 좁아지면 상세를 별도 패널/아코디언/후속 화면으로 이동한다.
- 설정 화면은 240–280px 내비게이션 + 나머지 설정 패널을 기본으로 한다. 테마 설정은 컨트롤과 미리보기의 2열 구성이 우선이다.

### Spacing and rhythm

| 토큰 | 값 | 사용 |
|---|---:|---|
| xxs | 4px | 아이콘과 라벨 사이 등 최소 간격 |
| xs | 8px | 컨트롤 안쪽의 촘촘한 간격 |
| sm | 12px | 관련 요소 사이 |
| md | 16px | 기본 요소 간격 |
| lg | 24px | 카드 내부와 그룹 사이 |
| xl | 32px | 페이지 내 영역 구분 |
| xxl | 48px | 큰 섹션 사이 |
| section | 64px | 랜딩형 섹션 또는 긴 페이지의 주요 구분 |

앱 대시보드에 64–96px의 큰 공백을 무조건 넣지 않는다. 콘텐츠 밀도와 반복 작업 효율에 맞춰 16–32px 영역 간격을 우선하고, 긴 페이지에서만 더 큰 섹션 간격을 사용한다.

### Corner radius

| 토큰 | 값 | 사용 |
|---|---:|---|
| xs | 4px | 작은 상태 요소 |
| sm | 8px | nav 항목, 작은 칩 |
| md | 10px | 버튼, 입력, 선택 컨트롤 |
| lg | 14px | 카드, 패널 |
| xl | 18px | 주요 미리보기 패널, 큰 컨테이너 |
| pill | 9999px | 태그·아바타·완전한 pill이 의미에 맞는 경우만 |

## 6. Elevation

### Surface hierarchy

| 단계 | 구성 | 원칙 |
|---|---|---|
| 0 | Canvas | 페이지 바탕. 그림자 없음 |
| 1 | Surface | 내비게이션·구획을 배경색 차이로 나눔 |
| 2 | Card | 흰색/테마 카드 + hairline. 기본은 그림자 없음 |
| 3 | Popover / menu | 경계 + 아주 약한 그림자. 주변 콘텐츠 위에 떠 있음을 분명히 함 |
| 4 | Modal / dialog | 반투명 backdrop + 강한 overlay shadow. 키보드 포커스를 내부에 유지 |

### Shadow rules

- 일반 카드에는 그림자를 기본 적용하지 않는다. 캔버스와 표면 색, 1px 경계로 구분한다.
- 고정 헤더·팝오버 등 실제로 떠 있는 요소에만 작고 확산된 그림자를 사용한다.
- 모달 그림자는 계층을 이해하는 데 필요한 수준으로 제한하고 검은 그림자 테두리를 만들지 않는다.
- 다크 모드에서는 검은 그림자를 추가하지 않는다. surface 단계와 hairline, 필요할 때만 밝은 경계를 사용한다.
- 동일 화면에서 두 종류 이상의 강한 그림자를 중첩하지 않는다.

## 7. Brand and Iconography

### Wordmark and app mark

기존 브랜드 파일이 있는지 먼저 확인하고, 실제 운영 자산이 발견되면 비율·색상·파일 형식을 임의로 바꾸지 않는다. 기존 자산이 없다면 아래는 Timebar Diary 신규 마크의 **디자인 제안**으로 사용한다.

- 심볼 컨셉은 시간축 위의 두 기록이다. 세로 기준선과 두 개의 짧은 가로 트랙으로 Plan(점선)과 Actual(실선)을 나타낸다.
- 심볼은 작은 크기에서도 식별 가능한 단순한 기하 형태로 만든다. 1–2개의 선 굵기만 사용하고 작은 장식이나 그라데이션은 넣지 않는다.
- 워드마크는 `Timebar Diary`를 Pretendard Variable 600으로 표기한다. `Timebar`와 `Diary`를 과도하게 다른 서체나 크기로 나누지 않는다.
- 라이트/세피아 배경은 기본 잉크색 또는 포레스트 심볼, 다크 배경은 라이트 잉크색 심볼을 사용한다.
- 앱 아이콘·파비콘은 심볼만 사용하고, 작은 크기에 워드마크를 억지로 넣지 않는다.
- 로고 주변 최소 여백은 심볼 너비의 0.5배 이상을 확보한다. 로고를 늘리거나 기울이거나 외곽선을 임의로 추가하지 않는다.
- 로고를 버튼·배지·상태 아이콘처럼 반복 사용하지 않는다.
- Claude/Anthropic의 radial-spike mark, 다른 서비스의 워드마크, 타사 제품 아이콘을 복제하거나 Timebar Diary 로고로 오인되게 만들지 않는다.

### Timebar mark construction concept

기존 로고 자산이 없을 때 디자이너/에이전트가 같은 형태를 재현할 수 있도록 심볼의 기하를 고정한다. 아래 SVG는 콘셉트 스케치이며, 기존 로고가 발견되면 교체용으로 사용하지 않는다.

```svg
<svg viewBox="0 0 24 24" role="img" aria-label="Timebar Diary">
  <path d="M5 4.5v15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M9 8h10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="2.2 2.2"/>
  <path d="M9 16h6.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  <circle cx="18" cy="16" r="2" fill="currentColor"/>
</svg>
```

현재 구현(2026-11-20): 앱 안 심볼은 `frontend/src/components/brand/BrandMark.vue`(currentColor), 파비콘은 같은 기하를 포레스트(`#2F5D46`) 타일 위 흰색으로 그린 `frontend/public/favicon.svg`와 거기서 렌더링한 `favicon.ico`(16·32·48), `apple-touch-icon.png`(180, 모서리 없는 정사각형 — iOS가 둥근 모서리를 씌운다)다. Android·iOS·Electron 앱 아이콘은 아직 바꾸지 않았다.

심볼은 `viewBox 0 0 24 24`, 둥근 선 끝, 1.8px 단일 선 굵기를 유지한다. 상단 점선은 계획, 하단 실선과 점은 실제 기록을 나타낸다. 서비스 명칭은 별도 워드마크 텍스트로 조합한다. SVG에 텍스트를 경로로 박아 넣거나 이미지 한 장으로만 제공하지 않아야 크기·접근성·다크 테마 대응이 쉽다.

### Iconography

- 현재 프로젝트에 설치된 아이콘 라이브러리와 기존 아이콘을 먼저 재사용한다. 새 라이브러리를 추가하기 전에 의존성과 번들 영향을 확인한다.
- 현재 구현: 설치된 아이콘 라이브러리가 없어 의존성 없이 `frontend/src/components/icons/iconPaths.mjs`(24 격자, 선 1.75, 둥근 끝)와 `AppIcon.vue`로 한 패밀리를 둔다. 사이드바·헤더·환경설정 메뉴·관리자 창이 이 세트를 쓴다. 라우터의 글자 아이콘은 대응이 없을 때의 fallback이다.
- 전체 제품에서 하나의 아이콘 패밀리를 사용한다. 기본 크기는 20px, 주요 내비게이션은 20–22px, 보조 아이콘은 16px을 기준으로 한다.
- 스트로크 아이콘은 1.75–2px 굵기를 유지하고, 채움 아이콘과 선 아이콘을 무작위로 섞지 않는다.
- 아이콘만 있는 버튼에는 `aria-label`과 hover/focus tooltip을 제공한다.
- 의미가 없는 장식 이모지를 버튼·메뉴·상태 아이콘으로 사용하지 않는다.

### Do and Don't

**Do**

- 정렬과 여백을 먼저 바로잡고, 컬러는 마지막에 사용한다.
- 동일한 의미의 컴포넌트는 동일한 토큰과 상태를 사용한다.
- 사용자가 실제로 기록한 데이터를 핵심 시각 정보로 보여준다.
- 로고·아이콘·일러스트는 한 가지 스타일로 제한한다.
- 작은 화면에서 주요 CTA와 핵심 데이터가 먼저 보이도록 재배치한다.

**Don't**

- 보라·파랑 그라데이션 배경, 유리 효과, 네온 테두리, 과한 blur/glow를 기본 스타일로 사용하지 않는다.
- 모든 요소를 카드로 감싸거나 모든 카드의 크기·비중을 똑같이 만들지 않는다.
- 페이지마다 임의의 새 포인트 컬러·모서리·그림자를 추가하지 않는다.
- 이모지, 임의 제작한 SVG, 다른 브랜드의 로고로 브랜드 자산을 대체하지 않는다.
- 실제 저장·결제·AI·음성·외부 캘린더 연동이 완료되지 않았는데 성공한 것처럼 표현하지 않는다.
- 계획 미완료나 루틴 미달성을 오류/실패/위험처럼 표시하지 않는다.

### Voice and microcopy

- 기본 로케일은 한국어(ko)다. 모든 UI 문자열은 한국어를 1차 기준으로 하고, 기존 용어 사전을 따른다.
- 짧고 구체적인 안내형 문장을 쓴다. 사용자가 다음에 할 행동을 문장 앞부분에 둔다.
- 과한 느낌표, 장식용 영문 카피, 이모지, 불필요한 전문용어를 피한다.
- 기존 용어 매핑을 유지한다: Plan=계획, Actual=실제 기록, Event=일정, Task=할 일, Routine=루틴, Diary=다이어리.

## 8. Responsive Behavior and Accessibility

### Breakpoints

다음은 디자인 목표 기준이다. 기존 코드의 실제 breakpoint와 충돌하면 먼저 `frontend/src`에서 적용 규칙을 확인하고 회귀 범위를 검토한다.

| 폭 | 레이아웃 |
|---|---|
| 1200px 초과 | LNB + 메인 콘텐츠, 충분한 여백, 콘텐츠 최대폭 제한 |
| 960–1200px | 콘텐츠 패딩 축소, 3열 위젯을 2열로, 보조 패널 축소 |
| 760–959px | LNB를 축소/접힘 또는 오프캔버스로 전환, 주요 콘텐츠 1열/2열 재구성 |
| 600–759px | 모바일형 내비게이션, 카드 1열, 헤더 액션 다음 줄 배치 |
| 600px 미만 | 전체 폭 콘텐츠, 16px 좌우 패딩, 표/타임라인은 제한된 내부 스크롤 |
| 320px | 최소 지원 폭. 버튼·폼·핵심 정보가 잘리거나 겹치지 않아야 함 |

기존 구현에 이미 1150px, 1000px, 860px, 760px, 600px breakpoint가 있으므로, 신규 개발 시 이를 무조건 교체하지 않는다. 실제 CSS와 테스트를 확인하고 단계적으로 정리한다.

### Accessibility

- 일반 텍스트 대비 4.5:1 이상, 큰 텍스트 3:1 이상, 의미 있는 UI 경계·아이콘·포커스 표시 3:1 이상을 목표로 한다.
- 키보드로 모든 주요 작업을 수행할 수 있어야 한다. Tab 순서, Enter/Space, Escape, 화살표 이동 등 컴포넌트 역할에 맞는 키 동작을 제공한다.
- `:focus-visible`은 2px 이상의 선명한 링으로 표현하며, 스크롤 컨테이너나 카드 overflow에 잘리지 않게 한다.
- 컨트롤은 보이는 label 또는 accessible name을 갖는다. 아이콘 버튼에는 `aria-label`을 지정한다.
- 상태는 색상 외에 텍스트·아이콘·패턴을 함께 사용한다.
- 모달은 제목과 설명을 연결하고, 열릴 때 포커스를 이동하며, 닫힐 때 원래 트리거로 복귀한다.
- 200% 확대에서 텍스트·버튼·입력이 겹치지 않아야 한다. 브라우저 확대를 막는 viewport 설정을 넣지 않는다.
- 동작 감소 설정(`prefers-reduced-motion`)을 존중한다.
- 최소 지원 화면 폭은 320px이다. 표나 시간표 내부 스크롤을 제외한 페이지 전체의 불필요한 가로 넘침은 허용하지 않는다.

### Mobile interaction

- 터치 타깃은 44×44px 이상을 기본으로 한다. 작은 보조 아이콘은 주변 버튼 영역을 넓혀 기준을 만족한다.
- hover만으로 주요 정보나 행동을 숨기지 않는다.
- 모바일에서 중요한 작업은 고정 하단 버튼 또는 자연스러운 문서 흐름으로 제공하되, 키보드와 safe-area에 가려지지 않게 한다.
- 입력 포커스 시 화면이 급격히 확대되거나 키보드에 가려지지 않도록 입력 크기와 스크롤 위치를 검증한다.

## 9. Agent Prompt Guide and Known Gaps

### Always-on instruction

아래 내용을 Claude/Codex 프롬프트에 포함한다.

> 작업 전에 저장소 루트의 `DESIGN.md`를 처음부터 끝까지 읽고, 이번 작업에 영향을 주는 실제 화면·컴포넌트·라우터·테마 저장소·CSS 토큰을 확인한다. 이 문서는 목표 디자인 계약이며, 현재 코드에 이미 구현되었다고 가정하지 않는다. 기존 디자인 시스템과 프로젝트 구조를 재사용하고, 화면 레이아웃·정보 위계·브랜드 자산·반응형·접근성을 함께 검토한다. 새 색상이나 스타일을 임의로 만들지 말고 기존 semantic token을 사용한다. 변경 범위와 검증 결과를 근거와 함께 보고한다.

### Screen implementation prompt

> Timebar Diary의 [화면명]을 구현/개선한다.
>
> - 사용자 목표: [사용자가 이 화면에서 완료할 작업]
> - 핵심 행동: [가장 중요한 행동 1개]
> - 주요 정보: [항상 보여야 할 정보]
> - 보조 정보: [필요할 때만 보여줄 정보]
> - 상태: 기본/로딩/빈 상태/오류/성공/비활성/선택 상태를 포함한다.
> - 레이아웃: `DESIGN.md`의 앱 셸·페이지 구성·간격 규칙을 따른다. 같은 크기의 카드만 나열하지 않는다.
> - 테마: 라이트+포레스트를 기본값으로 하고 다크·세피아·고대비 및 나머지 accent 프리셋에서 읽기와 대비가 유지되게 한다.
> - 브랜드: 기존 Timebar Diary 로고와 아이콘 자산을 재사용한다. 자산이 없으면 신규 도형을 임의 확정하지 말고 디자인 제안으로 분리한다.
> - 반응형: 1440px, 1024px, 768px, 390px, 320px 및 200% 확대를 점검한다.
> - 접근성: 키보드, focus-visible, accessible name, 색상 외 상태표시, reduced motion을 점검한다.
> - 구현 제한: 실제 저장·API·연동 상태를 확인하고, 연결되지 않은 기능을 완료된 것처럼 표시하지 않는다.
> - 검증: 관련 테스트와 빌드를 실행하고, 결과 및 미실행 이유를 보고한다.

### Theme settings prompt

> `환경설정 > 화면 테마` 화면을 만든다. 표면 테마(라이트/다크/세피아/고대비)와 색상 분위기(포레스트/잉크/플럼/클레이/모스)를 명확히 분리한다. 왼쪽/상단에는 선택 컨트롤, 오른쪽/하단에는 실제 앱 요소가 포함된 실시간 미리보기를 둔다. 각 테마 카드는 이름·짧은 분위기 설명·색상 칩·버튼/카드 축소 미리보기를 보여준다. 선택 상태는 체크와 테두리로도 표시한다. 미리보기와 저장된 테마를 구분하고, 적용/취소/기본값 복원 동작을 구현한다. 저장 성공을 확인하기 전 완료 문구를 표시하지 않는다. 작은 화면에서는 1열로 자연스럽게 쌓는다. 모든 색 조합의 텍스트·컨트롤 대비를 검증한다.

### Visual review checklist

- [ ] 실제 프로젝트의 기존 로고·아이콘·컴포넌트·토큰을 먼저 확인했다.
- [ ] 디자인 계약과 현재 코드의 차이를 구분했고, 구현되지 않은 기능을 완료된 것처럼 말하지 않았다.
- [ ] 제목, 핵심 행동, 주요 콘텐츠, 보조 정보의 위계가 분명하다.
- [ ] 같은 크기 카드의 기계적인 반복과 불필요한 장식이 없다.
- [ ] 색상은 semantic tokens에서 가져오고 테마별 대비를 확인했다.
- [ ] 선택, 포커스, 오류, 성공, 로딩, 빈 상태가 각각 구분된다.
- [ ] Plan과 Actual을 색뿐 아니라 선·패턴·레이블로 구분했다.
- [ ] 로고와 아이콘 스타일이 일관되고 타사 자산을 복제하지 않았다.
- [ ] 320px, 390px, 768px, 1024px, 1440px 및 200% 확대에서 확인했다.
- [ ] 키보드 접근성, 터치 타깃, reduced motion, accessible name을 점검했다.
- [ ] 관련 테스트/빌드 결과와 남은 위험을 보고했다.

### Known gaps and implementation boundary

- 이 문서는 디자인 목표 계약이다. `tokens.css`, `components.css`, `theme.js`, `colorTheme.mjs`, Vue 화면이 자동으로 바뀌는 것은 아니다.
- 테마 설정 UI의 미리보기·적용·취소·사용자 지정 저장은 현재 API/스토어 동작을 확인한 뒤 구현해야 한다.
- 로고 콘셉트는 기존 브랜드 파일 확인 전의 제안이다. 실제 자산 교체는 파일과 사용처 확인 후 별도 변경으로 처리한다.
- 현재 코드의 실제 시각 결과는 이 업로드 문서만으로 검증할 수 없다. 구현 시 브라우저 캡처·반응형 점검·접근성 검사를 수행해야 한다.
- 아래 파일 경로는 기존 문서에 기록된 경로다. 소스 변경 전 저장소에서 실제 존재 여부와 호출 관계를 확인한다.

### Related source locations

| 파일 | 책임 |
|---|---|
| `frontend/src/design-system/tokens.css` | 디자인 토큰 |
| `frontend/src/design-system/components.css` | 공통 컴포넌트 스타일 |
| `frontend/src/utils/colorTheme.mjs` | 테마 색상·대비 계산 |
| `frontend/src/store/theme.js` | 테마 프리셋과 선택 상태 |
| `frontend/src/router/index.js` | 화면 라우팅과 영역 구조 |
| `frontend/tests/color-theme.test.mjs` | 색상 테마 관련 회귀 테스트 |
| `frontend/tests/design-tokens.test.mjs` | 토큰과 문서 정합성 테스트 |
| `frontend/scripts/dev/overflow-sweep.html` | 화면 가로 넘침 점검 |

### Change log

| 날짜 | 변경 |
|---|---|
| 2026-11-20 | getdesign.md의 토큰+근거 구조를 반영해 문서를 재구성하고, 브랜드·레이아웃·테마 설정·접근성·에이전트 프롬프트 기준을 명확히 함 |
| 2026-11-20 | UI 리뉴얼 적용분 기록: 콘텐츠 색 토큰, 헤더 대표 행동 자리(PageActions), 선 아이콘 세트, 목록 좁은 화면 쌓기, tertiary·switch 호환 클래스 |
| 2026-11-21 | 정보 구조에 커리어·업무·프로젝트 영역 추가(docs/design 03 §2). 커리어 화면은 기존 토큰·공통 클래스만 사용하며 새 색·모서리·그림자를 추가하지 않음 |

### Reference

- [getdesign.md](https://getdesign.md/) — 에이전트가 읽을 색상·타이포그래피·레이아웃·컴포넌트 디자인 계약의 구조 참고.
- [What is DESIGN.md?](https://getdesign.md/what-is-design-md) — YAML 토큰, 컴포넌트 참조, Overview 및 Known Gaps 구성 참고.
- [Claude DESIGN.md example](https://getdesign.md/claude/design-md) — 따뜻한 뉴트럴 표면과 에디토리얼 위계 참고. Anthropic의 로고·고유 색상·자산은 복제하지 않음.
