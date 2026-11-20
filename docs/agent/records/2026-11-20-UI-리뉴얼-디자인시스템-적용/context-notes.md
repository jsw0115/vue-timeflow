# 결정·근거·인수인계 메모

## 세션 1(2026-11-20 오후, 기록 일부 누락 — 세션 2에서 diff와 캡처로 복원)
- tokens.css·theme.js·colorTheme.mjs·typography.css를 새 DESIGN.md 값으로 바꾸고 카드 배경 canvas→card, 카드 그림자 제거, 테스트(design-tokens, color-theme, theme-account) 갱신.
- 앱 셸: BrandMark(시간축 심볼, components/brand/BrandMark.vue) + 워드마크 "Timebar Diary", 페이지 헤더를 위치(메뉴 묶음)·화면 이름·설명으로, 로그아웃이면 시연 계정 대신 로그인 안내, nav aria-current.
- components.css: primary(accent·10px)·secondary·text·icon 버튼, 입력, 세그먼트, 카드, 배지, nav, 빈 상태.
- 테마 설정: 미리보기·적용·취소·기본값 복원, 로그인 시 계정 `/api/settings/appearance` 저장·로그인 시 동기화(features/settings/themeAccount.mjs, App.vue watch). 로그아웃은 이 브라우저에만 저장. 브라우저 검사 15/15(이전 scratchpad check-theme.out).

## 세션 2(2026-11-20 저녁) 결정
- 화면 대표 행동 자리: `components/PageActions.vue`(Teleport defer → App 헤더 `#page-actions`). 헤더가 없는 곳(채팅·관리자 창·bare)은 제자리에 그린다. 화면이 대표 행동을 내놓으면 760px 이하에서 전역 '새 글 작성'을 접는다(같은 작성 창을 여는 중복 버튼). 32개 화면 변환(스크립트 page_actions.py, 한 줄짜리 `.primary`만).
- 상세 패널의 '상세 보기'는 주 버튼이 아니어서 button-secondary로 내림(할 일·일정).
- 목록 공통(components.css List/table): 선택 행 accent-soft + 왼쪽 accent 표식, 완료 체크 data 색, 600px 이하 표 머리 숨김 + 행을 '제목 줄 + 메타 줄'로 쌓음(가로 스크롤 표 제거).
- 좁은 화면 헤더: 메뉴 버튼 44px + 제목 묶음 1행, 행동 2행 오른쪽.
- 플래너: 기간 이동을 PlannerViewSettings 한 줄로 합침(일·주·월·연 공통), 일간은 타임바가 넓은 열, 빠른 기록 막대를 타임라인 위로, 모두 보기에서 계획(왼쪽)·실제(오른쪽) 두 줄, 보기 이름 한국어(계획·실제 기록), 범례(점선/실선).
- 주간·월간·연간은 전부 예시 데이터였는데 표시가 없어 '시연용 예시 데이터' 문구를 붙임. 월간 원그래프에 범례 없음(색만) → 범례·비율 추가, 히트맵 칸에 점 개수(색 외 표시)와 aria-label. 연간은 8월 고정 '진행중' → 실제 이번 달 기준, 12개월.
- 콘텐츠 색 토큰 `--color-content-{sage,slate,steel,ochre,rose}` 추가(다크 표면 밝은 값 별도). styles.css의 하드코딩 hex 18곳 → 토큰. phase-badge는 상태 토큰.
- 캘린더: 칸 안 제목 2개 + '+N', 종류는 색 + 모양(동그라미·마름모·네모·고리), 날짜 버튼 aria-label·aria-pressed, 옆 패널 항목을 RouterLink로(이전 div@click은 키보드 불가).
- 아이콘: 설치된 아이콘 라이브러리가 없어 의존성 없이 `components/icons/iconPaths.mjs` + `AppIcon.vue`(24 격자·1.75 선) 선 아이콘 세트를 만들고 사이드바·헤더·설정 메뉴·관리자 창에 적용. 라우터의 글자 아이콘은 fallback으로 남김(라우터 데이터 구조 변경 없음).
- 이모지 정리: 메모·루틴 ⚡, D-Day 🔔, 다이어리 📷 제거. D-Day 고정 버튼 aria-label이 바인딩되지 않은 문자열이던 버그 수정(:aria-label·aria-pressed). 자동화 '설정' 링크가 href 없는 a@click이라 키보드 불가 → RouterLink. 다이어리 작성 화면의 고정 날씨 칩('맑음 ☀ · 서울', 데이터 없음) 제거.

## 사용자 변경과 자체 변경 구분
- 사용자 미커밋(손대지 않음): backend PlannerItemQueryRepositoryImpl.java, application.yml, frontend Modal.vue(사용자 변경 위에 얹지 않음), security/ 체크리스트 문서, docs/output/.
- 2026-11-20 사용자 요청으로 자체 변경을 기능 단위 11개 커밋으로 나눔. 사용자 파일은 커밋하지 않음.

## 세션 2 후반 결정
- 통계: 계획 막대(.chart i)를 card + 점선 경계로(색만이 아니라 모양으로 구분), 도넛(.cat>strong) 가운데 card 구멍, 'Plan vs Actual' → '계획 대비 실제', 일간 통계 기간 토글을 세그먼트로, 방해 요인 칩 aria-pressed, 메모 칸 라벨 + '저장되지 않아요' 안내(실제로 저장하지 않음), 갓생 뱃지 이모지 → 선 아이콘.
- 공용: button.review(110여 곳)를 tertiary 규칙으로 통일하고 `.review{padding-top}`은 버튼이 아닌 구획에만. 클래스 없는 링크는 accent+밑줄. 스위치는 꺼짐 surface+control-border(3:1), 켜짐 data 채움+흰 손잡이, 9곳에 aria-label.
- 채팅: .chat-primary를 accent 주 버튼으로(design-tokens 테스트 허용 목록에 추가), 떠 있는 대화 창 그림자 shadow-popover, 'timebar' → 'Timebar Diary · 대화'.
- 커뮤니티 카드: 같은 무게 버튼 둘 → 가입(보조)·둘러보기(글자), 제목 버튼, hover 이동 제거.
- 설정: 알림 이메일 시연 주소(jisoo@timebar.kr) → 로그인 계정 이메일, 알림톡 '인증번호를 보냈어요' → '시연, 실제로 보내지 않아요'(발송 미연결). 섹션 안 이동·중간 확인 버튼은 보조로.
- 관리자 창: BrandMark·'관리자' 칩·'관리자 콘솔' 머리·aria-current.
- DESIGN.md: 콘텐츠 색 토큰 표, 호환 클래스 3행, 앱 셸 구현 문장, 아이콘 구현 문장, 변경 기록 1행 추가.
- 문서 검사 FAIL은 README.md(작성일·목차) 기존 상태 — 이번 작업에서 README를 바꾸지 않음.

## 다음 작업(남은 체크리스트)
- 관리자 계정 로그인 상태로 관리자 화면 확인, 200% 확대·스크린리더 확인.
- 프로젝트 캔버스·WBS·업무 위키·경력·공유 첨부·머니로그 세부 배치.
- 재개 시 첫 명령: `docker compose -f infra/chat/compose.yml up -d --wait`, `cd backend; $env:SERVER_PORT=18080; .\gradlew.bat bootRun --args="--spring.profiles.active=chat-local"`, `cd frontend; $env:DEV_API_TARGET='http://127.0.0.1:18080'; npx vite --host 127.0.0.1 --port 15173` 후 scratchpad pw/shot2.mjs·shot-auth.mjs로 캡처. (8080을 다른 프로그램이 쓰는 환경이면 DEV_API_TARGET으로 백엔드 포트를 맞춘다)

## 세션 3(2026-11-20 밤) 파비콘
- 파비콘이 없었다(public 폴더·icon 링크 없음, 탭 제목은 예전 이름 'Timeflow'). DESIGN.md 7장('파비콘은 심볼만')대로 BrandMark 기하를 포레스트 타일 위 흰색으로 그린 `frontend/public/favicon.svg`를 원본으로 두고, Chrome 렌더링으로 `favicon.ico`(16·32·48)·`apple-touch-icon.png`(180, 모서리 없는 정사각형)를 만들었다. 이미지에 메타데이터 없음.
- `index.html`: icon 링크 3개(ico는 sizes=32x32로 SVG 우선), 제목 'Timebar Diary · 계획과 실제 기록'. 빌드 시 `./favicon.*`로 바뀌어 다른 자산과 같은 경로 규칙을 따른다.
- 앱 스토어 아이콘(android·ios·electron)은 범위 밖이라 바꾸지 않았다.
