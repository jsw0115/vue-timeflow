# 전체 목표 API 목록

> 2026-09-27 현재 구현은 [104개 소스 API 목록](../api/current-api-inventory.md)을 따른다. 새 [채팅 15개](../chat/api/catalog.md) 및 [Redis 연동 목록](../chat/redis/api-catalog.md)은 `/api/chat` 기준으로 별도 관리한다. 아래 169개는 `/api/v1` 목표 계약이며 구현 API 수와 합산하지 않는다.

기준 2026-09-26 · 전부 설계/미구현. 기존 114개 범위 보존, 추가 55개, 총 169개. 앞부분은 /api/v1.

| ID | Method | Path | 기능 | 상세 문서 |
|---|---|---|---|---|
| AUTH-01 | POST | /auth/signup | 이메일 회원가입 | [인증·사용자·기기](01-auth-users.md#auth-01) |
| AUTH-02 | POST | /auth/login | 브라우저 로그인 | [인증·사용자·기기](01-auth-users.md#auth-02) |
| AUTH-03 | POST | /auth/refresh | 브라우저 토큰 회전 | [인증·사용자·기기](01-auth-users.md#auth-03) |
| AUTH-04 | POST | /auth/logout | 브라우저 현재 세션 폐기 | [인증·사용자·기기](01-auth-users.md#auth-04) |
| AUTH-05 | POST | /auth/password-reset-requests | 재설정 이메일 요청 | [인증·사용자·기기](01-auth-users.md#auth-05) |
| AUTH-06 | POST | /auth/password-resets | 비밀번호 재설정 | [인증·사용자·기기](01-auth-users.md#auth-06) |
| AUTH-07 | GET | /me | 내 프로필 조회 | [인증·사용자·기기](01-auth-users.md#auth-07) |
| AUTH-08 | PATCH | /me | 내 프로필 수정 | [인증·사용자·기기](01-auth-users.md#auth-08) |
| AUTH-09 | PUT | /me/onboarding | 최초 모드·시간대 설정 | [인증·사용자·기기](01-auth-users.md#auth-09) |
| SESSION-01 | GET | /me/sessions | 내 기기 세션 조회 | [인증·사용자·기기](01-auth-users.md#session-01) |
| SESSION-02 | DELETE | /me/sessions/{id} | 기기 세션 폐기 | [인증·사용자·기기](01-auth-users.md#session-02) |
| DEVICE-01 | PUT | /me/devices/{deviceId} | 알림 수신 기기 등록 | [인증·사용자·기기](01-auth-users.md#device-01) |
| DEVICE-02 | DELETE | /me/devices/{deviceId} | 기기 등록 해제 | [인증·사용자·기기](01-auth-users.md#device-02) |
| OAUTH-01 | POST | /auth/oauth/{provider}/exchange | 브라우저 OAuth 코드 교환 | [인증·사용자·기기](01-auth-users.md#oauth-01) |
| OAUTH-02 | POST | /auth/oauth/authorizations | OAuth 인증 시도 생성 | [인증·사용자·기기](01-auth-users.md#oauth-02) |
| NATIVE-01 | POST | /auth/native/login | 네이티브 로그인 | [인증·사용자·기기](01-auth-users.md#native-01) |
| NATIVE-02 | POST | /auth/native/refresh | 네이티브 토큰 회전 | [인증·사용자·기기](01-auth-users.md#native-02) |
| NATIVE-03 | POST | /auth/native/logout | 네이티브 세션 폐기 | [인증·사용자·기기](01-auth-users.md#native-03) |
| NATIVE-04 | POST | /auth/native/oauth/{provider}/exchange | 네이티브 OAuth 코드 교환 | [인증·사용자·기기](01-auth-users.md#native-04) |
| PLAN-01 | GET | /planner/items | 일정 탭 통합 필터 조회 | [플래너·일정·할 일](02-planner-events-tasks.md#plan-01) |
| PLAN-02 | GET | /planner/summary | 필터 적용 전체 기간 집계 | [플래너·일정·할 일](02-planner-events-tasks.md#plan-02) |
| EVENT-01 | GET | /events/{id} | 일정 상세 | [플래너·일정·할 일](02-planner-events-tasks.md#event-01) |
| EVENT-02 | POST | /events | 일정 생성 | [플래너·일정·할 일](02-planner-events-tasks.md#event-02) |
| EVENT-03 | PATCH | /events/{id} | 일정 부분 수정 | [플래너·일정·할 일](02-planner-events-tasks.md#event-03) |
| EVENT-04 | DELETE | /events/{id} | 일정 휴지통 이동 | [플래너·일정·할 일](02-planner-events-tasks.md#event-04) |
| EVENT-05 | GET | /events | 일정 목록 | [플래너·일정·할 일](02-planner-events-tasks.md#event-05) |
| REPEAT-01 | POST | /events/series | 반복 일정 생성 | [플래너·일정·할 일](02-planner-events-tasks.md#repeat-01) |
| REPEAT-02 | PATCH | /events/{id}/occurrences/{occurrenceKey} | 반복 회차 수정 | [플래너·일정·할 일](02-planner-events-tasks.md#repeat-02) |
| REPEAT-03 | DELETE | /events/{id}/occurrences/{occurrenceKey} | 반복 회차 취소 | [플래너·일정·할 일](02-planner-events-tasks.md#repeat-03) |
| TASK-01 | GET | /tasks | 할 일 목록 | [플래너·일정·할 일](02-planner-events-tasks.md#task-01) |
| TASK-02 | GET | /tasks/{id} | 할 일 상세 | [플래너·일정·할 일](02-planner-events-tasks.md#task-02) |
| TASK-03 | POST | /tasks | 할 일 작성 | [플래너·일정·할 일](02-planner-events-tasks.md#task-03) |
| TASK-04 | PATCH | /tasks/{id} | 할 일 부분 수정 | [플래너·일정·할 일](02-planner-events-tasks.md#task-04) |
| TASK-05 | PUT | /tasks/{id}/status | 할 일 목표 상태 지정 | [플래너·일정·할 일](02-planner-events-tasks.md#task-05) |
| TASK-06 | DELETE | /tasks/{id} | 할 일 삭제 | [플래너·일정·할 일](02-planner-events-tasks.md#task-06) |
| TASK-07 | POST | /tasks/{id}/duplicates | 할 일 복제 | [플래너·일정·할 일](02-planner-events-tasks.md#task-07) |
| TASK-08 | GET | /tasks/{id}/rollovers | 자동 이월 이력 | [플래너·일정·할 일](02-planner-events-tasks.md#task-08) |
| POLICY-01 | GET | /me/task-rollover-policy | 자동 이월 정책 조회 | [플래너·일정·할 일](02-planner-events-tasks.md#policy-01) |
| POLICY-02 | PUT | /me/task-rollover-policy | 자동 이월 정책 저장 | [플래너·일정·할 일](02-planner-events-tasks.md#policy-02) |
| DDAY-01 | GET | /ddays | D-Day 목록 | [플래너·일정·할 일](02-planner-events-tasks.md#dday-01) |
| DDAY-02 | POST | /ddays | D-Day 생성 | [플래너·일정·할 일](02-planner-events-tasks.md#dday-02) |
| DDAY-03 | PATCH | /ddays/{id} | D-Day 수정 | [플래너·일정·할 일](02-planner-events-tasks.md#dday-03) |
| DDAY-04 | DELETE | /ddays/{id} | D-Day 삭제 | [플래너·일정·할 일](02-planner-events-tasks.md#dday-04) |
| ROUTINE-01 | GET | /routines | 루틴 목록 | [루틴·타임바·집중](03-routines-time.md#routine-01) |
| ROUTINE-02 | POST | /routines | 루틴 만들기 | [루틴·타임바·집중](03-routines-time.md#routine-02) |
| ROUTINE-03 | GET | /routines/{id} | 루틴 상세 | [루틴·타임바·집중](03-routines-time.md#routine-03) |
| ROUTINE-04 | PATCH | /routines/{id} | 루틴 수정 | [루틴·타임바·집중](03-routines-time.md#routine-04) |
| ROUTINE-05 | DELETE | /routines/{id} | 루틴 삭제 | [루틴·타임바·집중](03-routines-time.md#routine-05) |
| ROUTINE-06 | PUT | /routines/{id}/logs/{date} | 날짜별 목표 달성 상태 | [루틴·타임바·집중](03-routines-time.md#routine-06) |
| ROUTINE-07 | GET | /routines/{id}/history | 루틴 달성 이력 | [루틴·타임바·집중](03-routines-time.md#routine-07) |
| TIME-01 | GET | /time-entries | 계획·실제 시간 블록 | [루틴·타임바·집중](03-routines-time.md#time-01) |
| TIME-02 | POST | /time-entries | 시간 블록 생성 | [루틴·타임바·집중](03-routines-time.md#time-02) |
| TIME-03 | PATCH | /time-entries/{id} | 시간 블록 수정 | [루틴·타임바·집중](03-routines-time.md#time-03) |
| TIME-04 | DELETE | /time-entries/{id} | 시간 블록 삭제 | [루틴·타임바·집중](03-routines-time.md#time-04) |
| FOCUS-01 | POST | /focus-sessions | 집중 시작 | [루틴·타임바·집중](03-routines-time.md#focus-01) |
| FOCUS-02 | PUT | /focus-sessions/{id}/completion | 집중 종료 및 타임바 연결 | [루틴·타임바·집중](03-routines-time.md#focus-02) |
| DIARY-01 | GET | /diaries | 일간 회고 캘린더·목록 | [다이어리·메모·태그·멘션](04-diary-memos-tags.md#diary-01) |
| DIARY-02 | GET | /diaries/{date} | 일간 회고 상세 | [다이어리·메모·태그·멘션](04-diary-memos-tags.md#diary-02) |
| DIARY-03 | PUT | /diaries/{date} | 일간 회고 저장 | [다이어리·메모·태그·멘션](04-diary-memos-tags.md#diary-03) |
| DIARY-04 | DELETE | /diaries/{date} | 일간 회고 삭제 | [다이어리·메모·태그·멘션](04-diary-memos-tags.md#diary-04) |
| MEMO-01 | GET | /memos | 메모 인박스 | [다이어리·메모·태그·멘션](04-diary-memos-tags.md#memo-01) |
| MEMO-02 | POST | /memos | 메모 작성 | [다이어리·메모·태그·멘션](04-diary-memos-tags.md#memo-02) |
| MEMO-03 | GET | /memos/{id} | 메모 상세 | [다이어리·메모·태그·멘션](04-diary-memos-tags.md#memo-03) |
| MEMO-04 | PATCH | /memos/{id} | 메모 수정 | [다이어리·메모·태그·멘션](04-diary-memos-tags.md#memo-04) |
| MEMO-05 | DELETE | /memos/{id} | 메모 삭제 | [다이어리·메모·태그·멘션](04-diary-memos-tags.md#memo-05) |
| TAG-01 | GET | /tags | 내 태그 및 사용 횟수 | [다이어리·메모·태그·멘션](04-diary-memos-tags.md#tag-01) |
| TAG-02 | GET | /tags/{tag}/posts | 태그에 해당하는 권한 내 글 | [다이어리·메모·태그·멘션](04-diary-memos-tags.md#tag-02) |
| MENTION-01 | GET | /mentions | 나를 언급한 글 알림 | [다이어리·메모·태그·멘션](04-diary-memos-tags.md#mention-01) |
| MENTION-02 | PUT | /mentions/{id}/read | 멘션 읽음 지정 | [다이어리·메모·태그·멘션](04-diary-memos-tags.md#mention-02) |
| MENTION-03 | GET | /mention-candidates | 주소록 기반 멘션 후보 | [다이어리·메모·태그·멘션](04-diary-memos-tags.md#mention-03) |
| AI-01 | POST | /memos/{id}/task-suggestions | 메모에서 할 일 후보 생성 | [다이어리·메모·태그·멘션](04-diary-memos-tags.md#ai-01) |
| AI-02 | POST | /diaries/{date}/suggestions | 회고 초안 작업 | [다이어리·메모·태그·멘션](04-diary-memos-tags.md#ai-02) |
| AI-03 | GET | /ai-jobs/{id} | AI·STT 작업 결과 | [다이어리·메모·태그·멘션](04-diary-memos-tags.md#ai-03) |
| STT-01 | POST | /memos/{id}/transcriptions | 음성 메모 텍스트 변환 | [다이어리·메모·태그·멘션](04-diary-memos-tags.md#stt-01) |
| WBS-01 | GET | /work/wbs | WBS 계층 조회 | [WBS·근무·휴가·이직](05-work-career.md#wbs-01) |
| WBS-02 | POST | /work/wbs | WBS 작업 추가 | [WBS·근무·휴가·이직](05-work-career.md#wbs-02) |
| WBS-03 | GET | /work/wbs/{id} | WBS 상세 | [WBS·근무·휴가·이직](05-work-career.md#wbs-03) |
| WBS-04 | PATCH | /work/wbs/{id} | WBS 기간·담당·공수 수정 | [WBS·근무·휴가·이직](05-work-career.md#wbs-04) |
| WBS-05 | DELETE | /work/wbs/{id} | 말단 WBS 작업 삭제 | [WBS·근무·휴가·이직](05-work-career.md#wbs-05) |
| WORK-01 | GET | /work/records | 근무·휴가·커리어 목록 | [WBS·근무·휴가·이직](05-work-career.md#work-01) |
| WORK-02 | POST | /work/records | 연차·반차·외근·출장·이직 작성 | [WBS·근무·휴가·이직](05-work-career.md#work-02) |
| WORK-03 | GET | /work/records/{id} | 업무 기록 상세 | [WBS·근무·휴가·이직](05-work-career.md#work-03) |
| WORK-04 | PATCH | /work/records/{id} | 업무 기록 수정 | [WBS·근무·휴가·이직](05-work-career.md#work-04) |
| WORK-05 | DELETE | /work/records/{id} | 업무 기록 삭제 | [WBS·근무·휴가·이직](05-work-career.md#work-05) |
| COMMUNITY-01 | GET | /community/posts | 커뮤니티 게시글 목록 | [커뮤니티·챌린지](06-community-challenges.md#community-01) |
| COMMUNITY-02 | POST | /community/posts | 공유 미리보기 확정 후 사본 게시 | [커뮤니티·챌린지](06-community-challenges.md#community-02) |
| COMMUNITY-03 | DELETE | /community/posts/{id} | 본인·운영자 게시글 삭제 | [커뮤니티·챌린지](06-community-challenges.md#community-03) |
| COMMUNITY-04 | GET | /communities | 커뮤니티 검색·내 가입 목록 | [커뮤니티·챌린지](06-community-challenges.md#community-04) |
| COMMUNITY-05 | POST | /communities | 커뮤니티 생성 | [커뮤니티·챌린지](06-community-challenges.md#community-05) |
| COMMUNITY-06 | GET | /communities/{id} | 커뮤니티 상세 | [커뮤니티·챌린지](06-community-challenges.md#community-06) |
| COMMUNITY-07 | PATCH | /communities/{id} | 방장 커뮤니티 설정 수정 | [커뮤니티·챌린지](06-community-challenges.md#community-07) |
| COMMUNITY-08 | DELETE | /communities/{id} | 방장 커뮤니티 삭제 | [커뮤니티·챌린지](06-community-challenges.md#community-08) |
| COMMUNITY-09 | POST | /communities/{id}/join-requests | 가입 또는 승인 신청 | [커뮤니티·챌린지](06-community-challenges.md#community-09) |
| COMMUNITY-10 | PUT | /communities/{id}/join-requests/{userId} | 가입 신청 승인·거절 | [커뮤니티·챌린지](06-community-challenges.md#community-10) |
| COMMUNITY-11 | DELETE | /communities/{id}/members/me | 커뮤니티 탈퇴 | [커뮤니티·챌린지](06-community-challenges.md#community-11) |
| COMMUNITY-12 | GET | /communities/{id}/members | 승인 멤버·신청자 조회 | [커뮤니티·챌린지](06-community-challenges.md#community-12) |
| COMMUNITY-13 | PATCH | /community/posts/{id} | 내 게시글 수정 | [커뮤니티·챌린지](06-community-challenges.md#community-13) |
| COMMUNITY-14 | GET | /community/posts/{id} | 게시글 상세 | [커뮤니티·챌린지](06-community-challenges.md#community-14) |
| CHALLENGE-01 | GET | /challenges | 참여 가능한 챌린지 | [커뮤니티·챌린지](06-community-challenges.md#challenge-01) |
| CHALLENGE-02 | POST | /challenges | 가입 커뮤니티에 챌린지 생성 | [커뮤니티·챌린지](06-community-challenges.md#challenge-02) |
| CHALLENGE-03 | GET | /challenges/{id} | 챌린지 상세 | [커뮤니티·챌린지](06-community-challenges.md#challenge-03) |
| CHALLENGE-04 | PATCH | /challenges/{id} | 생성자 챌린지 수정 | [커뮤니티·챌린지](06-community-challenges.md#challenge-04) |
| CHALLENGE-05 | DELETE | /challenges/{id} | 생성자 챌린지 취소 | [커뮤니티·챌린지](06-community-challenges.md#challenge-05) |
| CHALLENGE-06 | PUT | /challenges/{id}/participants/me | 챌린지 참여 | [커뮤니티·챌린지](06-community-challenges.md#challenge-06) |
| CHALLENGE-07 | DELETE | /challenges/{id}/participants/me | 챌린지 참여 취소 | [커뮤니티·챌린지](06-community-challenges.md#challenge-07) |
| CHALLENGE-08 | PUT | /challenges/{id}/check-ins/{date} | 일일 인증 | [커뮤니티·챌린지](06-community-challenges.md#challenge-08) |
| RANK-01 | GET | /community/rankings | 동의 기반 달성률 순위 | [커뮤니티·챌린지](06-community-challenges.md#rank-01) |
| STICKER-01 | GET | /me/achievements | 달성 스티커 | [커뮤니티·챌린지](06-community-challenges.md#sticker-01) |
| SHARE-01 | GET | /friends | 친구 목록 | [채팅·친구·그룹·공유](07-chat-sharing.md#share-01) |
| SHARE-02 | POST | /friend-invitations | 친구 초대 | [채팅·친구·그룹·공유](07-chat-sharing.md#share-02) |
| SHARE-03 | PUT | /friend-invitations/{id}/response | 받은 친구 초대 처리 | [채팅·친구·그룹·공유](07-chat-sharing.md#share-03) |
| SHARE-04 | DELETE | /friends/{id} | 친구 관계 해제 | [채팅·친구·그룹·공유](07-chat-sharing.md#share-04) |
| GROUP-01 | GET | /calendar-groups | 내 캘린더 그룹 | [채팅·친구·그룹·공유](07-chat-sharing.md#group-01) |
| GROUP-02 | POST | /calendar-groups | 캘린더 그룹 생성 | [채팅·친구·그룹·공유](07-chat-sharing.md#group-02) |
| GROUP-03 | PATCH | /calendar-groups/{id} | 그룹 수정 | [채팅·친구·그룹·공유](07-chat-sharing.md#group-03) |
| GROUP-04 | DELETE | /calendar-groups/{id} | 그룹 삭제 | [채팅·친구·그룹·공유](07-chat-sharing.md#group-04) |
| GROUP-05 | GET | /calendar-groups/{id}/members | 그룹 멤버 | [채팅·친구·그룹·공유](07-chat-sharing.md#group-05) |
| GROUP-06 | POST | /calendar-groups/{id}/invitations | 그룹 초대 | [채팅·친구·그룹·공유](07-chat-sharing.md#group-06) |
| GROUP-07 | PUT | /calendar-groups/{id}/members/{userId} | 그룹 권한 변경 | [채팅·친구·그룹·공유](07-chat-sharing.md#group-07) |
| GROUP-08 | DELETE | /calendar-groups/{id}/members/{userId} | 그룹 멤버 제거 | [채팅·친구·그룹·공유](07-chat-sharing.md#group-08) |
| GROUP-09 | PUT | /calendar-group-invitations/{id}/response | 받은 그룹 초대 수락·거절 | [채팅·친구·그룹·공유](07-chat-sharing.md#group-09) |
| ACL-01 | GET | /events/{id}/shares | 일정 공유 정책 | [채팅·친구·그룹·공유](07-chat-sharing.md#acl-01) |
| ACL-02 | PUT | /events/{id}/shares/{userId} | 일정 공유 권한 지정 | [채팅·친구·그룹·공유](07-chat-sharing.md#acl-02) |
| ACL-03 | DELETE | /events/{id}/shares/{userId} | 일정 공유 철회 | [채팅·친구·그룹·공유](07-chat-sharing.md#acl-03) |
| BLOCK-01 | PUT | /me/blocks/{userId} | 사용자 차단 | [채팅·친구·그룹·공유](07-chat-sharing.md#block-01) |
| BLOCK-02 | DELETE | /me/blocks/{userId} | 차단 해제 | [채팅·친구·그룹·공유](07-chat-sharing.md#block-02) |
| CHAT-01 | GET | /chat/rooms/{id}/messages | 대화방 메시지 조회 | [채팅·친구·그룹·공유](07-chat-sharing.md#chat-01) |
| CHAT-02 | POST | /chat/rooms/{id}/messages | 메시지 전송 | [채팅·친구·그룹·공유](07-chat-sharing.md#chat-02) |
| CHAT-03 | GET | /chat/rooms | 내 채팅방 | [채팅·친구·그룹·공유](07-chat-sharing.md#chat-03) |
| CHAT-04 | POST | /chat/rooms | DM·그룹 채팅 생성 | [채팅·친구·그룹·공유](07-chat-sharing.md#chat-04) |
| CHAT-05 | PUT | /chat/rooms/{id}/read | 읽음 위치 지정 | [채팅·친구·그룹·공유](07-chat-sharing.md#chat-05) |
| CHAT-06 | DELETE | /chat/rooms/{id}/members/me | 대화방 나가기 | [채팅·친구·그룹·공유](07-chat-sharing.md#chat-06) |
| HOME-01 | GET | /home/summary | 오늘 요약 | [홈·통계·알림](08-home-statistics.md#home-01) |
| HOME-02 | GET | /notifications | 알림 인박스 | [홈·통계·알림](08-home-statistics.md#home-02) |
| HOME-03 | PUT | /notifications/{id}/read | 알림 읽음 지정 | [홈·통계·알림](08-home-statistics.md#home-03) |
| HOME-04 | POST | /notifications/read-all | 지정 시각 이전 알림 읽음 | [홈·통계·알림](08-home-statistics.md#home-04) |
| STAT-01 | GET | /statistics/overview | 달성률 통합 통계 | [홈·통계·알림](08-home-statistics.md#stat-01) |
| STAT-02 | GET | /statistics/plan-actual | 계획·실제 시간 비교 | [홈·통계·알림](08-home-statistics.md#stat-02) |
| SET-01 | GET | /me/settings | 환경설정 조회 | [설정·연동·동기화·관리자](09-settings-integrations-admin.md#set-01) |
| SET-02 | PATCH | /me/settings | 환경설정 수정 | [설정·연동·동기화·관리자](09-settings-integrations-admin.md#set-02) |
| SET-03 | GET | /categories | 시스템·내 분류 | [설정·연동·동기화·관리자](09-settings-integrations-admin.md#set-03) |
| SET-04 | POST | /categories | 사용자 분류 생성 | [설정·연동·동기화·관리자](09-settings-integrations-admin.md#set-04) |
| SET-05 | PATCH | /categories/{id} | 사용자 분류 수정 | [설정·연동·동기화·관리자](09-settings-integrations-admin.md#set-05) |
| SET-06 | DELETE | /categories/{id} | 분류 삭제·기존 스냅샷 유지 | [설정·연동·동기화·관리자](09-settings-integrations-admin.md#set-06) |
| DASH-01 | GET | /me/dashboard-layout | 모드·기기별 홈 배치 | [설정·연동·동기화·관리자](09-settings-integrations-admin.md#dash-01) |
| DASH-02 | PUT | /me/dashboard-layout | 홈 포틀릿 배치 저장 | [설정·연동·동기화·관리자](09-settings-integrations-admin.md#dash-02) |
| SYNC-01 | GET | /sync/changes | 변경·삭제 증분 조회 | [설정·연동·동기화·관리자](09-settings-integrations-admin.md#sync-01) |
| SYNC-02 | POST | /sync/mutations | 오프라인 변경 배치 | [설정·연동·동기화·관리자](09-settings-integrations-admin.md#sync-02) |
| SEARCH-01 | GET | /search | 권한 내 통합 검색 | [설정·연동·동기화·관리자](09-settings-integrations-admin.md#search-01) |
| TRASH-01 | GET | /trash | 휴지통 목록 | [설정·연동·동기화·관리자](09-settings-integrations-admin.md#trash-01) |
| TRASH-02 | POST | /trash/{type}/{id}/restore | 보관기간 내 복구 | [설정·연동·동기화·관리자](09-settings-integrations-admin.md#trash-02) |
| EXPORT-01 | POST | /data-jobs | 데이터 내보내기·가져오기 작업 | [설정·연동·동기화·관리자](09-settings-integrations-admin.md#export-01) |
| EXPORT-02 | GET | /data-jobs/{id} | 데이터 작업 상태 | [설정·연동·동기화·관리자](09-settings-integrations-admin.md#export-02) |
| FILE-01 | POST | /uploads | 제한된 업로드 URL 발급 | [설정·연동·동기화·관리자](09-settings-integrations-admin.md#file-01) |
| FILE-02 | POST | /uploads/{id}/complete | 업로드 검증·검사 접수 | [설정·연동·동기화·관리자](09-settings-integrations-admin.md#file-02) |
| FILE-03 | GET | /files/{id}/download | 소유·공유 권한 확인 후 다운로드 URL | [설정·연동·동기화·관리자](09-settings-integrations-admin.md#file-03) |
| FILE-04 | GET | /uploads/{id} | 파일 검사 상태 조회 | [설정·연동·동기화·관리자](09-settings-integrations-admin.md#file-04) |
| CALSYNC-01 | POST | /calendar-connections | 외부 캘린더 연결 | [설정·연동·동기화·관리자](09-settings-integrations-admin.md#calsync-01) |
| CALSYNC-02 | POST | /calendar-connections/{id}/sync-jobs | 외부 캘린더 동기화 접수 | [설정·연동·동기화·관리자](09-settings-integrations-admin.md#calsync-02) |
| CALSYNC-03 | GET | /calendar-connections | 외부 캘린더 연결 목록 | [설정·연동·동기화·관리자](09-settings-integrations-admin.md#calsync-03) |
| CALSYNC-04 | DELETE | /calendar-connections/{id} | 토큰 폐기·캘린더 연결 해제 | [설정·연동·동기화·관리자](09-settings-integrations-admin.md#calsync-04) |
| CALSYNC-05 | GET | /calendar-sync-jobs/{id} | 캘린더 동기화 작업 상태 | [설정·연동·동기화·관리자](09-settings-integrations-admin.md#calsync-05) |
| CALSYNC-06 | POST | /calendar-connections/authorizations | 캘린더 OAuth 시도 생성 | [설정·연동·동기화·관리자](09-settings-integrations-admin.md#calsync-06) |
| REPORT-01 | POST | /reports/jobs | 보고서 생성 작업 | [설정·연동·동기화·관리자](09-settings-integrations-admin.md#report-01) |
| REPORT-02 | GET | /reports/{id} | 보고서 조회 | [설정·연동·동기화·관리자](09-settings-integrations-admin.md#report-02) |
| REPORT-03 | GET | /report-jobs/{id} | 보고서 작업 상태 | [설정·연동·동기화·관리자](09-settings-integrations-admin.md#report-03) |
| ADMIN-01 | GET | /admin/users | 관리자 사용자 조회 | [설정·연동·동기화·관리자](09-settings-integrations-admin.md#admin-01) |
| ADMIN-02 | PATCH | /admin/users/{id}/status | 관리자 계정 상태 변경 | [설정·연동·동기화·관리자](09-settings-integrations-admin.md#admin-02) |
| ADMIN-03 | GET | /admin/audit-logs | 관리자 감사 로그 조회 | [설정·연동·동기화·관리자](09-settings-integrations-admin.md#admin-03) |
