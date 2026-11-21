# 작업 계획

- 요청: `docs/design/` v2.1(2026-11-20, Career OS 문서 묶음 01~13)을 분석해 기능·권한·레이아웃을 반영한다. 주축 기능이 "시간관리"에서 "통합 커리어 관리"로 바뀌었다. 한 세션에 끝나지 않는 범위는 예약 작업으로 이어 간다.
- 현재 확인한 사실:
  - 변경 커밋 `16a38d3`가 `docs/design/01~13`과 README를 새로 쓰고 예전 설계 문서를 `docs/design_backup/`으로 옮겼다.
  - 문서 스스로 "후보 ID", "결정 대기(DEC-01~14)", "실행 가능한 SQL이 아님"을 명시한다. 0단계(기준선 정리) → 1단계(IA·UX) → 2단계(커리어 기록) 순서를 요구한다(10-roadmap §2·§4).
  - 경력·이력서·포트폴리오는 `feature_record`(kind 기반 JSON 저장)에 이미 서버 저장된다(`WorkController`, `FeatureType.CAREER/RESUME/PORTFOLIO`). `kind`는 제약 없는 `VARCHAR(40)`이라 새 kind 추가에 마이그레이션이 필요 없다.
  - 사용자 앱 사이드바의 `관리자 콘솔` 버튼은 권한과 관계없이 모든 사용자에게 보인다. 관리자 셸은 `/api/admin/stats` 응답으로 권한을 판정한다.
  - 계정 설정은 `/api/settings/{section}` 허용 구역(`SettingsService.SECTIONS`)에 저장한다.
- 범위(이번 세션):
  1. IA 재구성(03 §2): 사이드바에 `커리어`, `업무·프로젝트` 묶음 추가. 기존 경로는 그대로 둔다(03 §1-1, §4).
  2. 커리어 활동 원장(FD-85 후보, REQ-F24 후보): `FeatureType.CAREER_ACTIVITY` + `/api/career/activities`. DEC-03 현재 제안("기존 저장 구조 우선 재사용")에 따라 `feature_record`를 쓴다.
  3. 취업·이직 지원 관리(FD-88 후보, REQ-F27 후보): `FeatureType.JOB_APPLICATION` + `/api/career/applications`.
  4. 화면: `/career`(커리어 대시보드, MN-130), `/career/activities`(MN-131), `/career/applications`(MN-133). 경력·포트폴리오(MN-51)는 `/work/career` 경로 그대로 커리어 묶음에 둔다.
  5. 커리어 목표(DEC-02 현재 제안): 온보딩·환경설정에서 고르고 언제든 바꾼다. 권한·공개 범위는 바꾸지 않는다(03 §5). 로그인 시 `/api/settings/career`, 로그아웃 시 이 브라우저.
  6. 권한: 관리자 콘솔 진입 버튼을 서버 판정(`adminAccess.state === 'allowed'`)일 때만 노출(03 §8-5, 09 §2).
  7. 문서: API 계약 재생성, DESIGN.md IA 문구, 0단계 정합성 기록(`docs/design/14-baseline-reconciliation.md`).
- 제외(후속 예약): 팀 프로젝트·기여도(FD-91·92), 문서 버전·템플릿(FD-89), 포트폴리오 공개 고도화(FD-90), GitHub·클라우드 연동(FD-93·94, 외부 계정 필요), AI 서버(FD-95·96, DEC-08), 관리자 connector·자동화(FD-97·98), 다국어(FD-99), 통합 검색·내보내기 확장(FD-100), 모바일 하단 탭(03 §7 "검토"), 홈 커리어 위젯.
- 성공 기준:
  - 기존 경로가 모두 그대로 열린다(라우트 목록 비교).
  - 새 API는 JWT subject 기준 소유권, version 충돌, 멱등 키, 입력 검증(링크 스킴·상태값·날짜)을 지킨다. 백엔드 테스트로 증빙한다.
  - 새 화면은 서버/로그아웃 예시 상태를 구분해 표시하고, 빈·로딩·오류·충돌 상태를 가진다.
  - 프런트 테스트·계약 검사·빌드 통과.
- 보안 관련 ID/검증: 소유권(타 계정 404), 요청 본문 userId 불신, 외부 URL은 http/https만 저장하고 서버가 호출하지 않음(SSRF 경계), XSS(링크 href 스킴 제한·텍스트 보간만 사용).
- 접근성 대상/검증: 키보드 탐색, accessible name, 상태를 색 외 문구로 표시, 320/390/768/1024/1440px 가로 넘침.
- 사용자 요청으로 허용된 작업: 문서 기반 기능·권한·레이아웃 수정, 예약 작업 생성. 커밋·푸시는 작업 브랜치 `ccr-e15278ed-dxr6sd` 범위로 진행한다. 결정 대기 항목(DEC-xx)은 확정하지 않고 문서의 "현재 제안"을 되돌릴 수 있게만 적용한다.
