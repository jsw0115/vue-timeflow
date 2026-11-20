# SQL·JPA·목표 API 정합성 보고서

2026-09-26, 읽기 전용 정적 검사. DB 접속/실행/repair/기존 migration 변경은 수행하지 않았습니다.

## 확인된 문제

1. 현재 V1은 37개 테이블에 CREATE OR REPLACE TABLE을 사용합니다. 같은 이름의 기존 테이블이 있으면 데이터를 잃을 수 있으므로 재실행 금지입니다.
2. tbl_ 생성명과 접두어 없는 FK 39개가 불일치합니다. 빈 DB에서는 대상 테이블 미존재로 실패할 수 있고, 접두어 없는 테이블이 이미 있다면 잘못된 별도 테이블을 참조할 위험이 있습니다.
3. JPA는 아래 8개 이름을 사용하지만 V1 CREATE 목록에는 없습니다. 기존 문서의 접두어 없는 테이블명 설명은 JPA 기준이지 현재 SQL 생성명 기준이 아닙니다.

| Entity 소스 | JPA @Table | V1 선언 이름 |
|---|---|---|
| LoginThrottleEntity.java | login_throttle | tbl_login_throttle |
| RefreshTokenEntity.java | refresh_token | tbl_refresh_token |
| UserEntity.java | users | tbl_users |
| EventEntity.java | events | tbl_events |
| PlannerItemEntity.java | planner_item | tbl_planner_item |
| RoutineEntity.java | routine | tbl_routine |
| RoutineLogEntity.java | routine_log | tbl_routine_log |
| TaskEntity.java | task | tbl_task |

## FK 불일치 전체 목록

| 선언 테이블 | FK | 선언 대상 |
|---|---|---|
| tbl_refresh_token | fk_refresh_token_user (user_id) | users.id |
| tbl_events | fk_events_user (user_id) | users.id |
| tbl_task | fk_task_user (user_id) | users.id |
| tbl_routine | fk_routine_user (user_id) | users.id |
| tbl_routine_log | fk_routine_log_routine (routine_id) | routine.id |
| tbl_category | fk_category_user (user_id) | users.id |
| tbl_user_pref | fk_user_pref_user (user_id) | users.id |
| tbl_dash_layout | fk_dash_layout_user (user_id) | users.id |
| tbl_dash_portlet_pref | fk_dash_portlet_user (user_id) | users.id |
| tbl_notif_pref | fk_notif_pref_user (user_id) | users.id |
| tbl_user_device | fk_user_device_user (user_id) | users.id |
| tbl_data_file | fk_data_file_user (user_id) | users.id |
| tbl_data_job | fk_data_job_user (user_id) | users.id |
| tbl_data_job | fk_data_job_result (result_file_id) | data_file.id |
| tbl_import_mapping_profile | fk_import_mapping_user (user_id) | users.id |
| tbl_ext_cal_account | fk_ext_cal_user (user_id) | users.id |
| tbl_sync_run_log | fk_sync_run_user (user_id) | users.id |
| tbl_support_ticket | fk_support_ticket_user (user_id) | users.id |
| tbl_settings_audit_log | fk_settings_audit_user (user_id) | users.id |
| tbl_event_policy | fk_event_policy_event (event_id) | events.id |
| tbl_event_share | fk_event_share_event (event_id) | events.id |
| tbl_event_share | fk_event_share_user (user_id) | users.id |
| tbl_event_ex | fk_event_ex_event (event_id) | events.id |
| tbl_event_ver | fk_event_ver_event (event_id) | events.id |
| tbl_time_entry | fk_time_entry_user (user_id) | users.id |
| tbl_time_entry | fk_time_entry_event (event_id) | events.id |
| tbl_task_member | fk_task_member_task (task_id) | task.id |
| tbl_task_member | fk_task_member_user (user_id) | users.id |
| tbl_task_repeat_rule | fk_task_repeat_task (task_id) | task.id |
| tbl_memo | fk_memo_user (user_id) | users.id |
| tbl_diary | fk_diary_user (user_id) | users.id |
| tbl_friend | fk_friend_a (a_id) | users.id |
| tbl_friend | fk_friend_b (b_id) | users.id |
| tbl_cal_group | fk_cal_group_owner (owner_id) | users.id |
| tbl_cal_group_mem | fk_cal_group_mem_group (gid) | cal_group.id |
| tbl_cal_group_mem | fk_cal_group_mem_user (user_id) | users.id |
| tbl_sticker_item | fk_sticker_item_pack (pack_id) | sticker_pack.id |
| tbl_user_sticker_pack | fk_user_sticker_user (user_id) | users.id |
| tbl_user_sticker_pack | fk_user_sticker_pack (pack_id) | sticker_pack.id |

## 모델 차이

- task.event_id CHAR(26)와 events.id BIGINT가 달라 직접 FK가 없습니다. API의 string ID 직렬화와 DB 타입 변환은 다른 문제입니다. 새 연결 컬럼과 이관 검증이 필요합니다.
- events는 단일 date + start_time/end_time입니다. 날짜를 넘기는 일정/UTC/allDay/timezone에는 컬럼 추가가 필요합니다.
- routine에는 진행 시간·시간대·목표·본문/태그 필드가 없습니다.
- planner_item에는 user_id가 없고 현재 PlannerService는 공용 메모리입니다. 개인 데이터 API로 사용하면 안 됩니다.
- diary UNIQUE(user_id,dt)는 일간 1개이며 로컬 UI의 여러 글/일 모델과 차이가 있습니다.
- category와 dash_layout의 nullable 컬럼을 포함한 UNIQUE는 NULL 중복 방지를 보장하지 않습니다. 시스템 카테고리/기본 bp의 별도 제약이 필요합니다.
- 대부분 확장 테이블은 SQL 선언만 있고 Entity/Service/API 구현이 없습니다. notifications, WBS, 근무 기록, community/challenge/chat, tag/mention, outbox/change log는 별도 목표 설계입니다.

## 안전한 이관 절차 (설계, 미실행)

1. DB 담당자가 접속 대상/스키마/백업·복원 가능 여부를 확인합니다. SHOW TABLES, information_schema, flyway_schema_history를 읽어 tbl_와 비접두어 테이블 공존 여부를 확인합니다. 비밀번호를 문서나 명령 로그에 넣지 않습니다.
2. 운영 기준 이름은 JPA 호환 비접두어 이름을 목표로 제안합니다. 실제 DB에 어떤 데이터가 있는지 확인 전 RENAME/DROP을 결정하지 않습니다.
3. 기존 적용 V1 checksum을 보존합니다. 적용 이력/현재 상태가 다른 DB에 일괄 repair를 실행하지 않습니다. 파일 변경 이력은 git/백업에서 복원하고 승인된 후속 migration을 작성합니다.
4. 빈 신규 DB용 검증 baseline과 기존 DB용 증가 migration은 별도 경로로 준비합니다. 실패한 최초 설치에도 무조건 V2를 실행하면 해결된다고 가정하지 않습니다.
5. shadow 테이블/새 nullable 컬럼에 복사하고 행 수·PK·FK orphan·타입 범위·UTC 변환을 검증합니다. FK 불일치를 FOREIGN_KEY_CHECKS=0으로 숨기지 않습니다.
6. API 계약 테스트 및 실데이터 복원 연습 후 점검 창에서 전환합니다. destructive 정리는 승인·보관기간 이후 별도 migration으로 수행합니다. MariaDB DDL 전체가 rollback된다고 가정하지 않습니다.
7. 변경 후 read-only smoke, 교차 사용자 접근 제어, 인덱스 EXPLAIN, Flyway validate를 수행합니다.
