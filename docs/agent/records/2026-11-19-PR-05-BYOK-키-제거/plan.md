# 작업 계획

- 요청: 2026-11-19 "PR-05 진행해줘." 01 PR-05(브라우저 BYOK 키 평문 저장 제거)를 06 IM-05 A안과 09 Q-10(BUG-002 함께 처리)대로 구현한다.
- 현재 확인한 사실
  - `frontend/src/store/aiSettings.js`가 `apiKey`를 포함한 설정 전체를 `localStorage`의 `timeflow.ai.v1`에 평문 저장한다. 키를 읽는 곳은 `isAiReady()`의 빈 값 검사뿐이고 AI 호출 코드는 없다.
  - `isAiReady()`는 서버 제공 상태를 보지 않아 기본 제공(서버)만 골라도 "AI 연동됨"이 된다(BUG-002). 서버 `/api/integrations/capabilities`의 `ai`는 `available=false`다.
  - `aiSettings.js`를 쓰는 화면은 `SettingsAutomationView.vue`, `WbsView.vue`, `CareerDocsView.vue` 셋이고, 모두 라우터에서 바로 불러온다(`router/index.js`, `router/settingsSections.js`). 그래서 모듈 정리가 앱 시작 시 실행된다.
  - 서버 제공 상태 조회는 `features/integrations/useCapabilityStatus.mjs`가 이미 있다(계정 전환·지연 응답 처리 포함).
  - `aiSettings`를 검사하는 테스트가 없다.
- 범위
  - `aiSettings.js`: 저장된 키 삭제, `byok`를 `none`으로, 허용 필드 6개만 저장, 저장값 형식 검사, 서버 제공 상태를 받는 `isAiReady(available)`·`isFeatureOn(id, available)`, 지운 사실 안내 1회.
  - 설정 화면: 서버 상태 기준 배지, BYOK 비활성, 키 입력란 제거, 조회 실패 시 다시 확인, AI 미제공 시 산출물 스위치 비활성.
  - WBS·경력 화면: 서버 상태 기준 안내.
  - 테스트 `frontend/tests/ai-settings.test.mjs` 신규.
  - 문서: 01·03·06·07·08·09·10, dev-docs README, 작업 원장 IMP-005·BUG-002.
- 제외: 서버·DB·API 계약 변경(필요 없음), AI 실제 호출(PR-15), 기존 `.badge`의 muted on surface 대비 문제(PR-11 6단계).
- 성공 기준: UT-110~UT-117 중 Node로 확인할 수 있는 항목 PASS, 수정 전 테스트 실패 확인, Node 테스트 전체·`npm run build:web`·문서 검사 PASS, 서버 `ai`가 `false`일 때 세 화면에 "연동됨"·"켜져 있어요"가 나오지 않음.
- 보안 관련 ID/검증: 비밀값 평문 저장 제거(OWASP A02 암호화 실패·민감 데이터 노출, SW 49 중 중요정보 평문 저장 항목), 사실과 다른 상태 표시 제거(UF-C5). 저장소에 비밀값이 다시 섞이지 않도록 허용 필드 목록으로 저장한다.
- 접근성 대상/검증: BYOK 버튼 `disabled`·`aria-disabled`, 상태 배지 `role="status"`, 조회 실패 안내 `role="alert"`, 비활성 스위치 이유 문구(DESIGN.md 4장 disabled 원칙).
- 사용자 요청으로 이미 허용된 작업과 추가 확인이 필요한 작업: 구현·테스트·문서·의미 단위 커밋은 허용 범위. 푸시·배포는 하지 않는다.
