# 작업 체크리스트

## 1단계(서버 수정 멱등)

- [x] 실제 소스·변경 상태 확인(작업 트리 깨끗, 원격 변경 없음)
- [x] 단계 계획(plan.md, 06 IM-12)
- [x] 서버: `IdempotencyKeys.apply`, 메모·할 일 PUT의 `Idempotency-Key`
- [x] 테스트 2개, 수정 전 실패 확인(07 RUN-115)
- [x] API 계약 생성 문서·목록 갱신
- [x] 보안 점검(키는 기록 ID와 함께 해시, 계정별 키, 실패한 요청은 키 미보관)
- [x] UI 변경 없음(KWCAG N/A)
- [x] 문서(01·05·06·07·09·10, dev-docs README)
- [x] 의미 단위 커밋

## 2단계(대기열 핵심 모듈)

- [x] `outbox.mjs`: 저장소(IndexedDB·메모리), 순서·대상 이어받기, version 확인, 충돌·400 처리, 계정 격리
- [x] Node 테스트 10개, 수정 전 실패 확인(07 RUN-118), 프런트 169개(RUN-119)
- [x] 의미 단위 커밋
- [x] IndexedDB 저장소는 3단계 브라우저 점검(브라우저 재시작 뒤 전송, 07 RUN-122)에서 확인

## 3단계(화면 연결)

- [x] DESIGN.md 확인(callout·button-secondary·status-badge 토큰, accent 미사용, 320px)
- [x] 저장소 연결(요청마다 대기열 선택, 서버 목록 위 대기 행, 대기 중 기록의 다른 변경 막기, 보낸 뒤 다시 불러오기)
- [x] 대기 목록·충돌 비교(`OutboxPanel`), 자동 전송(로그인·연결 복구·화면 복귀)
- [x] 로그아웃 안내(`OutboxLogoutDialog`). 앱에 쓸 수 있는 로그아웃이 없어 보안·계정에 `SignOutSection` 추가
- [x] 테스트 `offline-collection.test.mjs` 5개, 수정 전 실패 확인(07 RUN-120)
- [x] 실제 백엔드 브라우저 15개, PR-08 회귀 13·16개(07 RUN-122). 첫 실행 실패 원인 기록(RUN-121)
- [x] 문서(01·02·04·06·07·09·10, dev-docs README), PR-12 완료 처리
- [x] 의미 단위 커밋
