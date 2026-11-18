# 결정·근거·인수인계 메모

- 현재 확인된 구현/설정: 입력 규칙은 `postValidation.mjs`, `recurrence.mjs`, `FeatureInput.java`, `FeatureType.java`, `PasswordPolicy.java`, `ErrorCode.java`, `ActualRecordingService.java`, `BackupService.java`, `TaskChecklistService.java`, `WorkService.java`, `AuthController.java`에서 확인했다.
- 선택한 대안/이유: 03(FD)·07(TS)을 키우지 않고 08로 분리했다(사용자 선택). 새 ID 종류 UF·UT·Q를 README ID 규칙에 추가했다.
- 정정: 테스트 케이스 합계를 처음 95개로 적었으나 스크립트로 세어 96개(작성 필요 53개)로 고쳤다. UT-96의 JSON 깊이 경계는 시작값을 확인하지 못해 확정 숫자 대신 확인 지시로 적었다.
- 오탐/예외와 근거·승인 상태: 없음.
- 다음 작업·미확인: Q-01~Q-09 결정. "기존 관련 테스트 있음" 43개가 실제로 해당 UT를 검사하는지 확인. UT 구현은 PR 착수 시 진행.
- 마지막 실행 명령·종료 코드·증거 경로: verification.md 참고.
- 완료한 체크리스트 항목과 남은 작업: checklist.md 전체 완료.
- 중단 원인과 재개 시 첫 명령: 중단 없음. 재개 시 08 문서의 Q 표부터 확인한다.
- 사용자 변경과 자체 변경 구분: `PlannerItemQueryRepositoryImpl.java`, `Modal.vue`, `docs/output/`은 기존 사용자 변경이며 건드리지 않았다.

## 2026-11-18 Q-01~Q-18 권장 결정

- 사용자가 결정을 위임했다(보안·유지보수 기준). 결과는 09 v1.1 "권장 결정" 절에 기록했다.
- 소스로 확인한 사실: 로그인 잠금 5회·15분(`LoginThrottleEntity`), 잠금 검사가 사용자 조회보다 먼저다. 비밀번호 재설정 화면은 서버 호출 없이 완료 문구를 띄우고, 서버에 재설정 경로가 없다. 기분 값은 작성 창(한국어)과 다이어리 화면(이모지)이 다르다. 화면 루틴 검증은 모든 반복에 요일을 요구한다.
- Q-16·Q-18은 저장소에 없는 사실이라 방식·조건만 정했다.
