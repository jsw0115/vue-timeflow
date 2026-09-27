
### 4.1. 실제 조회 패턴과 실행 계획

월간 캘린더는 시간 일정과 종일 일정을 각각 조회해 합친다. 시간 일정의 UTC 검색 경계는 사용자 시간대로 계산한 기간 경계를 변환한다. 시작이 조회 기간보다 앞선 장기 일정도 빠뜨리지 않도록 종료 조건을 함께 적용한다.

```sql
-- 시간 일정: ix_events_user_time 사용 후보. :from_utc/:to_utc는 바인딩 변수.
SELECT id, title, start_utc, end_utc
FROM tbl_events
WHERE user_id = :user_id AND d_at IS NULL
  AND start_utc < :to_utc AND end_utc > :from_utc;

-- 종일 일정: ix_events_user_day 사용 후보.
SELECT id, title, start_date, end_date
FROM tbl_events
WHERE user_id = :user_id AND d_at IS NULL
  AND start_date < :to_date AND end_date > :from_date;

-- 친구는 양쪽 방향 인덱스를 각각 사용한다. a_id < b_id로 두 집합은 중복되지 않는다.
SELECT b_id AS friend_id FROM tbl_friend WHERE a_id = :user_id AND st = 'accepted'
UNION ALL
SELECT a_id AS friend_id FROM tbl_friend WHERE b_id = :user_id AND st = 'accepted';
```

이 절의 `:name`은 설명용 바인딩 표기이며 mysql CLI에 그대로 실행하는 SQL은 아니다. 5절의 DDL에는 바인딩 변수가 없다.

B-tree 하나로 양쪽 시간 경계의 범위를 모두 좁힐 수는 없다. 기간 중첩 쿼리의 end_utc/end_date 조건은 잔여 필터가 될 수 있다. 장기 일정이 누적되면 종료 시각 선두 보조 인덱스나 별도 기간 검색 구조를 **실측 후** 검토한다. 인덱스를 추가했다고 모든 구간 검색이 상수 시간으로 바뀌지는 않는다.

- 실제 사용자별 데이터 분포를 넣고 EXPLAIN ANALYZE로 예상/실제 행 수, 정렬, 임시 테이블, 응답 시간을 확인한다. 현재 인덱스는 업무 패턴 가설에 따른 초기안이며 실데이터 성능 검증은 별도다.
- 목록은 `(시간, id)` 커서 페이지를 우선한다. 깊은 OFFSET은 피하고 조회 조건·정렬 순서가 인덱스와 맞는지 확인한다. FK 인덱스와 선두가 중복되는 단독 user_id 인덱스를 추가하지 않는다.
- JSON 검색이 빈번해지면 필요한 속성을 정규 컬럼 또는 생성 컬럼으로 승격한 뒤 인덱스를 추가한다. 모든 JSON 키를 무조건 인덱싱하지 않는다.
- 본문 검색은 요구가 확정되면 언어별 검색 전략을 정한다. title/body에 일반 B-tree를 붙여 `%검색어%` 검색 성능을 보장한다고 가정하지 않는다.
- 실행 기록·감사·토큰은 만료/보존 기간에 따라 소량씩 정리한다. 인덱스 유지 비용과 쓰기 증폭을 관찰한다. FK가 있는 InnoDB 테이블을 날짜 파티션으로 바로 전환하는 계획은 채택하지 않는다.
- 대량 통계는 원본 트랜잭션 테이블을 반복 집계하기보다 일별 집계 테이블·읽기 복제본을 후속 도입한다. 쓰기 성공 직후 읽기의 일관성 정책도 정한다.

### 4.2. 실행 방법과 기존 DB 전환

다음 명령은 **새 검증용 DB**에서만 실행한다. MySQL 클라이언트가 설치된 환경에서 접속 정보는 해당 환경에 맞춘다. 비밀번호는 프롬프트로 입력한다.

```text
mysql --default-character-set=utf8mb4 -h 127.0.0.1 -u <user> -p
```

```sql
CREATE DATABASE timeflow_design_review CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE timeflow_design_review;
SOURCE E:/vscode-proj/vue-timeflow-proj/docs/database/timeflow-mysql84-schema.sql;
SHOW TABLES;
```

스크립트는 DDL 40개와 기본 테마 INSERT를 포함한다. 이미 존재하는 테이블을 건너뛰지 않으며, 두 번째 실행은 실패하도록 한다. MySQL DDL 전체를 하나의 ROLLBACK으로 되돌릴 수 있다고 가정하지 않는다. 실행 실패 시 해당 검증용 DB를 별도로 정리하고 새 빈 DB에서 재검증한다. 실제 업무 DB에 직접 SOURCE하지 않는다.

기존 DB 전환은 이 설계 산출물에 포함된 실행 작업이 아니다. 적용 시 다음 순서의 별도 마이그레이션을 작성한다.

1. 실제 테이블명, MariaDB/MySQL 버전, 데이터 건수, Flyway 적용 이력, 백업·복구 가능 여부를 확인한다. 현재 V1과 JPA 이름 불일치를 실제 DB 상태와 대조한다.
2. tbl_ 이름을 목표로 사용할 경우 JPA 매핑과 모든 SQL을 같이 변경한다. 적용된 V1은 수정하지 않고 후속 마이그레이션 또는 새 MySQL baseline을 준비한다. MariaDB→MySQL 전환은 문자 비교·JSON·인증 드라이버까지 별도로 검증한다.
3. 소유자 없는 플래너, FK 고아 행, 동일 사용자가 아닌 참조, 중복 레이아웃, 역방향 친구 쌍, 잘못된 JSON·날짜·enum을 검출해 매핑 또는 격리한다. 카테고리 이름의 대소문자/악센트 비교가 합쳐지는 사례도 검사한다.
4. 기존 이벤트의 시간 유무에서 종일 여부를 결정하고, 사용자 시간대를 이용해 UTC를 계산한다. 시간대 이력이 없거나 DST가 모호한 값은 자동 추정하지 않고 검토 대상으로 남긴다. 종일 종료일은 다음 날로 정규화한다.
5. 기존 시리즈 첫 회차 ID를 신규 event_series.id에 명시 삽입한 뒤 대응되는 소유자를 설정한다. 다음 AUTO_INCREMENT가 MAX(id)보다 큰지 확인한다. 시리즈별 여러 소유자가 섞인 데이터는 분리한다.
6. 요일 문자열을 자식 행으로 분리하고 반복 플래그를 규칙 존재와 대조한다. event_ex의 여러 행은 회차별 최신 상태로 합치되 이전 내용은 event_ver 이력으로 보존한다. 토큰 해시 표현이 현재 SHA-256 hex와 다르면 기존 토큰을 무효화하고 재로그인한다.
7. 외부 계정 식별자·로그 계정 매핑을 채우고, 목표 스키마의 테이블별 건수·핵심 합계·표본 내용을 대조한다. 변환된 데이터가 FK/UK/CHECK를 모두 통과한 뒤 API 전환을 수행한다.
8. 교차 사용자 접근·회차 편집·소프트 삭제·동시 토큰 회전·작업 재시도·기존 API 응답을 검증한다. 복구 경로와 이전 DB 보존 기간을 확보한 뒤 전환한다. FOREIGN_KEY_CHECKS=0으로 오류를 숨기지 않는다.

### 4.3. 검증 기록

검증 결과와 재실행용 무결성 시나리오는 [검증 보고서](timeflow-schema-validation.md)에 기록한다. 정적 검사만으로 MySQL 실행 성공을 주장하지 않으며, 빈 DB 생성 성공만으로 실데이터 이관·부하 성능·서비스 권한까지 검증되었다고 보지 않는다.
