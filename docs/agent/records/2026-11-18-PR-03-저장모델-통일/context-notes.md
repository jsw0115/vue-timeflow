# 맥락 메모

## 결정

- Q-01은 A안. 사용자가 2026-11-18 결정을 위임했고 09 v1.1 권장 결정에 근거를 적었다. 신형에만 version 충돌 검사가 있고 소유권·검증 경로가 하나로 줄어든다.
- 홈 요약(`/api/home/summary`)의 `planner` 필드는 응답 형식을 유지하려고 지우지 않았다. `events`·`routines`는 빈 배열, `tasks`는 유지한다. 프런트는 이 API를 호출하지 않고 계약 검사에만 있다.
- 폐지 예정 헤더는 초안의 `Deprecation: true` 대신 RFC 9745 형식 `Deprecation: @1794960000`(2026-11-18T00:00:00Z)과 `Link: <신형 경로>; rel="successor-version"`으로 했다. 표준 형식이라 클라이언트·프록시 도구가 해석할 수 있다.
- 헤더는 컨트롤러의 `@ModelAttribute`로 붙여 오류 응답에도 나간다. 날짜 상수와 헤더 조립은 `common/ApiDeprecation` 한 곳에 둔다. 구형 컨트롤러를 지우면 호출부도 함께 사라진다.
- 구현 중 발견: 일정 템플릿 적용(`POST /api/events/templates/{id}/apply`)이 구형 `EventService.create`로 `events` 테이블에 저장하고 있었다. 집계에서 구형을 빼면 템플릿 일정이 통계와 신형 목록에서 사라지므로 같은 PR에서 신형 `SCHEDULE` 생성으로 바꿨다. 응답 스키마는 원래 일반 객체라 계약 변경은 없다. 템플릿의 color·repeat·alarm은 이전처럼 옮기지 않는다(기존 동작 유지).
- UT-106 정적 검사는 `/api/events/templates`를 제외한다. 일정 템플릿은 `feature_record`(EVENT_TEMPLATE) 저장소라 폐지 대상이 아니다.
- 5단계(구형 서버 자료 이전, UF-74)는 만들지 않았다. 운영 DB 자료 여부를 저장소로 알 수 없고 사용자 승인이 필요하다. 7단계와 함께 PR-21로 등록했다.
- `/api/planner/view` 계열(`PlannerViewController`)도 구형 일정·루틴을 돌려준다. 할 일도 함께 돌려줘서 이번에 폐지 표시를 하지 않았고 PR-21 범위에 적었다.

## 보안 점검(변경 범위)

- 소유권: 템플릿 적용은 `store.get(CurrentUser.id(), EVENT_TEMPLATE, id)`로 본인 템플릿만 읽고, 다른 계정은 404(테스트 확인). 생성은 `RecordService.create`의 허용 필드·형식 검증을 거친다.
- 입력 검증: 일정 필드는 `FeatureInput`의 SCHEDULE 규칙(필수 필드, HH:mm, 종료>시작)을 그대로 쓴다. 같은 날 안에 끝나야 한다는 기존 검사도 유지했다(23:00+90분 → 400 확인).
- 헤더: 값이 상수와 고정 경로뿐이라 헤더 주입 여지가 없다.
- 집계: 조회 범위가 줄기만 하고 사용자 인자 범위는 그대로다.
- 해당 없음: 인증 방식, 비밀값, 파일, SQL 쿼리 변경 없음.

## 남은 일

- PR-21: 구형 자료 이전(조건부), 구형 API·서비스·테이블·`/api/planner/view` 계열 정리.
- Node 20.18.0으로 실행했다. 요구 버전(>=22.12) 재실행은 PR-06.
