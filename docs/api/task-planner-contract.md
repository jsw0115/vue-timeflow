# 체크리스트·담당자·플래너 설정 API

2026-10-03 · 현행 `/api` 계약 · Java 소스 구현 · 단위 및 MockMvc 검증 대상. Bearer JWT가 필요하며, 응답은 기존 `{success, data, message}` 구조다. 204에는 본문이 없다. 프런트엔드의 로컬 글 저장은 아직 이 API를 호출하지 않는다.

처리 흐름·모듈·코딩 규칙은 [사전 설계](implementation-plan-2026-10-03.md), 전체 상태는 [API 목록](current-api-inventory.md), 자동 추출 타입은 [현재 상세 계약](../api-info/current-contract.md)을 참고한다.

## 접근 및 버전

모든 할 일 API는 JWT 사용자 본인이 소유한 미삭제 할 일만 접근한다. 타인·미존재·삭제된 할 일 및 다른 할 일의 체크리스트 ID는 404다. 비활성 계정의 남아 있는 토큰으로 접근하면 403이다. 담당자 후보 등록은 공유 권한을 부여하지 않는다. 요청의 임의 ownerId/userId 필드는 소유권 결정에 사용하지 않는다.

체크리스트의 응답 `version`은 처음 저장하면 1이다. 수정·완료 지정의 본문과 삭제의 쿼리에 마지막 조회 버전을 전송한다. 다른 요청이 먼저 변경하면 409를 반환한다. 완료 상태는 토글하지 않고 `completed` 값으로 지정한다. 같은 값을 최신 버전으로 다시 지정하면 완료 상태가 유지되고 버전은 변하지 않을 수 있다. JPA 내부 DB 버전은 0부터 시작하며 공개 버전은 DB 버전 + 1이다.

## 구현 목록

| Method | 경로 | 요청 | 성공 | 상태 |
|---|---|---|---|---|
| GET | /api/tasks/{taskId}/checklist-items | 본문 없음 | 200 ChecklistItemResponse[] | 구현 완료 |
| POST | /api/tasks/{taskId}/checklist-items | title, assigneeId? | 201 ChecklistItemResponse | 구현 완료 |
| PUT | /api/tasks/{taskId}/checklist-items/{itemId} | title, assigneeId?, version | 200 ChecklistItemResponse | 구현 완료 |
| PUT | /api/tasks/{taskId}/checklist-items/{itemId}/completion | completed, version | 200 ChecklistItemResponse | 구현 완료 |
| DELETE | /api/tasks/{taskId}/checklist-items/{itemId}?version= | 쿼리 version | 204 | 구현 완료 |
| GET | /api/tasks/{taskId}/assignees | 본문 없음 | 200 TaskAssigneeResponse[] | 구현 완료 |
| PUT | /api/tasks/{taskId}/assignees/{userId} | 본문 없음 | 200 TaskAssigneeResponse | 구현 완료 |
| DELETE | /api/tasks/{taskId}/assignees/{userId} | 본문 없음 | 204 | 구현 완료 |
| GET | /api/planner/preferences | 본문 없음 | 200 PlannerPreferenceResponse | 구현 완료 |
| PUT | /api/planner/preferences | defaultView, version | 200 PlannerPreferenceResponse | 구현 완료 |

완료는 소스 및 지정 테스트 범위의 완료다. 로컬 실제 MySQL·Redis 검증과 DB 반영을 추가 수행했으며 결과와 검증 범위는 [검증 기록](implementation-verification-2026-10-03.md)에 적는다.

## 체크리스트

`title`은 필수 1~200자로 공백뿐인 제목은 거부하고 앞뒤 공백을 제거한다. `assigneeId`는 null, 대문자 ULID 26자 또는 기존 계정의 UUID 36자다. null은 담당자 미지정이며 PUT에서 생략해도 기존 담당자를 해제한다. 제목 수정 PUT은 제목과 담당자 전체 값을 지정한다. `completed`는 별도 API로만 변경한다.

담당자는 본인 또는 등록된 활성 담당자 후보만 가능하다. 없는·비활성 계정이나 등록되지 않은 담당자는 400이다. 할 일당 항목 최대 100개이며 초과하면 409다. 목록은 생성 시각·ID 오름차순이고 최대 항목 수가 제한되어 별도 페이지네이션은 없다.

```http
POST /api/tasks/01J00000000000000000000001/checklist-items
Authorization: Bearer <access-token>
Content-Type: application/json

{"title":"API 목록 검토","assigneeId":null}
```

```json
{
  "success": true,
  "data": {
    "id": "01J00000000000000000000002",
    "title": "API 목록 검토",
    "completed": false,
    "assigneeId": null,
    "version": 1
  },
  "message": null
}
```

완료 지정 예: `PUT .../checklist-items/{itemId}/completion` 본문 `{"completed":true,"version":1}`. 삭제 예: `DELETE .../checklist-items/{itemId}?version=2`. 완료의 Boolean, 수정·완료의 Long version은 null 불가다. 체크리스트 요청 버전은 1 이상이어야 한다.

## 담당자 후보

본인은 자동 후보이고 별도 등록하지 않는다. 다른 활성 계정은 소유자가 사용자 ID로 등록한다. 기존 후보 또는 본인 등록은 같은 결과를 반환하여 중복 행을 만들지 않는다. 본인 외 최대 50명이며 목록은 활성 계정만 `[{userId,nickname}]`으로 반환한다. 비활성 후보는 목록에서 숨겨지지만 등록 한도에 포함되므로 필요하면 후보 해제 API로 정리한다.

사용 중인 담당자는 배정된 항목을 변경하거나 삭제한 뒤 후보를 해제한다. 본인 해제와 사용 중인 후보 해제는 409다. 없는 후보 해제는 204다. 계정 목록을 전부 노출하는 API는 추가하지 않으며 기존 친구/공유 API는 여전히 미구현이다.

## 플래너 기본 보기

`defaultView`는 DAILY/WEEKLY/MONTHLY/YEARLY 중 하나다. 저장 전 GET은 `{"defaultView":"DAILY","version":0}`을 반환한다. 첫 PUT은 version 0, 이후 PUT은 마지막 조회 응답 버전을 요구한다. 최초 저장은 version 1이며 미저장으로 읽었던 다른 요청이 version 0으로 덮어쓰면 409다. 로그인 사용자만 자신의 설정을 조회·변경한다.

```http
PUT /api/planner/preferences
Authorization: Bearer <access-token>
Content-Type: application/json

{"defaultView":"MONTHLY","version":0}
```

```json
{"success":true,"data":{"defaultView":"MONTHLY","version":1},"message":null}
```

## 오류 및 저장 구조

| HTTP | 원인 | 처리 |
|---|---|---|
| 400 | 제목·ID·버전·enum·JSON·숫자 변환·필수 쿼리 오류, 지정 불가 담당자 | 입력 수정 |
| 401 | 로그인 인증 주체 없음, 설정의 사용자 계정 없음 | 로그인 갱신 |
| 403 | 비활성 사용자 | 계정 상태 확인 |
| 404 | 접근 불가·삭제된 할 일 또는 다른 할 일의 항목 | 대상 재조회 |
| 409 | 기대 버전 불일치, 후보/항목 한도, 배정된 후보 해제, DB 변경 경쟁 | 최신 상태 재조회 |
| 500 | 예상하지 못한 내부 실패 | 실패 시각으로 서버 로그 확인 |

String 경로 ID는 불투명 식별자로 사용하며 잘못된 할 일·항목 ID도 대상이 없으면 404다. 예상하지 못한 예외는 내부 메시지·SQL을 응답에 노출하지 않고 예외 종류와 스택 위치를 로그에 기록한다.

DB 변경은 [V4 증가 migration](../../backend/src/main/resources/db/workspace/V4__task_checklist_and_planner_preferences.sql)이다. 할 일 변경·삭제와 후보·항목 변경은 같은 부모 행을 먼저 잠근다. 플래너 설정은 사용자 행을 잠근 뒤 삽입 또는 갱신한다. 정렬 인덱스·담당자 조회 인덱스·복합 UNIQUE로 불필요한 전체 검색과 중복을 줄인다. 대규모 최적화보다 명확한 권한 및 트랜잭션 계약을 우선한다.

부팅 오류 수정에서는 DB 메타데이터 검사 후 baseline 2를 등록하고 안전한 core V3 → workspace V4 → 계정 폭 확장 V5를 적용한다. 채팅 V4도 계정 참조와 DM 키를 확장한다. 기존 V1 SQL과 checksum은 유지하며 재실행·repair·테이블 삭제는 하지 않는다. [복구 설계·실제 적용 결과](../development/database-recovery-2026-10-03.md)를 참고한다.
