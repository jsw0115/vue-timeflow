# DB 물리 설계서 — 현재 DDL 스냅샷

기준 2026-09-26 · V1__initial_schema.sql에 선언된 37개 테이블을 전부 정리했습니다. DB에 실제 존재하는 테이블을 조회한 결과가 아닙니다.

**실행 금지 경고:** CREATE OR REPLACE TABLE은 기존 테이블을 대체할 수 있습니다. 현재 CREATE 이름은 tbl_ 접두어이지만 FK 대상과 JPA는 접두어가 없습니다. 39개 FK 선언의 참조 대상이 이 파일의 CREATE 목록에 없습니다. 운영/개발 데이터에 실행하지 마세요.

[불일치와 이관 절차](04-schema-gaps.md) · [목표 ERD](03-target-database.md) · [API](../api-info/README.md)

## 공통 규칙

- 현재 파일의 ENGINE=InnoDB, utf8mb4_unicode_ci 기준입니다.
- id는 대체로 CHAR(26), events/planner_item/task_member는 BIGINT입니다. FK 타입 통일이 먼저입니다.
- DATETIME(3)/(6)는 시간대 정보가 없는 컬럼입니다. _utc 컬럼은 애플리케이션이 UTC로 변환하며, c_at/u_at도 운영 저장 규칙을 통일해야 합니다.
- VARCHAR 상태값에 SQL CHECK가 없으므로 Java enum과 서버 검증이 필요합니다. JSON처럼 쓰는 LONGTEXT도 JSON 유효성 제약이 자동 보장되지 않습니다.
- PK/UNIQUE/INDEX와 FK는 아래에 DDL 원문으로 표시합니다. FK가 선언되어 있다는 사실과 정상 적용되었다는 사실은 다릅니다.

## 테이블 목록

| 테이블 | 용도 | 컬럼 수 | JPA 대응 |
|---|---|---|---|
| [tbl_users](#tbl_users) | 계정 | 14 | users |
| [tbl_refresh_token](#tbl_refresh_token) | 리프레시 토큰 | 9 | refresh_token |
| [tbl_login_throttle](#tbl_login_throttle) | 로그인 시도 제한 | 5 | login_throttle |
| [tbl_events](#tbl_events) | 기존 날짜·시간 일정 | 13 | events |
| [tbl_task](#tbl_task) | 할 일 | 18 | task |
| [tbl_routine](#tbl_routine) | 루틴 | 16 | routine |
| [tbl_routine_log](#tbl_routine_log) | 일별 루틴 이력 | 5 | routine_log |
| [tbl_planner_item](#tbl_planner_item) | 사용자 미분리 레거시 플래너 | 12 | planner_item |
| [tbl_category](#tbl_category) | 분류 | 14 | Entity 없음 |
| [tbl_user_pref](#tbl_user_pref) | 사용자 환경설정 | 19 | Entity 없음 |
| [tbl_dash_layout](#tbl_dash_layout) | 홈 배치 | 7 | Entity 없음 |
| [tbl_dash_portlet_pref](#tbl_dash_portlet_pref) | 포틀릿 표시 설정 | 7 | Entity 없음 |
| [tbl_notif_pref](#tbl_notif_pref) | 알림 수신 설정 | 8 | Entity 없음 |
| [tbl_user_device](#tbl_user_device) | 푸시 기기 | 10 | Entity 없음 |
| [tbl_data_file](#tbl_data_file) | 가져오기·내보내기 파일 | 10 | Entity 없음 |
| [tbl_data_job](#tbl_data_job) | 데이터 작업 | 11 | Entity 없음 |
| [tbl_import_mapping_profile](#tbl_import_mapping_profile) | 가져오기 매핑 | 8 | Entity 없음 |
| [tbl_ext_cal_account](#tbl_ext_cal_account) | 외부 캘린더 계정 | 8 | Entity 없음 |
| [tbl_sync_run_log](#tbl_sync_run_log) | 외부 동기화 로그 | 11 | Entity 없음 |
| [tbl_support_ticket](#tbl_support_ticket) | 고객 문의 | 9 | Entity 없음 |
| [tbl_settings_audit_log](#tbl_settings_audit_log) | 설정 변경 감사 | 6 | Entity 없음 |
| [tbl_event_policy](#tbl_event_policy) | 일정 편집 정책 | 7 | Entity 없음 |
| [tbl_event_share](#tbl_event_share) | 일정별 공유 | 8 | Entity 없음 |
| [tbl_event_ex](#tbl_event_ex) | 반복 회차 예외 | 18 | Entity 없음 |
| [tbl_event_ver](#tbl_event_ver) | 일정 변경 이력 | 8 | Entity 없음 |
| [tbl_time_entry](#tbl_time_entry) | 계획/실제 블록 | 16 | Entity 없음 |
| [tbl_task_member](#tbl_task_member) | 할 일 참여자 | 4 | Entity 없음 |
| [tbl_task_repeat_rule](#tbl_task_repeat_rule) | 할 일 반복 규칙 | 6 | Entity 없음 |
| [tbl_memo](#tbl_memo) | 메모 | 11 | Entity 없음 |
| [tbl_diary](#tbl_diary) | 일간 회고 | 9 | Entity 없음 |
| [tbl_friend](#tbl_friend) | 친구 관계 | 7 | Entity 없음 |
| [tbl_cal_group](#tbl_cal_group) | 캘린더 그룹 | 6 | Entity 없음 |
| [tbl_cal_group_mem](#tbl_cal_group_mem) | 그룹 멤버 | 5 | Entity 없음 |
| [tbl_theme_catalog](#tbl_theme_catalog) | 테마 목록 | 6 | Entity 없음 |
| [tbl_sticker_pack](#tbl_sticker_pack) | 스티커 팩 | 8 | Entity 없음 |
| [tbl_sticker_item](#tbl_sticker_item) | 스티커 자산 | 7 | Entity 없음 |
| [tbl_user_sticker_pack](#tbl_user_sticker_pack) | 내 스티커 팩 | 6 | Entity 없음 |

<a id="tbl_users"></a>
## tbl_users — 계정

| 컬럼 | SQL 자료형 | NULL | 기본값 | 키·속성 | 의미 |
|---|---|---|---|---|---|
| id | CHAR(26) | 불가 | 명시 없음 | PK  | 기본 식별자 |
| email | VARCHAR(255) | 불가 | 명시 없음 |  | 로그인 이메일 |
| pw_hash | VARCHAR(255) | 불가 | 명시 없음 |  | 비밀번호 해시 |
| nick | VARCHAR(80) | 불가 | 명시 없음 |  | 닉네임 |
| role | VARCHAR(20) | 불가 | 명시 없음 |  | 역할 |
| st | VARCHAR(20) | 불가 | 명시 없음 |  | 상태 (도메인별 의미) |
| tz | VARCHAR(64) | 불가 | 'Asia/Seoul' |  | IANA 시간대 |
| email_vfy | BOOLEAN | 불가 | FALSE |  | 이메일 검증 여부 |
| last_login_utc | DATETIME(6) | 허용 | 명시 없음 |  | 최근 로그인 UTC |
| pw_chg_utc | DATETIME(6) | 허용 | 명시 없음 |  | 비밀번호 변경 UTC |
| c_at | DATETIME(6) | 불가 | 명시 없음 |  | 생성 시각 |
| u_at | DATETIME(6) | 불가 | 명시 없음 |  | 수정 시각 |
| d_at | DATETIME(6) | 허용 | 명시 없음 |  | 논리 삭제 시각 |
| is_enabled | TINYINT | 허용 | 1 |  | 기존 계정 활성 호환 필드 |

키·인덱스·관계 선언:

```sql
PRIMARY KEY (id)
UNIQUE KEY uk_users_email (email)
KEY ix_users_status (st, d_at)
```

<a id="tbl_refresh_token"></a>
## tbl_refresh_token — 리프레시 토큰

| 컬럼 | SQL 자료형 | NULL | 기본값 | 키·속성 | 의미 |
|---|---|---|---|---|---|
| id | CHAR(26) | 불가 | 명시 없음 | PK  | 기본 식별자 |
| user_id | CHAR(26) | 불가 | 명시 없음 | FK 선언  | 사용자 소유/연결 ID |
| device_id | VARCHAR(128) | 허용 | 명시 없음 |  | 기기 식별자 |
| tok_hash | VARCHAR(255) | 불가 | 명시 없음 |  | 토큰 해시 |
| jti | CHAR(36) | 허용 | 명시 없음 |  | JWT 토큰 식별자 |
| exp_utc | DATETIME(6) | 불가 | 명시 없음 |  | 만료 UTC |
| rev_utc | DATETIME(6) | 허용 | 명시 없음 |  | 폐기 UTC |
| last_used_utc | DATETIME(6) | 허용 | 명시 없음 |  | 마지막 사용 UTC |
| c_at | DATETIME(6) | 불가 | 명시 없음 |  | 생성 시각 |

키·인덱스·관계 선언:

```sql
PRIMARY KEY (id)
UNIQUE KEY uk_refresh_token_hash (tok_hash)
KEY ix_refresh_token_user (user_id, rev_utc, exp_utc)
CONSTRAINT fk_refresh_token_user FOREIGN KEY (user_id) REFERENCES users (id)
```

- user_id → users.id, 삭제: RESTRICT (기본). **현재 CREATE 목록에 대상 없음 — 검토 필요.**

<a id="tbl_login_throttle"></a>
## tbl_login_throttle — 로그인 시도 제한

| 컬럼 | SQL 자료형 | NULL | 기본값 | 키·속성 | 의미 |
|---|---|---|---|---|---|
| id | CHAR(26) | 불가 | 명시 없음 | PK  | 기본 식별자 |
| fail_cnt | INT | 불가 | 0 |  | 인증 실패 횟수 |
| lock_utc | DATETIME(6) | 허용 | 명시 없음 |  | 계정/IP 잠금 만료 |
| last_fail_utc | DATETIME(6) | 허용 | 명시 없음 |  | 최근 실패 UTC |
| u_at | DATETIME(6) | 불가 | 명시 없음 |  | 수정 시각 |

키·인덱스·관계 선언:

```sql
key_type VARCHAR(10) NOT NULL
key_val VARCHAR(255) NOT NULL
PRIMARY KEY (id)
UNIQUE KEY uk_login_throttle_key (key_type, key_val)
KEY ix_login_throttle_lock (lock_utc)
```

<a id="tbl_events"></a>
## tbl_events — 기존 날짜·시간 일정

| 컬럼 | SQL 자료형 | NULL | 기본값 | 키·속성 | 의미 |
|---|---|---|---|---|---|
| id | BIGINT | 불가 | 명시 없음 | PK AUTO_INCREMENT | 기본 식별자 |
| user_id | CHAR(26) | 불가 | 명시 없음 | FK 선언  | 사용자 소유/연결 ID |
| title | VARCHAR(255) | 불가 | 명시 없음 |  | 제목 |
| category | VARCHAR(255) | 허용 | 명시 없음 |  | category (DDL 원문 확인) |
| date | DATE | 불가 | 명시 없음 |  | 일정 날짜 |
| start_time | TIME | 허용 | 명시 없음 |  | 시작 지역 시각 |
| end_time | TIME | 허용 | 명시 없음 |  | 종료 지역 시각 |
| location | VARCHAR(255) | 허용 | 명시 없음 |  | 장소 |
| visibility | VARCHAR(20) | 허용 | 명시 없음 |  | 공개 범위 |
| note | VARCHAR(255) | 허용 | 명시 없음 |  | 메모 |
| series_id | BIGINT | 허용 | 명시 없음 |  | 반복 시리즈 식별자 |
| created_at | DATETIME(6) | 불가 | 명시 없음 |  | 생성 시각 |
| updated_at | DATETIME(6) | 불가 | 명시 없음 |  | 수정 시각 |

키·인덱스·관계 선언:

```sql
PRIMARY KEY (id)
KEY ix_events_user_date (user_id, date)
KEY ix_events_series_date (series_id, date)
CONSTRAINT fk_events_user FOREIGN KEY (user_id) REFERENCES users (id)
```

- user_id → users.id, 삭제: RESTRICT (기본). **현재 CREATE 목록에 대상 없음 — 검토 필요.**

<a id="tbl_task"></a>
## tbl_task — 할 일

| 컬럼 | SQL 자료형 | NULL | 기본값 | 키·속성 | 의미 |
|---|---|---|---|---|---|
| id | CHAR(26) | 불가 | 명시 없음 | PK  | 기본 식별자 |
| user_id | CHAR(26) | 불가 | 명시 없음 | FK 선언  | 사용자 소유/연결 ID |
| title | VARCHAR(200) | 불가 | 명시 없음 |  | 제목 |
| note | TEXT | 허용 | 명시 없음 |  | 메모 |
| st | VARCHAR(20) | 불가 | 명시 없음 |  | 상태 (도메인별 의미) |
| pri | VARCHAR(20) | 불가 | 명시 없음 |  | 우선순위 |
| energy_lvl | VARCHAR(20) | 불가 | 명시 없음 |  | 필요 에너지 |
| duration_min | INT | 불가 | 30 |  | 진행 시간(분) |
| due | DATE | 허용 | 명시 없음 |  | 마감일 |
| cat_id | CHAR(26) | 허용 | 명시 없음 |  | 분류 ID |
| cat_name | VARCHAR(60) | 허용 | 명시 없음 |  | 분류명 스냅샷 |
| cat_color | CHAR(7) | 허용 | 명시 없음 |  | 분류 색상 스냅샷 |
| cat_icon | VARCHAR(16) | 허용 | 명시 없음 |  | 분류 아이콘 스냅샷 |
| event_id | CHAR(26) | 허용 | 명시 없음 |  | 일정 ID |
| is_repeat | BOOLEAN | 불가 | FALSE |  | 반복 여부 |
| c_at | DATETIME(6) | 불가 | 명시 없음 |  | 생성 시각 |
| u_at | DATETIME(6) | 불가 | 명시 없음 |  | 수정 시각 |
| d_at | DATETIME(6) | 허용 | 명시 없음 |  | 논리 삭제 시각 |

키·인덱스·관계 선언:

```sql
PRIMARY KEY (id)
KEY ix_task_user_due (user_id, due, c_at)
KEY ix_task_user_status (user_id, st, d_at)
CONSTRAINT fk_task_user FOREIGN KEY (user_id) REFERENCES users (id)
```

- user_id → users.id, 삭제: RESTRICT (기본). **현재 CREATE 목록에 대상 없음 — 검토 필요.**

<a id="tbl_routine"></a>
## tbl_routine — 루틴

| 컬럼 | SQL 자료형 | NULL | 기본값 | 키·속성 | 의미 |
|---|---|---|---|---|---|
| id | CHAR(26) | 불가 | 명시 없음 | PK  | 기본 식별자 |
| user_id | CHAR(26) | 불가 | 명시 없음 | FK 선언  | 사용자 소유/연결 ID |
| name | VARCHAR(200) | 불가 | 명시 없음 |  | 이름 |
| icon | VARCHAR(16) | 허용 | 명시 없음 |  | 아이콘 |
| cat_id | CHAR(26) | 허용 | 명시 없음 |  | 분류 ID |
| cat_name | VARCHAR(60) | 허용 | 명시 없음 |  | 분류명 스냅샷 |
| cat_color | CHAR(7) | 허용 | 명시 없음 |  | 분류 색상 스냅샷 |
| cat_icon | VARCHAR(16) | 허용 | 명시 없음 |  | 분류 아이콘 스냅샷 |
| at_time | CHAR(5) | 불가 | 명시 없음 |  | 시작 지역 시각 HH:mm |
| days | VARCHAR(32) | 불가 | 명시 없음 |  | 반복 요일 CSV |
| onoff | BOOLEAN | 불가 | TRUE |  | 루틴 활성 여부 |
| notify | BOOLEAN | 불가 | FALSE |  | 알림 활성 여부 |
| n_min | INT | 허용 | 명시 없음 |  | 사전 알림 분 |
| c_at | DATETIME(6) | 불가 | 명시 없음 |  | 생성 시각 |
| u_at | DATETIME(6) | 불가 | 명시 없음 |  | 수정 시각 |
| d_at | DATETIME(6) | 허용 | 명시 없음 |  | 논리 삭제 시각 |

키·인덱스·관계 선언:

```sql
PRIMARY KEY (id)
KEY ix_routine_user_time (user_id, onoff, at_time)
CONSTRAINT fk_routine_user FOREIGN KEY (user_id) REFERENCES users (id)
```

- user_id → users.id, 삭제: RESTRICT (기본). **현재 CREATE 목록에 대상 없음 — 검토 필요.**

<a id="tbl_routine_log"></a>
## tbl_routine_log — 일별 루틴 이력

| 컬럼 | SQL 자료형 | NULL | 기본값 | 키·속성 | 의미 |
|---|---|---|---|---|---|
| id | CHAR(26) | 불가 | 명시 없음 | PK  | 기본 식별자 |
| routine_id | CHAR(26) | 불가 | 명시 없음 | FK 선언  | 루틴 ID |
| dt | DATE | 불가 | 명시 없음 |  | 기록 날짜 |
| st | VARCHAR(10) | 불가 | 명시 없음 |  | 상태 (도메인별 의미) |
| u_at | DATETIME(6) | 불가 | 명시 없음 |  | 수정 시각 |

키·인덱스·관계 선언:

```sql
PRIMARY KEY (id)
UNIQUE KEY uk_routine_log_date (routine_id, dt)
KEY ix_routine_log_date (dt)
CONSTRAINT fk_routine_log_routine FOREIGN KEY (routine_id) REFERENCES routine (id)
```

- routine_id → routine.id, 삭제: RESTRICT (기본). **현재 CREATE 목록에 대상 없음 — 검토 필요.**

<a id="tbl_planner_item"></a>
## tbl_planner_item — 사용자 미분리 레거시 플래너

| 컬럼 | SQL 자료형 | NULL | 기본값 | 키·속성 | 의미 |
|---|---|---|---|---|---|
| id | BIGINT | 불가 | 명시 없음 | PK AUTO_INCREMENT | 기본 식별자 |
| type | VARCHAR(20) | 불가 | 명시 없음 |  | 종류 |
| title | VARCHAR(255) | 불가 | 명시 없음 |  | 제목 |
| category | VARCHAR(255) | 허용 | 명시 없음 |  | category (DDL 원문 확인) |
| date | DATE | 허용 | 명시 없음 |  | 일정 날짜 |
| start_time | TIME | 허용 | 명시 없음 |  | 시작 지역 시각 |
| end_time | TIME | 허용 | 명시 없음 |  | 종료 지역 시각 |
| status | VARCHAR(20) | 허용 | 명시 없음 |  | status (DDL 원문 확인) |
| dday | BOOLEAN | 불가 | FALSE |  | dday (DDL 원문 확인) |
| note | VARCHAR(255) | 허용 | 명시 없음 |  | 메모 |
| created_at | DATETIME(6) | 불가 | 명시 없음 |  | 생성 시각 |
| updated_at | DATETIME(6) | 불가 | 명시 없음 |  | 수정 시각 |

키·인덱스·관계 선언:

```sql
PRIMARY KEY (id)
KEY ix_planner_item_date_type (date, type)
```

<a id="tbl_category"></a>
## tbl_category — 분류

| 컬럼 | SQL 자료형 | NULL | 기본값 | 키·속성 | 의미 |
|---|---|---|---|---|---|
| id | CHAR(26) | 불가 | 명시 없음 | PK  | 기본 식별자 |
| user_id | CHAR(26) | 허용 | 명시 없음 | FK 선언  | 사용자 소유/연결 ID |
| parent_id | CHAR(26) | 허용 | 명시 없음 |  | 부모 분류/작업 ID |
| name | VARCHAR(60) | 불가 | 명시 없음 |  | 이름 |
| color | CHAR(7) | 불가 | '#64748b' |  | 색상 |
| icon | VARCHAR(16) | 허용 | 명시 없음 |  | 아이콘 |
| ord | INT | 불가 | 0 |  | 정렬 순서 |
| scope | VARCHAR(12) | 불가 | 'ALL' |  | 적용 범위 |
| is_pinned | BOOLEAN | 불가 | FALSE |  | 고정 여부 |
| st | VARCHAR(12) | 불가 | 'ACTIVE' |  | 상태 (도메인별 의미) |
| c_at | DATETIME(3) | 불가 | 명시 없음 |  | 생성 시각 |
| u_at | DATETIME(3) | 불가 | 명시 없음 |  | 수정 시각 |
| d_at | DATETIME(3) | 허용 | 명시 없음 |  | 논리 삭제 시각 |
| d_by | CHAR(26) | 허용 | 명시 없음 |  | 삭제자 |

키·인덱스·관계 선언:

```sql
PRIMARY KEY (id)
UNIQUE KEY uk_category_user_name (user_id, name)
KEY ix_category_parent (user_id, parent_id)
KEY ix_category_state (user_id, st)
CONSTRAINT fk_category_user FOREIGN KEY (user_id) REFERENCES users (id)
```

- user_id → users.id, 삭제: RESTRICT (기본). **현재 CREATE 목록에 대상 없음 — 검토 필요.**

<a id="tbl_user_pref"></a>
## tbl_user_pref — 사용자 환경설정

| 컬럼 | SQL 자료형 | NULL | 기본값 | 키·속성 | 의미 |
|---|---|---|---|---|---|
| user_id | CHAR(26) | 불가 | 명시 없음 | PK FK 선언  | 사용자 소유/연결 ID |
| start_scr | VARCHAR(32) | 불가 | 'home' |  | 시작 화면 |
| date_fmt | VARCHAR(32) | 불가 | 'YYYY-MM-DD' |  | 날짜 형식 |
| time_fmt | VARCHAR(3) | 불가 | '24h' |  | 시간 형식 |
| theme_id | VARCHAR(64) | 불가 | 'default' |  | 테마 ID |
| push_on | BOOLEAN | 불가 | TRUE |  | 푸시 허용 |
| email_on | BOOLEAN | 불가 | FALSE |  | 이메일 허용 |
| inapp_on | BOOLEAN | 불가 | TRUE |  | 인앱 알림 허용 |
| dnd_s | CHAR(5) | 허용 | 명시 없음 |  | 방해금지 시작 |
| dnd_e | CHAR(5) | 허용 | 명시 없음 |  | 방해금지 종료 |
| week_start | VARCHAR(3) | 불가 | 'MON' |  | 주 시작 요일 |
| locale | VARCHAR(16) | 불가 | 'ko-KR' |  | 지역/언어 |
| time_step_min | INT | 불가 | 10 |  | 타임바 눈금 분 |
| def_event_vis | VARCHAR(12) | 불가 | 'PRIVATE' |  | 일정 기본 공개범위 |
| def_event_all_day | BOOLEAN | 불가 | TRUE |  | 종일 일정 기본값 |
| def_event_dur_min | INT | 불가 | 60 |  | 기본 일정 분 |
| def_reminder_min | INT | 허용 | 명시 없음 |  | 기본 알림 분 |
| overlap_warn_on | BOOLEAN | 불가 | TRUE |  | 겹침 경고 여부 |
| u_at | DATETIME(3) | 불가 | 명시 없음 |  | 수정 시각 |

키·인덱스·관계 선언:

```sql
PRIMARY KEY (user_id)
CONSTRAINT fk_user_pref_user FOREIGN KEY (user_id) REFERENCES users (id)
```

- user_id → users.id, 삭제: RESTRICT (기본). **현재 CREATE 목록에 대상 없음 — 검토 필요.**

<a id="tbl_dash_layout"></a>
## tbl_dash_layout — 홈 배치

| 컬럼 | SQL 자료형 | NULL | 기본값 | 키·속성 | 의미 |
|---|---|---|---|---|---|
| id | CHAR(26) | 불가 | 명시 없음 | PK  | 기본 식별자 |
| user_id | CHAR(26) | 불가 | 명시 없음 | FK 선언  | 사용자 소유/연결 ID |
| scope | VARCHAR(12) | 불가 | 'all' |  | 적용 범위 |
| bp | VARCHAR(16) | 허용 | 명시 없음 |  | 화면 크기 구분 |
| json | LONGTEXT | 불가 | 명시 없음 |  | 레이아웃 JSON 문자열 |
| c_at | DATETIME(3) | 불가 | 명시 없음 |  | 생성 시각 |
| u_at | DATETIME(3) | 불가 | 명시 없음 |  | 수정 시각 |

키·인덱스·관계 선언:

```sql
PRIMARY KEY (id)
UNIQUE KEY uk_dash_layout (user_id, scope, bp)
CONSTRAINT fk_dash_layout_user FOREIGN KEY (user_id) REFERENCES users (id)
```

- user_id → users.id, 삭제: RESTRICT (기본). **현재 CREATE 목록에 대상 없음 — 검토 필요.**

<a id="tbl_dash_portlet_pref"></a>
## tbl_dash_portlet_pref — 포틀릿 표시 설정

| 컬럼 | SQL 자료형 | NULL | 기본값 | 키·속성 | 의미 |
|---|---|---|---|---|---|
| id | CHAR(26) | 불가 | 명시 없음 | PK  | 기본 식별자 |
| user_id | CHAR(26) | 불가 | 명시 없음 | FK 선언  | 사용자 소유/연결 ID |
| portlet_id | VARCHAR(64) | 불가 | 명시 없음 |  | 포틀릿 종류 |
| vis | BOOLEAN | 불가 | TRUE |  | 표시 여부 |
| ord | INT | 불가 | 0 |  | 정렬 순서 |
| cfg_json | LONGTEXT | 허용 | 명시 없음 |  | 설정 JSON 문자열 |
| u_at | DATETIME(3) | 불가 | 명시 없음 |  | 수정 시각 |

키·인덱스·관계 선언:

```sql
PRIMARY KEY (id)
UNIQUE KEY uk_dash_portlet (user_id, portlet_id)
CONSTRAINT fk_dash_portlet_user FOREIGN KEY (user_id) REFERENCES users (id)
```

- user_id → users.id, 삭제: RESTRICT (기본). **현재 CREATE 목록에 대상 없음 — 검토 필요.**

<a id="tbl_notif_pref"></a>
## tbl_notif_pref — 알림 수신 설정

| 컬럼 | SQL 자료형 | NULL | 기본값 | 키·속성 | 의미 |
|---|---|---|---|---|---|
| id | CHAR(26) | 불가 | 명시 없음 | PK  | 기본 식별자 |
| user_id | CHAR(26) | 불가 | 명시 없음 | FK 선언  | 사용자 소유/연결 ID |
| evt | VARCHAR(64) | 불가 | 명시 없음 |  | 알림 사건 종류 |
| push_on | BOOLEAN | 불가 | TRUE |  | 푸시 허용 |
| email_on | BOOLEAN | 불가 | FALSE |  | 이메일 허용 |
| inapp_on | BOOLEAN | 불가 | TRUE |  | 인앱 알림 허용 |
| cfg_json | LONGTEXT | 허용 | 명시 없음 |  | 설정 JSON 문자열 |
| u_at | DATETIME(3) | 불가 | 명시 없음 |  | 수정 시각 |

키·인덱스·관계 선언:

```sql
PRIMARY KEY (id)
UNIQUE KEY uk_notif_pref (user_id, evt)
CONSTRAINT fk_notif_pref_user FOREIGN KEY (user_id) REFERENCES users (id)
```

- user_id → users.id, 삭제: RESTRICT (기본). **현재 CREATE 목록에 대상 없음 — 검토 필요.**

<a id="tbl_user_device"></a>
## tbl_user_device — 푸시 기기

| 컬럼 | SQL 자료형 | NULL | 기본값 | 키·속성 | 의미 |
|---|---|---|---|---|---|
| id | CHAR(26) | 불가 | 명시 없음 | PK  | 기본 식별자 |
| user_id | CHAR(26) | 불가 | 명시 없음 | FK 선언  | 사용자 소유/연결 ID |
| device_id | VARCHAR(128) | 불가 | 명시 없음 |  | 기기 식별자 |
| platform | VARCHAR(10) | 불가 | 'WEB' |  | 기기 플랫폼 |
| push_tok | VARCHAR(512) | 허용 | 명시 없음 |  | 푸시 토큰 (민감) |
| app_ver | VARCHAR(32) | 허용 | 명시 없음 |  | 앱 버전 |
| last_seen_utc | DATETIME(3) | 허용 | 명시 없음 |  | 최근 연결 |
| revoked_utc | DATETIME(3) | 허용 | 명시 없음 |  | 기기 해제 |
| c_at | DATETIME(3) | 불가 | 명시 없음 |  | 생성 시각 |
| u_at | DATETIME(3) | 불가 | 명시 없음 |  | 수정 시각 |

키·인덱스·관계 선언:

```sql
PRIMARY KEY (id)
UNIQUE KEY uk_user_device (user_id, device_id)
CONSTRAINT fk_user_device_user FOREIGN KEY (user_id) REFERENCES users (id)
```

- user_id → users.id, 삭제: RESTRICT (기본). **현재 CREATE 목록에 대상 없음 — 검토 필요.**

<a id="tbl_data_file"></a>
## tbl_data_file — 가져오기·내보내기 파일

| 컬럼 | SQL 자료형 | NULL | 기본값 | 키·속성 | 의미 |
|---|---|---|---|---|---|
| id | CHAR(26) | 불가 | 명시 없음 | PK  | 기본 식별자 |
| user_id | CHAR(26) | 불가 | 명시 없음 | FK 선언  | 사용자 소유/연결 ID |
| kind | VARCHAR(10) | 불가 | 명시 없음 |  | 파일 목적 |
| filename | VARCHAR(255) | 불가 | 명시 없음 |  | 표시 파일명 |
| mime | VARCHAR(100) | 허용 | 명시 없음 |  | MIME 타입 |
| size_b | BIGINT | 불가 | 0 |  | 파일 바이트 수 |
| sha256 | CHAR(64) | 허용 | 명시 없음 |  | 파일 SHA-256 |
| storage_key | VARCHAR(512) | 불가 | 명시 없음 |  | 비공개 저장소 키 |
| exp_utc | DATETIME(3) | 허용 | 명시 없음 |  | 만료 UTC |
| c_at | DATETIME(3) | 불가 | 명시 없음 |  | 생성 시각 |

키·인덱스·관계 선언:

```sql
PRIMARY KEY (id)
KEY ix_data_file_user_kind (user_id, kind)
CONSTRAINT fk_data_file_user FOREIGN KEY (user_id) REFERENCES users (id)
```

- user_id → users.id, 삭제: RESTRICT (기본). **현재 CREATE 목록에 대상 없음 — 검토 필요.**

<a id="tbl_data_job"></a>
## tbl_data_job — 데이터 작업

| 컬럼 | SQL 자료형 | NULL | 기본값 | 키·속성 | 의미 |
|---|---|---|---|---|---|
| id | CHAR(26) | 불가 | 명시 없음 | PK  | 기본 식별자 |
| user_id | CHAR(26) | 불가 | 명시 없음 | FK 선언  | 사용자 소유/연결 ID |
| typ | VARCHAR(10) | 불가 | 명시 없음 |  | 종류 |
| fmt | VARCHAR(8) | 불가 | 명시 없음 |  | 파일 형식 |
| st | VARCHAR(10) | 불가 | 'PENDING' |  | 상태 (도메인별 의미) |
| params_json | LONGTEXT | 허용 | 명시 없음 |  | 작업 입력 JSON |
| result_file_id | CHAR(26) | 허용 | 명시 없음 | FK 선언  | 처리 결과 파일 |
| err_msg | VARCHAR(500) | 허용 | 명시 없음 |  | 마스킹할 실패 메시지 |
| c_at | DATETIME(3) | 불가 | 명시 없음 |  | 생성 시각 |
| s_utc | DATETIME(3) | 허용 | 명시 없음 |  | 작업 시작 |
| e_utc | DATETIME(3) | 허용 | 명시 없음 |  | 작업 종료 |

키·인덱스·관계 선언:

```sql
PRIMARY KEY (id)
KEY ix_data_job_user_state (user_id, st)
CONSTRAINT fk_data_job_user FOREIGN KEY (user_id) REFERENCES users (id)
CONSTRAINT fk_data_job_result FOREIGN KEY (result_file_id) REFERENCES data_file (id)
```

- user_id → users.id, 삭제: RESTRICT (기본). **현재 CREATE 목록에 대상 없음 — 검토 필요.**

- result_file_id → data_file.id, 삭제: RESTRICT (기본). **현재 CREATE 목록에 대상 없음 — 검토 필요.**

<a id="tbl_import_mapping_profile"></a>
## tbl_import_mapping_profile — 가져오기 매핑

| 컬럼 | SQL 자료형 | NULL | 기본값 | 키·속성 | 의미 |
|---|---|---|---|---|---|
| id | CHAR(26) | 불가 | 명시 없음 | PK  | 기본 식별자 |
| user_id | CHAR(26) | 불가 | 명시 없음 | FK 선언  | 사용자 소유/연결 ID |
| src_typ | VARCHAR(8) | 불가 | 명시 없음 |  | 가져오기 원본 종류 |
| name | VARCHAR(100) | 불가 | 명시 없음 |  | 이름 |
| map_json | LONGTEXT | 불가 | 명시 없음 |  | 컬럼 매핑 |
| rule_json | LONGTEXT | 허용 | 명시 없음 |  | 변환 규칙 |
| c_at | DATETIME(3) | 불가 | 명시 없음 |  | 생성 시각 |
| u_at | DATETIME(3) | 불가 | 명시 없음 |  | 수정 시각 |

키·인덱스·관계 선언:

```sql
PRIMARY KEY (id)
KEY ix_import_mapping_user (user_id, src_typ)
CONSTRAINT fk_import_mapping_user FOREIGN KEY (user_id) REFERENCES users (id)
```

- user_id → users.id, 삭제: RESTRICT (기본). **현재 CREATE 목록에 대상 없음 — 검토 필요.**

<a id="tbl_ext_cal_account"></a>
## tbl_ext_cal_account — 외부 캘린더 계정

| 컬럼 | SQL 자료형 | NULL | 기본값 | 키·속성 | 의미 |
|---|---|---|---|---|---|
| id | CHAR(26) | 불가 | 명시 없음 | PK  | 기본 식별자 |
| user_id | CHAR(26) | 불가 | 명시 없음 | FK 선언  | 사용자 소유/연결 ID |
| provider | VARCHAR(10) | 불가 | 명시 없음 |  | 외부 제공자 |
| st | VARCHAR(12) | 불가 | 'CONNECTED' |  | 상태 (도메인별 의미) |
| scopes | VARCHAR(500) | 허용 | 명시 없음 |  | 승인 범위 |
| meta_json | LONGTEXT | 허용 | 명시 없음 |  | 확장 메타데이터 JSON |
| c_at | DATETIME(3) | 불가 | 명시 없음 |  | 생성 시각 |
| u_at | DATETIME(3) | 불가 | 명시 없음 |  | 수정 시각 |

키·인덱스·관계 선언:

```sql
PRIMARY KEY (id)
UNIQUE KEY uk_ext_cal_account (user_id, provider)
CONSTRAINT fk_ext_cal_user FOREIGN KEY (user_id) REFERENCES users (id)
```

- user_id → users.id, 삭제: RESTRICT (기본). **현재 CREATE 목록에 대상 없음 — 검토 필요.**

<a id="tbl_sync_run_log"></a>
## tbl_sync_run_log — 외부 동기화 로그

| 컬럼 | SQL 자료형 | NULL | 기본값 | 키·속성 | 의미 |
|---|---|---|---|---|---|
| id | CHAR(26) | 불가 | 명시 없음 | PK  | 기본 식별자 |
| user_id | CHAR(26) | 불가 | 명시 없음 | FK 선언  | 사용자 소유/연결 ID |
| provider | VARCHAR(10) | 불가 | 명시 없음 |  | 외부 제공자 |
| st | VARCHAR(10) | 불가 | 명시 없음 |  | 상태 (도메인별 의미) |
| started_utc | DATETIME(3) | 불가 | 명시 없음 |  | 실행 시작 |
| ended_utc | DATETIME(3) | 불가 | 명시 없음 |  | 실행 종료 |
| pulled_cnt | INT | 불가 | 0 |  | 가져온 건수 |
| pushed_cnt | INT | 불가 | 0 |  | 내보낸 건수 |
| conflict_cnt | INT | 불가 | 0 |  | 충돌 건수 |
| err_msg | VARCHAR(500) | 허용 | 명시 없음 |  | 마스킹할 실패 메시지 |
| meta_json | LONGTEXT | 허용 | 명시 없음 |  | 확장 메타데이터 JSON |

키·인덱스·관계 선언:

```sql
PRIMARY KEY (id)
KEY ix_sync_run_user_time (user_id, started_utc)
CONSTRAINT fk_sync_run_user FOREIGN KEY (user_id) REFERENCES users (id)
```

- user_id → users.id, 삭제: RESTRICT (기본). **현재 CREATE 목록에 대상 없음 — 검토 필요.**

<a id="tbl_support_ticket"></a>
## tbl_support_ticket — 고객 문의

| 컬럼 | SQL 자료형 | NULL | 기본값 | 키·속성 | 의미 |
|---|---|---|---|---|---|
| id | CHAR(26) | 불가 | 명시 없음 | PK  | 기본 식별자 |
| user_id | CHAR(26) | 불가 | 명시 없음 | FK 선언  | 사용자 소유/연결 ID |
| typ | VARCHAR(16) | 불가 | 'OTHER' |  | 종류 |
| st | VARCHAR(16) | 불가 | 'OPEN' |  | 상태 (도메인별 의미) |
| title | VARCHAR(200) | 불가 | 명시 없음 |  | 제목 |
| body | LONGTEXT | 불가 | 명시 없음 |  | 본문 |
| meta_json | LONGTEXT | 허용 | 명시 없음 |  | 확장 메타데이터 JSON |
| c_at | DATETIME(3) | 불가 | 명시 없음 |  | 생성 시각 |
| u_at | DATETIME(3) | 불가 | 명시 없음 |  | 수정 시각 |

키·인덱스·관계 선언:

```sql
PRIMARY KEY (id)
KEY ix_support_ticket_state (st)
CONSTRAINT fk_support_ticket_user FOREIGN KEY (user_id) REFERENCES users (id)
```

- user_id → users.id, 삭제: RESTRICT (기본). **현재 CREATE 목록에 대상 없음 — 검토 필요.**

<a id="tbl_settings_audit_log"></a>
## tbl_settings_audit_log — 설정 변경 감사

| 컬럼 | SQL 자료형 | NULL | 기본값 | 키·속성 | 의미 |
|---|---|---|---|---|---|
| id | CHAR(26) | 불가 | 명시 없음 | PK  | 기본 식별자 |
| user_id | CHAR(26) | 불가 | 명시 없음 | FK 선언  | 사용자 소유/연결 ID |
| area | VARCHAR(32) | 불가 | 명시 없음 |  | 설정 영역 |
| action | VARCHAR(32) | 불가 | 명시 없음 |  | 수행 작업 |
| diff_json | LONGTEXT | 허용 | 명시 없음 |  | 마스킹된 변경 내역 |
| at_utc | DATETIME(3) | 불가 | 명시 없음 |  | 발생 UTC |

키·인덱스·관계 선언:

```sql
PRIMARY KEY (id)
KEY ix_settings_audit_user_time (user_id, at_utc)
CONSTRAINT fk_settings_audit_user FOREIGN KEY (user_id) REFERENCES users (id)
```

- user_id → users.id, 삭제: RESTRICT (기본). **현재 CREATE 목록에 대상 없음 — 검토 필요.**

<a id="tbl_event_policy"></a>
## tbl_event_policy — 일정 편집 정책

| 컬럼 | SQL 자료형 | NULL | 기본값 | 키·속성 | 의미 |
|---|---|---|---|---|---|
| event_id | BIGINT | 불가 | 명시 없음 | PK FK 선언  | 일정 ID |
| editor_del | BOOLEAN | 불가 | FALSE |  | 편집자 삭제 허용 |
| def_edit_sc | VARCHAR(8) | 불가 | 'future' |  | 기본 수정 범위 |
| def_del_sc | VARCHAR(8) | 불가 | 'none' |  | 기본 삭제 범위 |
| max_edit_sc | VARCHAR(8) | 불가 | 'future' |  | 최대 수정 범위 |
| max_del_sc | VARCHAR(8) | 불가 | 'future' |  | 최대 삭제 범위 |
| u_at | DATETIME(3) | 불가 | 명시 없음 |  | 수정 시각 |

키·인덱스·관계 선언:

```sql
PRIMARY KEY (event_id)
CONSTRAINT fk_event_policy_event FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
```

- event_id → events.id, 삭제: CASCADE. **현재 CREATE 목록에 대상 없음 — 검토 필요.**

<a id="tbl_event_share"></a>
## tbl_event_share — 일정별 공유

| 컬럼 | SQL 자료형 | NULL | 기본값 | 키·속성 | 의미 |
|---|---|---|---|---|---|
| id | CHAR(26) | 불가 | 명시 없음 | PK  | 기본 식별자 |
| event_id | BIGINT | 불가 | 명시 없음 | FK 선언  | 일정 ID |
| user_id | CHAR(26) | 불가 | 명시 없음 | FK 선언  | 사용자 소유/연결 ID |
| role | VARCHAR(8) | 불가 | 명시 없음 |  | 역할 |
| edit_sc | VARCHAR(8) | 불가 | 'single' |  | 수정 범위 |
| del_sc | VARCHAR(8) | 불가 | 'none' |  | 삭제 범위 |
| by_id | CHAR(26) | 불가 | 명시 없음 |  | 처리자 ID |
| at | DATETIME(3) | 불가 | 명시 없음 |  | 발생 시각 |

키·인덱스·관계 선언:

```sql
PRIMARY KEY (id)
UNIQUE KEY uk_event_share (event_id, user_id)
KEY ix_event_share_user (user_id)
CONSTRAINT fk_event_share_event FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
CONSTRAINT fk_event_share_user FOREIGN KEY (user_id) REFERENCES users (id)
```

- event_id → events.id, 삭제: CASCADE. **현재 CREATE 목록에 대상 없음 — 검토 필요.**

- user_id → users.id, 삭제: RESTRICT (기본). **현재 CREATE 목록에 대상 없음 — 검토 필요.**

<a id="tbl_event_ex"></a>
## tbl_event_ex — 반복 회차 예외

| 컬럼 | SQL 자료형 | NULL | 기본값 | 키·속성 | 의미 |
|---|---|---|---|---|---|
| id | CHAR(26) | 불가 | 명시 없음 | PK  | 기본 식별자 |
| event_id | BIGINT | 불가 | 명시 없음 | FK 선언  | 일정 ID |
| occ_start | CHAR(16) | 불가 | 명시 없음 |  | 원본 회차 지역 시각 |
| cancel | BOOLEAN | 불가 | FALSE |  | 회차 취소 |
| o_title | VARCHAR(200) | 허용 | 명시 없음 |  | 예외 제목 |
| o_note | TEXT | 허용 | 명시 없음 |  | 예외 메모 |
| o_loc | VARCHAR(255) | 허용 | 명시 없음 |  | 예외 장소 |
| o_start_utc | DATETIME(3) | 허용 | 명시 없음 |  | 예외 시작 UTC |
| o_end_utc | DATETIME(3) | 허용 | 명시 없음 |  | 예외 종료 UTC |
| o_all_day | BOOLEAN | 허용 | 명시 없음 |  | 예외 종일 여부 |
| o_tz | VARCHAR(64) | 허용 | 명시 없음 |  | 예외 시간대 |
| o_cat_id | CHAR(26) | 허용 | 명시 없음 |  | 예외 분류 ID |
| o_cat_name | VARCHAR(60) | 허용 | 명시 없음 |  | 예외 분류명 |
| o_cat_color | CHAR(7) | 허용 | 명시 없음 |  | 예외 분류 색 |
| o_cat_icon | VARCHAR(16) | 허용 | 명시 없음 |  | 예외 분류 아이콘 |
| by_id | CHAR(26) | 불가 | 명시 없음 |  | 처리자 ID |
| c_at | DATETIME(3) | 불가 | 명시 없음 |  | 생성 시각 |
| u_at | DATETIME(3) | 불가 | 명시 없음 |  | 수정 시각 |

키·인덱스·관계 선언:

```sql
PRIMARY KEY (id)
UNIQUE KEY uk_event_ex (event_id, occ_start)
CONSTRAINT fk_event_ex_event FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
```

- event_id → events.id, 삭제: CASCADE. **현재 CREATE 목록에 대상 없음 — 검토 필요.**

<a id="tbl_event_ver"></a>
## tbl_event_ver — 일정 변경 이력

| 컬럼 | SQL 자료형 | NULL | 기본값 | 키·속성 | 의미 |
|---|---|---|---|---|---|
| id | CHAR(26) | 불가 | 명시 없음 | PK  | 기본 식별자 |
| event_id | BIGINT | 불가 | 명시 없음 | FK 선언  | 일정 ID |
| ver_no | INT | 불가 | 명시 없음 |  | 기록 버전 |
| at | DATETIME(3) | 불가 | 명시 없음 |  | 발생 시각 |
| by_id | CHAR(26) | 불가 | 명시 없음 |  | 처리자 ID |
| summary | VARCHAR(255) | 허용 | 명시 없음 |  | 변경 요약 |
| snap | LONGTEXT | 불가 | 명시 없음 |  | 전체 스냅샷 JSON |
| diff | LONGTEXT | 허용 | 명시 없음 |  | 변경 JSON |

키·인덱스·관계 선언:

```sql
PRIMARY KEY (id)
UNIQUE KEY uk_event_version (event_id, ver_no)
CONSTRAINT fk_event_ver_event FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
```

- event_id → events.id, 삭제: CASCADE. **현재 CREATE 목록에 대상 없음 — 검토 필요.**

<a id="tbl_time_entry"></a>
## tbl_time_entry — 계획/실제 블록

| 컬럼 | SQL 자료형 | NULL | 기본값 | 키·속성 | 의미 |
|---|---|---|---|---|---|
| id | CHAR(26) | 불가 | 명시 없음 | PK  | 기본 식별자 |
| user_id | CHAR(26) | 불가 | 명시 없음 | FK 선언  | 사용자 소유/연결 ID |
| typ | VARCHAR(8) | 불가 | 명시 없음 |  | 종류 |
| title | VARCHAR(200) | 불가 | 명시 없음 |  | 제목 |
| start_utc | DATETIME(3) | 불가 | 명시 없음 |  | 시작 UTC |
| end_utc | DATETIME(3) | 불가 | 명시 없음 |  | 종료 UTC |
| tz | VARCHAR(64) | 불가 | 명시 없음 |  | IANA 시간대 |
| cat_id | CHAR(26) | 허용 | 명시 없음 |  | 분류 ID |
| cat_name | VARCHAR(60) | 허용 | 명시 없음 |  | 분류명 스냅샷 |
| cat_color | CHAR(7) | 허용 | 명시 없음 |  | 분류 색상 스냅샷 |
| cat_icon | VARCHAR(16) | 허용 | 명시 없음 |  | 분류 아이콘 스냅샷 |
| event_id | BIGINT | 허용 | 명시 없음 | FK 선언  | 일정 ID |
| memo | TEXT | 허용 | 명시 없음 |  | 시간 블록 메모 |
| c_at | DATETIME(3) | 불가 | 명시 없음 |  | 생성 시각 |
| u_at | DATETIME(3) | 불가 | 명시 없음 |  | 수정 시각 |
| d_at | DATETIME(3) | 허용 | 명시 없음 |  | 논리 삭제 시각 |

키·인덱스·관계 선언:

```sql
PRIMARY KEY (id)
KEY ix_time_entry_user_time (user_id, start_utc, end_utc)
KEY ix_time_entry_kind (user_id, typ, start_utc)
CONSTRAINT fk_time_entry_user FOREIGN KEY (user_id) REFERENCES users (id)
CONSTRAINT fk_time_entry_event FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE SET NULL
```

- user_id → users.id, 삭제: RESTRICT (기본). **현재 CREATE 목록에 대상 없음 — 검토 필요.**

- event_id → events.id, 삭제: SET NULL. **현재 CREATE 목록에 대상 없음 — 검토 필요.**

<a id="tbl_task_member"></a>
## tbl_task_member — 할 일 참여자

| 컬럼 | SQL 자료형 | NULL | 기본값 | 키·속성 | 의미 |
|---|---|---|---|---|---|
| id | BIGINT | 불가 | 명시 없음 | PK AUTO_INCREMENT | 기본 식별자 |
| task_id | CHAR(26) | 불가 | 명시 없음 | FK 선언  | 할 일 ID |
| user_id | CHAR(26) | 불가 | 명시 없음 | FK 선언  | 사용자 소유/연결 ID |
| joined_at | DATETIME(3) | 불가 | 명시 없음 |  | 참여 시각 |

키·인덱스·관계 선언:

```sql
PRIMARY KEY (id)
UNIQUE KEY uk_task_member (task_id, user_id)
KEY ix_task_member_user (user_id)
CONSTRAINT fk_task_member_task FOREIGN KEY (task_id) REFERENCES task (id) ON DELETE CASCADE
CONSTRAINT fk_task_member_user FOREIGN KEY (user_id) REFERENCES users (id)
```

- task_id → task.id, 삭제: CASCADE. **현재 CREATE 목록에 대상 없음 — 검토 필요.**

- user_id → users.id, 삭제: RESTRICT (기본). **현재 CREATE 목록에 대상 없음 — 검토 필요.**

<a id="tbl_task_repeat_rule"></a>
## tbl_task_repeat_rule — 할 일 반복 규칙

| 컬럼 | SQL 자료형 | NULL | 기본값 | 키·속성 | 의미 |
|---|---|---|---|---|---|
| task_id | CHAR(26) | 불가 | 명시 없음 | PK FK 선언  | 할 일 ID |
| freq | VARCHAR(10) | 불가 | 'DAILY' |  | 반복 빈도 |
| interval_val | INT | 불가 | 1 |  | 반복 간격 |
| weekdays | VARCHAR(30) | 허용 | 명시 없음 |  | 반복 요일 |
| end_type | VARCHAR(8) | 불가 | 'NONE' |  | 반복 종료 유형 |
| end_until | DATE | 허용 | 명시 없음 |  | 반복 종료일 |

키·인덱스·관계 선언:

```sql
PRIMARY KEY (task_id)
CONSTRAINT fk_task_repeat_task FOREIGN KEY (task_id) REFERENCES task (id) ON DELETE CASCADE
```

- task_id → task.id, 삭제: CASCADE. **현재 CREATE 목록에 대상 없음 — 검토 필요.**

<a id="tbl_memo"></a>
## tbl_memo — 메모

| 컬럼 | SQL 자료형 | NULL | 기본값 | 키·속성 | 의미 |
|---|---|---|---|---|---|
| id | CHAR(26) | 불가 | 명시 없음 | PK  | 기본 식별자 |
| user_id | CHAR(26) | 불가 | 명시 없음 | FK 선언  | 사용자 소유/연결 ID |
| typ | VARCHAR(8) | 불가 | 'text' |  | 종류 |
| title | VARCHAR(200) | 허용 | 명시 없음 |  | 제목 |
| body | LONGTEXT | 허용 | 명시 없음 |  | 본문 |
| stt | LONGTEXT | 허용 | 명시 없음 |  | 음성 인식 텍스트 |
| st | VARCHAR(10) | 불가 | 'inbox' |  | 상태 (도메인별 의미) |
| tags | VARCHAR(500) | 허용 | 명시 없음 |  | 현재는 문자열 태그 |
| c_at | DATETIME(3) | 불가 | 명시 없음 |  | 생성 시각 |
| u_at | DATETIME(3) | 불가 | 명시 없음 |  | 수정 시각 |
| d_at | DATETIME(3) | 허용 | 명시 없음 |  | 논리 삭제 시각 |

키·인덱스·관계 선언:

```sql
PRIMARY KEY (id)
KEY ix_memo_user_state (user_id, st)
CONSTRAINT fk_memo_user FOREIGN KEY (user_id) REFERENCES users (id)
```

- user_id → users.id, 삭제: RESTRICT (기본). **현재 CREATE 목록에 대상 없음 — 검토 필요.**

<a id="tbl_diary"></a>
## tbl_diary — 일간 회고

| 컬럼 | SQL 자료형 | NULL | 기본값 | 키·속성 | 의미 |
|---|---|---|---|---|---|
| id | CHAR(26) | 불가 | 명시 없음 | PK  | 기본 식별자 |
| user_id | CHAR(26) | 불가 | 명시 없음 | FK 선언  | 사용자 소유/연결 ID |
| dt | DATE | 불가 | 명시 없음 |  | 기록 날짜 |
| mood | VARCHAR(10) | 불가 | 'good' |  | 기분 |
| sumry | TEXT | 허용 | 명시 없음 |  | 요약 |
| body | TEXT | 허용 | 명시 없음 |  | 본문 |
| grat | TEXT | 허용 | 명시 없음 |  | 감사 기록 |
| c_at | DATETIME(3) | 불가 | 명시 없음 |  | 생성 시각 |
| u_at | DATETIME(3) | 불가 | 명시 없음 |  | 수정 시각 |

키·인덱스·관계 선언:

```sql
PRIMARY KEY (id)
UNIQUE KEY uk_diary_user_date (user_id, dt)
CONSTRAINT fk_diary_user FOREIGN KEY (user_id) REFERENCES users (id)
```

- user_id → users.id, 삭제: RESTRICT (기본). **현재 CREATE 목록에 대상 없음 — 검토 필요.**

<a id="tbl_friend"></a>
## tbl_friend — 친구 관계

| 컬럼 | SQL 자료형 | NULL | 기본값 | 키·속성 | 의미 |
|---|---|---|---|---|---|
| id | CHAR(26) | 불가 | 명시 없음 | PK  | 기본 식별자 |
| a_id | CHAR(26) | 불가 | 명시 없음 | FK 선언  | 친구쌍 A |
| b_id | CHAR(26) | 불가 | 명시 없음 | FK 선언  | 친구쌍 B |
| st | VARCHAR(10) | 불가 | 'pending' |  | 상태 (도메인별 의미) |
| req_by | CHAR(26) | 불가 | 명시 없음 |  | 초대 요청자 |
| c_at | DATETIME(3) | 불가 | 명시 없음 |  | 생성 시각 |
| u_at | DATETIME(3) | 불가 | 명시 없음 |  | 수정 시각 |

키·인덱스·관계 선언:

```sql
PRIMARY KEY (id)
UNIQUE KEY uk_friend_pair (a_id, b_id)
CONSTRAINT fk_friend_a FOREIGN KEY (a_id) REFERENCES users (id)
CONSTRAINT fk_friend_b FOREIGN KEY (b_id) REFERENCES users (id)
```

- a_id → users.id, 삭제: RESTRICT (기본). **현재 CREATE 목록에 대상 없음 — 검토 필요.**

- b_id → users.id, 삭제: RESTRICT (기본). **현재 CREATE 목록에 대상 없음 — 검토 필요.**

<a id="tbl_cal_group"></a>
## tbl_cal_group — 캘린더 그룹

| 컬럼 | SQL 자료형 | NULL | 기본값 | 키·속성 | 의미 |
|---|---|---|---|---|---|
| id | CHAR(26) | 불가 | 명시 없음 | PK  | 기본 식별자 |
| owner_id | CHAR(26) | 불가 | 명시 없음 | FK 선언  | 소유자 ID |
| name | VARCHAR(80) | 불가 | 명시 없음 |  | 이름 |
| note | VARCHAR(255) | 허용 | 명시 없음 |  | 메모 |
| c_at | DATETIME(3) | 불가 | 명시 없음 |  | 생성 시각 |
| u_at | DATETIME(3) | 불가 | 명시 없음 |  | 수정 시각 |

키·인덱스·관계 선언:

```sql
PRIMARY KEY (id)
CONSTRAINT fk_cal_group_owner FOREIGN KEY (owner_id) REFERENCES users (id)
```

- owner_id → users.id, 삭제: RESTRICT (기본). **현재 CREATE 목록에 대상 없음 — 검토 필요.**

<a id="tbl_cal_group_mem"></a>
## tbl_cal_group_mem — 그룹 멤버

| 컬럼 | SQL 자료형 | NULL | 기본값 | 키·속성 | 의미 |
|---|---|---|---|---|---|
| id | CHAR(26) | 불가 | 명시 없음 | PK  | 기본 식별자 |
| gid | CHAR(26) | 불가 | 명시 없음 | FK 선언  | 캘린더 그룹 ID |
| user_id | CHAR(26) | 불가 | 명시 없음 | FK 선언  | 사용자 소유/연결 ID |
| role | VARCHAR(10) | 불가 | 'member' |  | 역할 |
| at | DATETIME(3) | 불가 | 명시 없음 |  | 발생 시각 |

키·인덱스·관계 선언:

```sql
PRIMARY KEY (id)
UNIQUE KEY uk_cal_group_member (gid, user_id)
KEY ix_cal_group_member_user (user_id)
CONSTRAINT fk_cal_group_mem_group FOREIGN KEY (gid) REFERENCES cal_group (id) ON DELETE CASCADE
CONSTRAINT fk_cal_group_mem_user FOREIGN KEY (user_id) REFERENCES users (id)
```

- gid → cal_group.id, 삭제: CASCADE. **현재 CREATE 목록에 대상 없음 — 검토 필요.**

- user_id → users.id, 삭제: RESTRICT (기본). **현재 CREATE 목록에 대상 없음 — 검토 필요.**

<a id="tbl_theme_catalog"></a>
## tbl_theme_catalog — 테마 목록

| 컬럼 | SQL 자료형 | NULL | 기본값 | 키·속성 | 의미 |
|---|---|---|---|---|---|
| id | VARCHAR(64) | 불가 | 명시 없음 | PK  | 기본 식별자 |
| name | VARCHAR(80) | 불가 | 명시 없음 |  | 이름 |
| enabled | BOOLEAN | 불가 | TRUE |  | 사용 가능 여부 |
| ord | INT | 불가 | 0 |  | 정렬 순서 |
| meta_json | LONGTEXT | 허용 | 명시 없음 |  | 확장 메타데이터 JSON |
| u_at | DATETIME(3) | 불가 | 명시 없음 |  | 수정 시각 |

키·인덱스·관계 선언:

```sql
PRIMARY KEY (id)
```

<a id="tbl_sticker_pack"></a>
## tbl_sticker_pack — 스티커 팩

| 컬럼 | SQL 자료형 | NULL | 기본값 | 키·속성 | 의미 |
|---|---|---|---|---|---|
| id | CHAR(26) | 불가 | 명시 없음 | PK  | 기본 식별자 |
| code | VARCHAR(64) | 불가 | 명시 없음 |  | 고유 코드 |
| name | VARCHAR(80) | 불가 | 명시 없음 |  | 이름 |
| enabled | BOOLEAN | 불가 | TRUE |  | 사용 가능 여부 |
| ord | INT | 불가 | 0 |  | 정렬 순서 |
| meta_json | LONGTEXT | 허용 | 명시 없음 |  | 확장 메타데이터 JSON |
| c_at | DATETIME(3) | 불가 | 명시 없음 |  | 생성 시각 |
| u_at | DATETIME(3) | 불가 | 명시 없음 |  | 수정 시각 |

키·인덱스·관계 선언:

```sql
PRIMARY KEY (id)
UNIQUE KEY uk_sticker_pack_code (code)
```

<a id="tbl_sticker_item"></a>
## tbl_sticker_item — 스티커 자산

| 컬럼 | SQL 자료형 | NULL | 기본값 | 키·속성 | 의미 |
|---|---|---|---|---|---|
| id | CHAR(26) | 불가 | 명시 없음 | PK  | 기본 식별자 |
| pack_id | CHAR(26) | 불가 | 명시 없음 | FK 선언  | 스티커 팩 ID |
| code | VARCHAR(64) | 불가 | 명시 없음 |  | 고유 코드 |
| label | VARCHAR(80) | 허용 | 명시 없음 |  | 표시 이름 |
| asset_url | VARCHAR(512) | 불가 | 명시 없음 |  | 스티커 자산 URL |
| ord | INT | 불가 | 0 |  | 정렬 순서 |
| meta_json | LONGTEXT | 허용 | 명시 없음 |  | 확장 메타데이터 JSON |

키·인덱스·관계 선언:

```sql
PRIMARY KEY (id)
UNIQUE KEY uk_sticker_item (pack_id, code)
CONSTRAINT fk_sticker_item_pack FOREIGN KEY (pack_id) REFERENCES sticker_pack (id)
```

- pack_id → sticker_pack.id, 삭제: RESTRICT (기본). **현재 CREATE 목록에 대상 없음 — 검토 필요.**

<a id="tbl_user_sticker_pack"></a>
## tbl_user_sticker_pack — 내 스티커 팩

| 컬럼 | SQL 자료형 | NULL | 기본값 | 키·속성 | 의미 |
|---|---|---|---|---|---|
| id | CHAR(26) | 불가 | 명시 없음 | PK  | 기본 식별자 |
| user_id | CHAR(26) | 불가 | 명시 없음 | FK 선언  | 사용자 소유/연결 ID |
| pack_id | CHAR(26) | 불가 | 명시 없음 | FK 선언  | 스티커 팩 ID |
| installed | BOOLEAN | 불가 | TRUE |  | 설치 여부 |
| pinned | BOOLEAN | 불가 | FALSE |  | 고정 여부 |
| at | DATETIME(3) | 불가 | 명시 없음 |  | 발생 시각 |

키·인덱스·관계 선언:

```sql
PRIMARY KEY (id)
UNIQUE KEY uk_user_sticker_pack (user_id, pack_id)
CONSTRAINT fk_user_sticker_user FOREIGN KEY (user_id) REFERENCES users (id)
CONSTRAINT fk_user_sticker_pack FOREIGN KEY (pack_id) REFERENCES sticker_pack (id)
```

- user_id → users.id, 삭제: RESTRICT (기본). **현재 CREATE 목록에 대상 없음 — 검토 필요.**

- pack_id → sticker_pack.id, 삭제: RESTRICT (기본). **현재 CREATE 목록에 대상 없음 — 검토 필요.**
