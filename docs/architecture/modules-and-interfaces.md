# 모듈과 인터페이스 설계

작성일 2026-10-31. 수정일 2026-10-31. 실제 파일·패키지와 현재 호출 경계를 기준으로 작성했습니다.

## 목차

- [모듈 책임](#모듈-책임)
- [주요 인터페이스](#주요-인터페이스)
- [의존성과 트랜잭션](#의존성과-트랜잭션)
- [외부 연동](#외부-연동)

## 모듈 책임

| 모듈 | 입력 → 출력·책임 | 주요 위치·주의 |
| --- | --- | --- |
| 화면·라우터 | URL·행동 → 화면·저장 요청 | frontend/src/router, views, components |
| 인증 클라이언트 | 자격정보·갱신 → 세션·authorizedFetch | features/auth, API 주소·401 갱신·로그아웃 |
| 로컬 저장 | 브라우저 배열 → 로컬 컬렉션·색인 | store/localCollection.js, appState.js. 계정별 서버 격리와 다름 |
| 작성·반복·검색 | 양식 → 검증·저장, 반복 회차·검색 | postComposer, utils, workers. 중복 계약 주의 |
| 인증·보안 | 토큰·계정 → 현재 사용자·권한 | backend auth, security. ACTIVE·auth_version·ADMIN |
| 구형 계획 | 일정·할 일·루틴·플래너 → 엔티티·집계 | event, task, routine, planner |
| 체크리스트·보기 | 사용자·taskId·version → 항목·설정 | task/checklist, planner/preferences. 소유 task 잠금 |
| 기능 저장 | owner·kind·ID·payload·version → 기록 | feature. 허용 목록·JSON 한도·충돌 검사 |
| 개인·업무 기록 | 검증 입력 → 기록·WBS·위키·경력 | records, work. 부모·소유권·공개 링크 |
| 공유·커뮤니티 | 사용자·공간·회원·글 → 허용 결과 | social, contract. ACTIVE·차단·owner |
| 설정·운영 | 설정·관리 조치 → 저장·감사 | operations, contract. 비밀값 저장 거부 |
| 채팅 | 방·메시지·읽음 → 영속 데이터·이벤트 | chat. 신원 어댑터·MySQL·Redis |
| 마이그레이션 | 메타데이터·이력 → 안전한 baseline·증분 | config, db/core, resources/db |
| 외부 경계 | 유효 실행 요청 → capability·503 | integration. 실제 제공자 미연결 |

`contract`에는 실제 서비스와 연결된 컨트롤러도 있습니다. 이름만으로 stub이라고 분류하지 않습니다. 전체 소스 탐색은 [프로젝트 구조](../handbook/source/03-프로젝트-구조.md)를 따릅니다.

## 주요 인터페이스

| ID | 연결 | 계약·검증 | 장애·복구 |
| --- | --- | --- | --- |
| IF-01 | 브라우저 → API | Bearer·DTO·현재 사용자·version | 400/401/403/404/409 구분·입력 보존 |
| IF-02 | Vue → 로컬 store | 브라우저 상태·배열 | 시연 범위. 계정 전환 격리는 개선 대상 |
| IF-03 | API → MySQL | JPA/JDBC·트랜잭션·키 | 충돌·잠금·실패 처리 |
| IF-04 | 채팅 → Redis → SSE | 방 권한·이벤트·활성 TTL | 재연결·재조회·outbox |
| IF-05 | 파일 API → 바이트 | multipart·권한·용량·기한 | 만료·타인 차단·프록시 한도 |
| IF-06 | 공개 링크 → 포트폴리오 | 토큰 해시·7일·명시 itemIds | 만료·철회·선택 범위 |
| IF-07 | 프록시 → API | SPA·/api·SSE·전달 헤더 | 502·DNS·buffering·내부 health |
| IF-08 | CI → Registry → 서버 | 동일 전체 SHA의 웹·API | pull·백업·health 실패 시 중단 |
| IF-09 | 향후 Spring → AI 작업자 | 서비스 인증·임대·최소 입력·사용량 | 재시도·철회·정산. 제안 단계 |
| IF-10 | 향후 결제 → webhook | 서명·중복키·상품·계정·순서 | 대사·환불. 미연결 |

필드·요청·응답은 [API 명세](../api/frontend-backend-2026-10-10/specification.md)와 OpenAPI를 기준으로 합니다. SSE·파일·채팅을 일반 응답 envelope에 맞추려고 임의 변경하지 않습니다.

## 의존성과 트랜잭션

Controller는 HTTP·DTO·현재 사용자 전달, Service는 권한·업무·트랜잭션, Repository/Store는 영속 접근을 담당합니다. 기존 구현을 문서의 형태에 맞춰 무관하게 재작성하지 않습니다.

체크리스트의 수량·담당자·버전 변경은 같은 소유 task 잠금 범위에서 처리합니다. 기능 기록은 owner·kind·ID·version을 검사합니다. 채팅은 DB와 outbox를 저장한 뒤 이벤트를 전파합니다.

외부 네트워크·LLM 호출 중 장기 트랜잭션을 유지하지 않습니다. 다중 서비스 쓰기는 outbox·멱등키·재처리로 부분 성공을 복구하고 사용자에게 적용된 대상을 정확하게 표시합니다.

## 외부 연동

AI·결제·음성·OAuth·캘린더·영상·알림은 제공자 어댑터 경계를 사용합니다. 브라우저 키·결제 성공 주장을 권한 기준으로 쓰지 않습니다. 현재 상태는 [외부 경계 명세](../api/frontend-backend-2026-10-10/integrations.md)에 있습니다.

모듈을 추가할 때 소유자·입력·출력·트랜잭션·예외·의존·테스트를 명시하고 요구·API·DB·WBS를 갱신합니다. 계약 없이 JSON 필드를 추가하거나 기존 동기 API를 예고 없이 비동기로 바꾸지 않습니다.
