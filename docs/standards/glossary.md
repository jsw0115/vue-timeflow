# 용어·명명 규칙·데이터 사전

작성일 2026-10-31. 수정일 2026-10-31. 현재의 역사적 이름과 신규 규칙을 구분합니다. 실제 컬럼 타입·NULL·키·기본값은 [전체 테이블 정의](../database/current-database.md)에 단일 관리합니다.

## 목차

- [제품·기획 용어](#제품기획-용어)
- [현재 데이터 이름](#현재-데이터-이름)
- [신규 명명 규칙](#신규-명명-규칙)
- [시간·식별자·버전](#시간식별자버전)

## 제품·기획 용어

| 용어 | 정의와 사용 규칙 |
| --- | --- |
| Timebar Diary / Timeflow | 제품명 / 저장소·서버 코드 식별 계열. 일괄 개명하지 않음 |
| 계획 / 실제 기록 | 예정한 활동·시간 / 실제 수행 시간·결과. Plan / Actual의 사용자 표시 |
| 일정 / 할 일 / 루틴 | 시간에 배치한 약속 / 완료할 작업 / 반복 수행 규칙 |
| 다이어리 / 메모 | 날짜 중심 회고 / 자유 기록 |
| J/P/B | 계획 표현·선호 모드. 성격·적성·채용 가능성 평가에 쓰지 않음 |
| WBS / MD | 산출물 중심 작업 분해 / 한 사람이 하루 작업하는 투입 단위 |
| RFP / 요구사항 | 제안 요청 기준 / 검수 가능한 기능·품질 약속 |
| 와이어프레임 / 흐름도 | 화면 영역·정보 위계 / 행동·상태·이동의 순서 |
| ERD / PK / FK / UK | 관계도 / 기본키 / 외래키 / 고유 제약 |
| API / DTO / OpenAPI | 호출 계약 / 전달 데이터 모델 / 기계가 읽는 HTTP 명세 |
| 멱등성 | 같은 작업 재요청에도 중복 효과가 생기지 않는 성질 |
| SSE / outbox | 서버 이벤트 스트림 / DB 커밋 이후 전파하는 영속 작업 |
| capability | 실제 서버 제공 가능 상태. 화면 토글과 다름 |
| 근거 / 주장 / 수정안 | 경험·문헌·원문 / 설명할 내용 / 검토할 변경 제안 |
| 시연 / 구현 / 검증 / 배포 | 예시 동작 / 코드 존재 / 특정 범위의 실행 증거 / 실제 환경 반영 |
| 릴리스 후보 / 배포일 | 검수 대상 산출물 / 실제 반영 날짜. 계획일과 구분 |

## 현재 데이터 이름

| 이름·패턴 | 의미 | 주의 |
| --- | --- | --- |
| `users` / `chat_user` | 통합 계정 / 채팅 표시·참조 | 인증 어댑터로 연결, 같은 테이블 아님 |
| `events`, `task`, `routine` | 구형 도메인 테이블 | 단복수 혼재는 현재 사실 |
| `planner_item` | 수동 플래너 항목 | 신규 일정 전체의 단일 저장소 아님 |
| `feature_record` | owner·kind·record_id의 JSON 기록 | 종류·필드는 FeatureType·API 기준 |
| `feature_member/friend/block/file` | 참여·친구·차단·첨부 | 서비스의 관계·권한 검사 필요 |
| `owner_id/user_id` | 소유자 / 사용자·참여자 | 요청 본문만으로 권한 결정 금지 |
| `record_id/kind/payload/version` | 종류 안의 ID / 종류 / JSON / 변경 버전 | DB 타입과 API 필수 규칙은 별도 |
| `c_at/u_at/d_at` | 생성·수정·소프트 삭제 시각 | 구형 축약. 신규 이름은 명확한 full name 권장 |
| `st/pri/energy_lvl` | 상태·우선순위·필요 에너지 | 실제 도메인 enum 기준 |
| `tok_hash/exp_utc/rev_utc` | 토큰 해시·만료·폐기 | 원본 토큰 로그·문서 기재 금지 |
| `cat_id/cat_name/cat_color/cat_icon` | 분류 ID·표시 스냅샷 | 현재 category 물리 테이블 존재를 가정하지 않음 |
| `sequence_no/client_message_id` | 방 순번 / 재전송 식별자 | 메시지 ID·읽음 위치와 구분 |
| `auth_version` | 계정 토큰 무효화 버전 | 기록 수정 version과 다름 |
| `flyway_schema_history/flyway_chat_history` | Core·workspace / 채팅 이력 | 삭제·수정·이름 혼동 금지 |

필드별 의미는 [현재 DB 정의](../database/current-database.md), 기능 JSON 종류·필수값은 [FeatureType.java](../../backend/src/main/java/kr/timebar/diary/feature/FeatureType.java), HTTP 필드는 [API](../api/README.md)에서 관리합니다. 새 용어에는 의미·단위·허용값·소유권·유효 범위를 함께 기록합니다.

## 신규 명명 규칙

| 대상 | 규칙·예시 |
| --- | --- |
| DB 테이블·컬럼 | 소문자 snake_case. `goal_id`, `created_at`. 신규 테이블 단복수는 migration 전에 확정 |
| 제약·인덱스 | `pk_<table>`, `uk_<table>_<meaning>`, `fk_<table>_<parent>`, `ix_<table>_<query>` |
| Java 타입 | PascalCase와 public 파일명 일치. Controller·Service·Repository·Request·Response 역할 구분 |
| Java 패키지 | 소문자와 디렉터리 일치. `kr.timebar.diary.<domain>` |
| JS·JSON | camelCase. `goalId`, `estimatedMinutes`, `createGoal()` |
| Vue | PascalCase.vue. 페이지는 `<Domain>View.vue`, 공통 컴포넌트는 역할 이름 |
| 불리언 | `is/has/can` 또는 문맥상 분명한 상태. `isEnabled`, `hasNext` |
| enum·상수 | UPPER_SNAKE_CASE. 계약에 정의한 값만 사용 |
| 환경변수 | UPPER_SNAKE_CASE. `DB_URL`, `JWT_SECRET`. 공개 값만 VITE_ |
| API | 기존 `/api`, 자원 중심 경로·명확한 메서드·호환 전략 |
| 문서 추적 | REQ-F01, TC-01, WBS-01, BUG-001, IMP-001. 폐기 후 재사용 금지 |

기존 `tbl_*`·축약·단복수를 일괄 개명하지 않습니다. DB 개명은 코드·API·이관·롤백·외부 의존을 별도 변경으로 검수합니다. 같은 의미의 새 이름에는 기존 필드와의 관계·호환 종료를 명시합니다.

## 시간·식별자·버전

사용자 일정·날짜는 사용자 시간대, 서버·토큰은 계약의 UTC 규칙을 따릅니다. `DATE`와 현지 시각을 무조건 UTC 문자열로 바꾸지 않습니다. 날짜 경계·자정·반복·일광절약시간을 검증합니다.

계정은 기존 UUID와 신규 ULID가 공존하고 구형 일정은 BIGINT입니다. 모든 ID를 같은 길이나 숫자로 변환하지 않습니다. JS 안전 정수 범위를 넘을 수 있는 값은 계약에 맞는 문자열을 검토합니다.

제품 0.1.0, 기록 version, auth_version, Flyway V6, schemaVersion, Git 전체 SHA, 문서 수정일은 다른 목적입니다. 어느 버전인지 명시하고 서로 대체하지 않습니다.
