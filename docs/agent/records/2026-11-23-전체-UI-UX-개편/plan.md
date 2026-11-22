# 작업 계획

- 요청(2026-11-23): ui-ux-pro-max 스킬로 프로젝트 전체 UI/UX를 개편한다(레이아웃·테마·디자인 시스템·공통 컴포넌트·반응형·접근성). API·라우팅·인증·비즈니스 로직은 바꾸지 않는다.
- 현재 확인한 사실: Vue 3 + Vite, 라이브러리 없는 CSS 토큰 체계(tokens.css → styles.css → interaction.css → typography.css → components.css 순서), 자체 선 아이콘(AppIcon). DESIGN.md(2026-11-20 판)가 라이트+포레스트·Pretendard·JetBrains Mono를 계약으로 둔다. 2026-11-22 데모 캡처 106장으로 화면을 진단했다.
- 스킬 검색: `--design-system`(productivity planner time tracking career workspace, density 7·variance 3·motion 2) → 스타일 Minimalism & Swiss(대시보드·SaaS 적합) 채택. 제안 팔레트(틸+주황 두 강조색)는 DESIGN.md의 "강조 하나"·포레스트 브랜드와 맞지 않아 채택하지 않음. 제안 글꼴 Plus Jakarta Sans는 한글이 없어 탈락 → google-fonts 검색(Noto Sans KR 9굵기, Nanum Gothic 3굵기)과 비교해 이미 쓰는 Pretendard Variable(한글·라틴 조화, 가변 굵기)을 유지. UX 검색은 empty state·active state·table·breadcrumb 일반 규칙만 일치, header 검색과 Vue stack 검색은 일치 결과 없음.
- 범위: 디자인 토큰 보강, 앱 셸(LNB·헤더), 공통 규칙(한국어 줄바꿈·모노 폴백·표 행·숫자 열), 진단에서 나온 화면별 결함 수정, DESIGN.md 계약 갱신.
- 제외: 팔레트·글꼴 교체(계약 유지 결정), API·라우터·스토어 동작 변경, 새 라이브러리, 토스트·페이지네이션 같은 새 컴포넌트 추가(쓰는 화면이 없음).
- 성공 기준: 시험·빌드 통과(기존 UT-235 제외), 320·390px 가로 넘침 0, 1440px 전 화면 재캡처 검수.
- 보안: 입력·인증·권한·쿼리 변경 없음 — N/A.
- 접근성: D-Day 고정 버튼 aria-label 바인딩 버그, 메뉴 묶음 aria-expanded, 아이콘 버튼 이름, 색 외 상태 표시.
