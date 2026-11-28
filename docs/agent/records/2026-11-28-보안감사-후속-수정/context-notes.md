# 결정·근거·인수인계 메모

- 현재 확인된 구현/설정과 선택한 대안/이유:
  1. refresh 토큰 갱신
     - refresh 토큰에 `av` 클레임을 넣는다(`JwtTokenProvider.createRefreshToken(userId, authVersion)`).
     - 갱신할 때 계정의 `authVersion`과 비교하고, `av`가 없는 옛 토큰도 `TOKEN_EXPIRED`로 거부한다.
     - 폐기는 `revokeByTokenHash`의 갱신 건수가 정확히 1일 때만 성공으로 본다. 동시 갱신이나 이미 폐기된 토큰은 0건이 되어 거부된다.
  2. 관리자 창 세션
     - `session.js`에 `BroadcastChannel('timeflow.auth.v1')`를 둔다.
     - `logout()`은 자기 토큰을 폐기한 뒤 `{type:'logout', userId}`를 알린다.
     - 같은 계정의 다른 창은 알림을 받으면 자기 refresh 토큰을 `/api/auth/logout`으로 폐기하고 세션을 지운다. 다른 계정의 알림은 무시한다.
     - `AdminApp.vue`는 세션이 비고 `window.opener`가 있으면 창을 닫는다. 팝업으로 여는 방식은 그대로다.
     - BroadcastChannel이 없는 환경에는 대체 경로를 두지 않았다.
  3. 포트폴리오 링크 잠금 해제
     - `unlock`에 `@Transactional(noRollbackFor = ApiException.class)`을 붙인다.
     - `store.lock`(SELECT ... FOR UPDATE)으로 다시 읽은 뒤 실패 횟수를 확인하고 더한다. 실패 응답에도 횟수가 커밋된다.
     - 테스트 H2에 `LOCK_TIMEOUT=10000`을 추가했다. 동시 대기가 기본 1초 제한에 걸리지 않게 하기 위해서다.
  4. 비밀번호 변경
     - `ThrottleKeyType.PASSWORD`(키 값은 계정 ID)를 `login_throttle`에 따로 센다. `key_type`은 varchar(10)이고 값 제약이 없어 마이그레이션은 필요 없다.
     - 계정 행을 `UserRepository.findByIdForUpdate`로 잠가 같은 계정의 시도를 한 줄로 세운다. 제한 행이 아직 없을 때 동시에 보낸 첫 시도가 고유 키 충돌로 빠지는 것을 막기 위해서다.
     - 성공했는데 실패 기록이 없으면 행을 만들지 않는다.
     - 잠금이 풀린 뒤 한 번 더 틀리면 바로 다시 잠긴다. 실패 횟수를 0으로 되돌리지 않는 로그인 제한과 같은 동작이다.
  5. 채팅 차단
     - `ChatIdentity.blocked`을 추가했다. 구현(`CoreChatIdentity`)은 `SocialService.blocked`(양방향)를 부른다. 채팅 SQL은 core 표를 직접 읽지 않는다는 포트 경계를 지킨다.
     - 그룹 생성은 만드는 사람과 각 초대 대상 사이만 확인한다. 초대 대상끼리의 차단은 보지 않는다. 기존 그룹방을 그대로 두는 결정과 맞추기 위해서다.
     - 같은 요청 ID의 재시도는 차단 확인 전에 처음 결과를 돌려준다.
- 문서:
  - API 명세는 생성기(`frontend/scripts/frontend-api-contract.mjs`)에 `PUT /api/user/password` 설명을 추가한 뒤 다시 생성했다. 바뀐 것은 설명 줄뿐이다.
  - DB 문서는 `login_throttle.key_type` 의미를 갱신했다.
  - 채팅 문서는 `docs/chat/architecture.md`와 `docs/api/api-design.md`를 갱신했다.
- 오탐/예외와 근거·승인 상태: 없음.
- 사용자 변경과 자체 변경 구분:
  - 이 작업 전부터 있던 사용자 변경: `backend/src/main/resources/application.yml`, `frontend/src/features/career/careerGoal.mjs`, `skills-lock.json`, Career-OS 작업 기록 폴더.
  - 그 밖의 변경은 이 작업에서 만들었다. 목록은 verification.md에 있다.
- 다음 작업·미확인:
  - 실제 브라우저에서 두 창 로그아웃 동작을 확인하지 않았다(NOT_RUN).
  - MySQL에서의 행 잠금 동작은 H2 테스트로만 확인했다(REVIEW).
  - 프런트엔드는 아직 `PUT /api/user/password`를 부르지 않는다. 화면 문구 연결은 없다.
- 마지막 실행 명령·종료 코드·증거 경로: verification.md 참고.
