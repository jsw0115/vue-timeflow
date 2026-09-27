"""Build the review-only MySQL design from the repository's current DDL.

Run from the repository root. Does not modify Flyway migrations or application code.
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/database'
SOURCE = ROOT / 'backend/src/main/resources/db/migration/V1__initial_schema.sql'


def split_parts(text):
    parts, start, depth, quote = [], 0, 0, None
    for i, char in enumerate(text):
        if quote:
            if char == quote:
                quote = None
        elif char in "'`":
            quote = char
        elif char == '(':
            depth += 1
        elif char == ')':
            depth -= 1
        elif char == ',' and depth == 0:
            parts.append(text[start:i].strip())
            start = i + 1
    parts.append(text[start:].strip())
    return parts


tables = {}
for name, body in re.findall(r'CREATE OR REPLACE TABLE (\w+) \((.*?)\) ENGINE=', SOURCE.read_text(encoding='utf-8'), re.S):
    cols, constraints = {}, []
    for part in split_parts(body):
        if part.startswith(('PRIMARY ', 'UNIQUE ', 'KEY ', 'CONSTRAINT ')):
            part = re.sub(r'REFERENCES (\w+)', lambda m: 'REFERENCES tbl_' + m[1], part)
            part = re.sub(r' ON DELETE (CASCADE|SET NULL)', '', part)
            if 'FOREIGN KEY' in part:
                part += ' ON DELETE RESTRICT ON UPDATE RESTRICT'
            constraints.append(part)
        else:
            col, spec = part.split(None, 1)
            cols[col.strip('`')] = spec.replace('DATETIME(3)', 'DATETIME(6)')
    tables[name] = {'cols': cols, 'constraints': constraints}


def t(name):
    return tables['tbl_' + name]


def add(name, col, spec):
    t(name)['cols'][col] = spec


def drop(name, *cols):
    for col in cols:
        t(name)['cols'].pop(col, None)


def remove(name, token):
    t(name)['constraints'] = [x for x in t(name)['constraints'] if token not in x]


def constraint(name, value):
    t(name)['constraints'].append(value)


def fk(name, suffix, columns, parent, refs='id'):
    constraint(name, f'CONSTRAINT fk_{name}_{suffix} FOREIGN KEY ({columns}) REFERENCES tbl_{parent} ({refs}) ON DELETE RESTRICT ON UPDATE RESTRICT')


def ck(name, suffix, expr):
    constraint(name, f'CONSTRAINT ck_{name}_{suffix} CHECK ({expr})')


def uk(name, suffix, columns):
    constraint(name, f'UNIQUE KEY uk_{name}_{suffix} ({columns})')


def ix(name, suffix, columns):
    constraint(name, f'KEY ix_{name}_{suffix} ({columns})')


def new(name, cols, pk):
    tables['tbl_' + name] = {'cols': dict(cols), 'constraints': [f'PRIMARY KEY ({pk})']}


# Keep current public identifiers, but use case-sensitive identifier storage.
add('users', 'is_enabled', 'BOOLEAN NOT NULL DEFAULT TRUE')
add('refresh_token', 'tok_hash', 'CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL')
uk('refresh_token', 'jti', 'jti')
fk('refresh_token', 'device', 'user_id, device_id', 'user_device', 'user_id, device_id')
ck('refresh_token', 'expiry', 'exp_utc > c_at')
ck('login_throttle', 'count', 'fail_cnt >= 0')

# Personal categories; shared defaults are copied into each user's namespace.
add('category', 'user_id', 'CHAR(26) NOT NULL')
uk('category', 'owner_id', 'user_id, id')
fk('category', 'parent', 'user_id, parent_id', 'category', 'user_id, id')
fk('category', 'deleted_by', 'd_by', 'users')
ck('category', 'parent', 'parent_id IS NULL OR parent_id <> id')
ck('category', 'order', 'ord >= 0')

new('event_series', [('id', 'BIGINT NOT NULL AUTO_INCREMENT'), ('user_id', 'CHAR(26) NOT NULL'),
    ('rrule', 'VARCHAR(1000) NULL'), ('tz', "VARCHAR(64) NOT NULL DEFAULT 'Asia/Seoul'"),
    ('c_at', 'DATETIME(6) NOT NULL'), ('u_at', 'DATETIME(6) NOT NULL')], 'id')
fk('event_series', 'user', 'user_id', 'users')
uk('event_series', 'owner_id', 'user_id, id')

# A row is a materialized occurrence. Timed and all-day ranges are mutually exclusive.
drop('events', 'category', 'date', 'start_time', 'end_time')
remove('events', 'ix_events_user_date')
remove('events', 'ix_events_series_date')
for col, spec in [('cat_id', 'CHAR(26) NULL'), ('all_day', 'BOOLEAN NOT NULL DEFAULT FALSE'),
        ('start_utc', 'DATETIME(6) NULL'), ('end_utc', 'DATETIME(6) NULL'),
        ('start_date', 'DATE NULL'), ('end_date', 'DATE NULL'),
        ('tz', "VARCHAR(64) NOT NULL DEFAULT 'Asia/Seoul'"), ('d_at', 'DATETIME(6) NULL'),
        ('row_version', 'BIGINT NOT NULL DEFAULT 0')]:
    add('events', col, spec)
add('events', 'visibility', "VARCHAR(20) NOT NULL DEFAULT 'PRIVATE'")
uk('events', 'owner_id', 'user_id, id')
fk('events', 'series', 'user_id, series_id', 'event_series', 'user_id, id')
fk('events', 'category', 'user_id, cat_id', 'category', 'user_id, id')
ck('events', 'range', '(all_day = 0 AND start_utc IS NOT NULL AND end_utc IS NOT NULL AND end_utc > start_utc AND start_date IS NULL AND end_date IS NULL) OR (all_day = 1 AND start_date IS NOT NULL AND end_date IS NOT NULL AND end_date > start_date AND start_utc IS NULL AND end_utc IS NULL)')
ck('events', 'version', 'row_version >= 0')
ix('events', 'user_time', 'user_id, d_at, start_utc, id')
ix('events', 'user_day', 'user_id, d_at, start_date, id')
ix('events', 'series_time', 'series_id, start_utc')
ix('events', 'series_day', 'series_id, start_date')

for name in ['task', 'routine', 'time_entry']:
    drop(name, 'cat_name', 'cat_color', 'cat_icon')
    fk(name, 'category', 'user_id, cat_id', 'category', 'user_id, id')
add('task', 'event_id', 'BIGINT NULL')
drop('task', 'is_repeat')
fk('task', 'event', 'user_id, event_id', 'events', 'user_id, id')
remove('time_entry', 'fk_time_entry_event')
fk('time_entry', 'event', 'user_id, event_id', 'events', 'user_id, id')
ck('time_entry', 'range', 'end_utc > start_utc')
ck('task', 'duration', 'duration_min > 0')

drop('routine', 'days')
add('routine', 'at_time', 'TIME NOT NULL')
add('routine', 'tz', "VARCHAR(64) NOT NULL DEFAULT 'Asia/Seoul'")
ck('routine', 'clock', "at_time >= '00:00:00' AND at_time < '24:00:00'")
ck('routine', 'reminder', 'n_min IS NULL OR n_min >= 0')
new('routine_weekday', [('routine_id', 'CHAR(26) NOT NULL'), ('weekday', 'TINYINT NOT NULL')], 'routine_id, weekday')
fk('routine_weekday', 'routine', 'routine_id', 'routine')
ck('routine_weekday', 'day', 'weekday BETWEEN 1 AND 7')
drop('task_repeat_rule', 'weekdays')
add('task_repeat_rule', 'tz', "VARCHAR(64) NOT NULL DEFAULT 'Asia/Seoul'")
ck('task_repeat_rule', 'interval', 'interval_val > 0')
ck('task_repeat_rule', 'end', "(end_type = 'NONE' AND end_until IS NULL) OR (end_type = 'UNTIL' AND end_until IS NOT NULL)")
new('task_repeat_weekday', [('task_id', 'CHAR(26) NOT NULL'), ('weekday', 'TINYINT NOT NULL')], 'task_id, weekday')
fk('task_repeat_weekday', 'rule', 'task_id', 'task_repeat_rule', 'task_id')
ck('task_repeat_weekday', 'day', 'weekday BETWEEN 1 AND 7')

add('planner_item', 'user_id', 'CHAR(26) NOT NULL')
drop('planner_item', 'category')
add('planner_item', 'cat_id', 'CHAR(26) NULL')
fk('planner_item', 'user', 'user_id', 'users')
fk('planner_item', 'category', 'user_id, cat_id', 'category', 'user_id, id')
remove('planner_item', 'ix_planner_item_date_type')
ix('planner_item', 'user_date_type', 'user_id, date, type')
ck('planner_item', 'time', "(start_time IS NULL AND end_time IS NULL) OR (date IS NOT NULL AND start_time IS NOT NULL AND end_time IS NOT NULL AND start_time >= '00:00:00' AND end_time < '24:00:00' AND end_time > start_time)")

add('dash_layout', 'bp', "VARCHAR(16) NOT NULL DEFAULT 'default'")
fk('user_pref', 'theme', 'theme_id', 'theme_catalog')
for col in ['dnd_s', 'dnd_e']:
    add('user_pref', col, 'TIME NULL')
ck('user_pref', 'dnd', "(dnd_s IS NULL AND dnd_e IS NULL) OR (dnd_s IS NOT NULL AND dnd_e IS NOT NULL AND dnd_s >= '00:00:00' AND dnd_s < '24:00:00' AND dnd_e >= '00:00:00' AND dnd_e < '24:00:00')")
ck('user_pref', 'duration', 'time_step_min > 0 AND def_event_dur_min > 0 AND (def_reminder_min IS NULL OR def_reminder_min >= 0)')

uk('data_file', 'owner_id', 'user_id, id')
ck('data_file', 'size', 'size_b >= 0')
remove('data_job', 'fk_data_job_result')
fk('data_job', 'result', 'user_id, result_file_id', 'data_file', 'user_id, id')
ck('data_job', 'time', '(s_utc IS NULL OR s_utc >= c_at) AND (e_utc IS NULL OR (s_utc IS NOT NULL AND e_utc >= s_utc))')
ix('data_job', 'queue', 'st, c_at, id')
ix('data_file', 'expiry', 'exp_utc')
ix('refresh_token', 'expiry', 'exp_utc')
uk('import_mapping_profile', 'name', 'user_id, src_typ, name')
remove('ext_cal_account', 'uk_ext_cal_account')
add('ext_cal_account', 'external_subject', 'VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL')
uk('ext_cal_account', 'identity', 'user_id, provider, external_subject')
uk('ext_cal_account', 'owner_id', 'user_id, id')
drop('sync_run_log', 'provider')
add('sync_run_log', 'account_id', 'CHAR(26) NOT NULL')
add('sync_run_log', 'ended_utc', 'DATETIME(6) NULL')
fk('sync_run_log', 'account', 'user_id, account_id', 'ext_cal_account', 'user_id, id')
ck('sync_run_log', 'time', 'ended_utc IS NULL OR ended_utc >= started_utc')
ck('sync_run_log', 'counts', 'pulled_cnt >= 0 AND pushed_cnt >= 0 AND conflict_cnt >= 0')
ix('sync_run_log', 'account_time', 'account_id, started_utc')
remove('support_ticket', 'ix_support_ticket_state')
ix('support_ticket', 'state_time', 'st, c_at, id')

for name in ['event_share', 'event_ex', 'event_ver']:
    fk(name, 'actor', 'by_id', 'users')
# Exceptions describe the original occurrence, while tbl_events stores resolved values.
drop('event_ex', 'o_cat_name', 'o_cat_color', 'o_cat_icon')
add('event_ex', 'user_id', 'CHAR(26) NOT NULL')
remove('event_ex', 'fk_event_ex_event')
fk('event_ex', 'event', 'user_id, event_id', 'events', 'user_id, id')
fk('event_ex', 'category', 'user_id, o_cat_id', 'category', 'user_id, id')
remove('event_ex', 'uk_event_ex')
uk('event_ex', 'occurrence', 'event_id')
add('event_ex', 'occ_start', 'DATETIME(6) NOT NULL')
add('event_ex', 'o_start_date', 'DATE NULL')
add('event_ex', 'o_end_date', 'DATE NULL')
ck('event_ex', 'range', '(o_start_utc IS NULL AND o_end_utc IS NULL AND o_start_date IS NULL AND o_end_date IS NULL AND o_all_day IS NULL) OR (o_all_day IS NOT NULL AND o_all_day = 0 AND o_start_utc IS NOT NULL AND o_end_utc IS NOT NULL AND o_end_utc > o_start_utc AND o_start_date IS NULL AND o_end_date IS NULL) OR (o_all_day IS NOT NULL AND o_all_day = 1 AND o_start_date IS NOT NULL AND o_end_date IS NOT NULL AND o_end_date > o_start_date AND o_start_utc IS NULL AND o_end_utc IS NULL)')
ck('event_ver', 'number', 'ver_no > 0')
fk('friend', 'requester', 'req_by', 'users')
ck('friend', 'pair', 'a_id < b_id AND req_by IN (a_id, b_id)')
ix('friend', 'a_state', 'a_id, st')
ix('friend', 'b_state', 'b_id, st')

# Existing enum values are reused where implemented; other sets are design proposals.
enums = {
 'users': {'role': ['USER','ADMIN'], 'st': ['ACTIVE','SUSPENDED','DELETED']},
 'login_throttle': {'key_type': ['EMAIL','IP']},
 'events': {'visibility': ['PRIVATE','FRIENDS','SHARED','PUBLIC']},
 'task': {'st':['TODO','DOING','DONE','CANCELED'], 'pri':['LOW','MEDIUM','HIGH'], 'energy_lvl':['LOW','MEDIUM','HIGH']},
 'routine_log': {'st':['done','missed','skip']},
 'category': {'scope':['ALL','EVENT','TASK','ROUTINE','ACTUAL'], 'st':['ACTIVE','ARCHIVED']},
 'user_pref': {'time_fmt':['12h','24h'], 'week_start':['MON','SUN'], 'def_event_vis':['PRIVATE','FRIENDS','SHARED','PUBLIC']},
 'data_job': {'typ':['IMPORT','EXPORT'], 'fmt':['CSV','JSON','ICS','XLSX'], 'st':['PENDING','RUNNING','SUCCEEDED','FAILED','CANCELED']},
 'ext_cal_account': {'st':['CONNECTED','DISCONNECTED','ERROR']},
 'sync_run_log': {'st':['RUNNING','SUCCEEDED','FAILED','PARTIAL']},
 'event_share': {'role':['viewer','editor']},
 'task_repeat_rule': {'freq':['DAILY','WEEKLY','MONTHLY','YEARLY']},
 'friend': {'st':['pending','accepted','rejected','blocked']},
 'cal_group_mem': {'role':['member','editor','admin']},
 'user_device': {'platform':['WEB','IOS','ANDROID']},
}
for name, columns in enums.items():
    for col, values in columns.items():
        ck(name, col, col + ' IN (' + ', '.join("'" + v + "'" for v in values) + ')')
for name, cols in [('event_policy', ['def_edit_sc','def_del_sc','max_edit_sc','max_del_sc']), ('event_share', ['edit_sc','del_sc'])]:
    for col in cols:
        ck(name, col, col + " IN ('none', 'single', 'future', 'all')")

JSON_COLS = {'json','cfg_json','params_json','map_json','rule_json','meta_json','diff_json','snap','diff'}
for name, table in tables.items():
    for col, spec in list(table['cols'].items()):
        if col in JSON_COLS:
            spec = spec.replace('LONGTEXT', 'JSON')
        if spec.startswith('CHAR(26)'):
            spec = spec.replace('CHAR(26)', 'CHAR(26) CHARACTER SET ascii COLLATE ascii_bin')
        if col in ['device_id','jti','code','storage_key'] and 'CHARACTER SET' not in spec:
            spec = re.sub(r'^(\w+\(\d+\))', r'\1 CHARACTER SET utf8mb4 COLLATE utf8mb4_bin', spec)
        table['cols'][col] = spec
        if spec.startswith('BOOLEAN'):
            ck(name[4:], col + '_bool', f'`{col}` IN (0, 1)')
    for col in ['c_at','created_at']:
        if col in table['cols']:
            table['cols'][col] += ' DEFAULT CURRENT_TIMESTAMP(6)'
    for col in ['u_at','updated_at']:
        if col in table['cols']:
            table['cols'][col] += ' DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)'


def keys(table):
    result = []
    for value in table['constraints']:
        m = re.match(r'(PRIMARY KEY|UNIQUE KEY \w+|KEY \w+) \(([^)]+)\)', value)
        if m:
            result.append((m[1], tuple(c.strip().strip('`') for c in m[2].split(','))))
    return result


def foreign_keys(table):
    for value in table['constraints']:
        m = re.match(r'CONSTRAINT (\w+) FOREIGN KEY \(([^)]+)\) REFERENCES (\w+) \(([^)]+)\)', value)
        if m:
            yield m[1], tuple(x.strip() for x in m[2].split(',')), m[3], tuple(x.strip() for x in m[4].split(','))


# Explicit FK indexes avoid relying on engine-created, unnamed design decisions.
for name, table in tables.items():
    for fname, columns, parent, refs in foreign_keys(table):
        if not any(k[:len(columns)] == columns for _, k in keys(table)):
            ix(name[4:], 'fk_' + fname.removeprefix('fk_' + name[4:] + '_'), ', '.join(columns))
        assert parent in tables, (name, parent)
        assert any(k == refs and not title.startswith('KEY ') for title, k in keys(tables[parent])), (name, parent, refs)
        for col, ref in zip(columns, refs):
            assert col in table['cols'] and ref in tables[parent]['cols']
            assert table['cols'][col].split(' NOT NULL')[0].split(' NULL')[0] == tables[parent]['cols'][ref].split(' NOT NULL')[0].split(' NULL')[0], (name, col, parent, ref)

names = {
'users':('사용자','인증 주체와 계정 상태, 기본 시간대를 관리한다.'),
'refresh_token':('갱신 토큰','갱신 토큰의 해시, 만료와 폐기를 관리한다. 원문 토큰은 저장하지 않는다.'),
'login_throttle':('로그인 시도 제한','미가입 이메일과 IP에도 적용되는 로그인 실패 카운터다. 사용자 FK가 없는 독립 엔티티다.'),
'events':('일정 회차','단일 일정 또는 물리적으로 생성된 반복 일정 한 회차의 현재 값을 저장한다.'),
'task':('할 일','사용자 할 일과 상태, 우선순위, 선택적 일정 연결을 관리한다.'),
'routine':('루틴','특정 지역 시간에 반복하는 개인 루틴의 정의다.'),
'routine_log':('루틴 실행 기록','루틴별 현지 날짜당 한 건의 수행 결과다.'),
'planner_item':('플래너 수동 항목','일정·할 일과 별도로 입력한 수동 계획이다. 다른 원본의 복제 저장소로 사용하지 않는다.'),
'category':('개인 카테고리','사용자별 카테고리 트리다. 시스템 기본 카테고리는 가입 시 사용자 소유로 복제한다.'),
'user_pref':('사용자 환경설정','사용자당 최대 한 행의 기본 환경설정이다.'),
'dash_layout':('대시보드 배치','사용자·범위·화면 크기별 배치를 관리한다.'),
'dash_portlet_pref':('대시보드 위젯 설정','사용자별 위젯 표시 여부와 설정을 저장한다.'),
'notif_pref':('알림 유형 설정','사용자별 알림 이벤트 유형과 전달 채널을 설정한다.'),
'user_device':('사용자 기기','사용자별 기기 등록 및 푸시 전송 대상을 관리한다.'),
'data_file':('데이터 파일','외부 객체 저장소 파일의 메타데이터다. 파일 본문은 DB에 넣지 않는다.'),
'data_job':('가져오기·내보내기 작업','비동기 작업의 상태, 실행 시간과 결과 파일을 관리한다.'),
'import_mapping_profile':('가져오기 매핑 프로필','사용자별 외부 필드 매핑과 변환 규칙이다.'),
'ext_cal_account':('외부 캘린더 계정','동일 공급자의 여러 계정 연결을 허용한다. 인증 비밀은 별도 보안 저장소에 둔다.'),
'sync_run_log':('동기화 실행 기록','특정 외부 계정의 실행 결과와 처리 건수다.'),
'support_ticket':('고객 문의','사용자 문의와 처리 상태를 관리한다.'),
'settings_audit_log':('설정 변경 감사 기록','설정 변경의 행위와 변경 내역을 보존한다.'),
'event_policy':('일정 편집 정책','일정당 최대 한 건의 공유 편집·삭제 정책이다.'),
'event_share':('일정 공유','일정과 공유받은 사용자의 N:M 연결 및 권한이다.'),
'event_ex':('일정 회차 예외','물리화된 한 회차의 원래 발생 시각과 현재 예외를 보존한다. 예외 수정과 일정 현재 값 수정은 같은 트랜잭션이다.'),
'event_ver':('일정 변경 버전','일정별 변경 버전과 당시 JSON 스냅샷을 보존한다.'),
'time_entry':('실제 시간 기록','사용자가 실제 사용한 시간 구간과 원래 계획을 연결한다.'),
'task_member':('할 일 참여자','할 일과 참여 사용자의 N:M 연결이다.'),
'task_repeat_rule':('할 일 반복 규칙','할 일당 최대 한 건의 반복 규칙이다. 행의 존재로 반복 여부를 판단한다.'),
'memo':('메모','텍스트·음성 변환 메모와 분류 상태를 관리한다.'),
'diary':('다이어리','사용자 현지 날짜당 한 건의 다이어리를 관리한다.'),
'friend':('친구 관계','정렬된 사용자 쌍당 한 건의 무방향 친구 관계와 요청자를 관리한다.'),
'cal_group':('캘린더 그룹','공유 그룹과 단일 소유자를 관리한다. 소유자는 멤버 행 없이 소유자 권한을 갖는다.'),
'cal_group_mem':('캘린더 그룹 멤버','그룹과 참여 사용자의 N:M 연결이다.'),
'theme_catalog':('테마 카탈로그','환경설정에서 선택 가능한 테마 목록이다.'),
'sticker_pack':('스티커 팩','배포 가능한 스티커 묶음이다.'),
'sticker_item':('스티커 항목','팩에 속한 개별 스티커 자산이다.'),
'user_sticker_pack':('사용자 스티커 팩','사용자와 팩의 N:M 설치·고정 상태다.'),
'event_series':('반복 일정 시리즈','첫 회차 삭제와 독립적인 반복 묶음의 식별자와 생성 규칙이다. 신규 제안 엔티티다.'),
'routine_weekday':('루틴 반복 요일','CSV 요일을 정규화한 신규 엔티티다. ISO 요일 1~7을 사용한다.'),
'task_repeat_weekday':('할 일 반복 요일','주간 반복 규칙의 요일을 정규화한 신규 엔티티다.'),
}

descriptions = {
'id':'행 식별자. CHAR(26)은 애플리케이션에서 생성하는 대문자 ULID', 'user_id':'소유 사용자 식별자',
'email':'로그인 이메일. 애플리케이션에서 trim 및 소문자 정규화', 'pw_hash':'단방향 비밀번호 해시(솔트와 알고리즘 정보 포함)',
'nick':'표시 이름', 'role':'역할 코드', 'st':'상태 코드', 'tz':'IANA 시간대 식별자. 서비스에서 유효성 검증',
'email_vfy':'이메일 인증 여부', 'last_login_utc':'최근 로그인 UTC 시각', 'pw_chg_utc':'비밀번호 변경 UTC 시각',
'c_at':'생성 UTC 시각', 'u_at':'최종 수정 UTC 시각', 'd_at':'논리 삭제 UTC 시각. NULL이면 미삭제', 'is_enabled':'로그인 허용 플래그. 상태와 함께 검사',
'device_id':'클라이언트 기기 식별자', 'tok_hash':'갱신 토큰 SHA-256 해시의 64자리 소문자 hex', 'jti':'토큰 고유 식별자. 미사용 시 NULL',
'exp_utc':'만료 UTC 시각', 'rev_utc':'토큰 폐기 UTC 시각', 'last_used_utc':'최근 사용 UTC 시각',
'key_type':'제한 키 유형(이메일 또는 IP)', 'key_val':'정규화된 이메일 또는 IP', 'fail_cnt':'실패 횟수', 'lock_utc':'잠금 해제 UTC 시각', 'last_fail_utc':'마지막 실패 UTC 시각',
'title':'제목', 'date':'사용자 시간대 기준 계획 날짜', 'start_time':'같은 날의 시작 시각', 'end_time':'같은 날의 종료 시각',
'location':'장소', 'visibility':'공개 범위', 'note':'상세 설명', 'series_id':'반복 시리즈 ID. 단발 일정은 NULL',
'created_at':'생성 UTC 시각', 'updated_at':'최종 수정 UTC 시각', 'pri':'우선순위', 'energy_lvl':'필요 에너지 수준',
'duration_min':'예상 소요 분', 'due':'사용자 현지 마감 날짜', 'cat_id':'동일 소유자의 카테고리 ID', 'event_id':'연결 일정 ID',
'name':'이름', 'icon':'아이콘 식별자', 'at_time':'루틴 시간대 기준 실행 시각', 'onoff':'루틴 활성 여부', 'notify':'사전 알림 여부', 'n_min':'사전 알림 분. NULL이면 기본 정책',
'routine_id':'루틴 ID', 'dt':'시간대 기준 날짜', 'type':'수동 계획 유형 코드', 'status':'수동 계획 상태 코드', 'dday':'D-Day 표시 여부',
'parent_id':'동일 소유자의 상위 카테고리 ID', 'color':'#RRGGBB 형식 색상. 서비스 형식 검증', 'ord':'표시 순서', 'scope':'적용 범위 코드',
'is_pinned':'고정 여부', 'd_by':'삭제 실행 사용자 ID', 'start_scr':'시작 화면 코드', 'date_fmt':'날짜 표시 형식', 'time_fmt':'시간 표시 형식',
'theme_id':'테마 카탈로그 ID', 'push_on':'푸시 알림 허용', 'email_on':'이메일 알림 허용', 'inapp_on':'앱 내 알림 허용',
'dnd_s':'방해 금지 시작 현지 시각', 'dnd_e':'방해 금지 종료 현지 시각. 자정 통과 허용', 'week_start':'주 시작 요일', 'locale':'언어·지역 코드',
'time_step_min':'시간 눈금 간격(분)', 'def_event_vis':'기본 일정 공개 범위', 'def_event_all_day':'기본 종일 일정 여부',
'def_event_dur_min':'기본 일정 소요 분', 'def_reminder_min':'기본 알림 선행 분', 'overlap_warn_on':'일정 겹침 안내 여부',
'bp':'화면 크기 코드. 기본 배치는 default', 'json':'배치 JSON. schemaVersion 포함', 'portlet_id':'위젯 유형 식별자', 'vis':'표시 여부', 'cfg_json':'추가 설정 JSON',
'evt':'알림 이벤트 유형 코드', 'platform':'기기 플랫폼', 'push_tok':'푸시 전송 토큰. 접근 권한 제한', 'app_ver':'앱 버전',
'last_seen_utc':'최근 접속 UTC 시각', 'revoked_utc':'기기 등록 해제 UTC 시각', 'kind':'파일 용도 코드', 'filename':'원본 파일명',
'mime':'MIME 유형', 'size_b':'파일 크기(바이트)', 'sha256':'내용 SHA-256 hex 체크섬', 'storage_key':'객체 저장소 키. 공개 URL이나 인증 정보가 아님',
'typ':'업무 유형 코드', 'fmt':'파일 포맷', 'params_json':'작업 입력 옵션 JSON', 'result_file_id':'동일 사용자의 결과 파일 ID',
'err_msg':'오류 요약. 인증 비밀과 개인정보는 제거', 's_utc':'작업 시작 UTC 시각', 'e_utc':'작업 종료 UTC 시각',
'src_typ':'원본 데이터 유형 코드', 'map_json':'필드 매핑 JSON', 'rule_json':'변환 규칙 JSON', 'provider':'외부 공급자 코드',
'scopes':'외부 서비스가 허용한 권한 목록. 검색용 관계 데이터로 사용하지 않음', 'meta_json':'확장 메타데이터 JSON',
'started_utc':'동기화 시작 UTC 시각', 'ended_utc':'동기화 종료 UTC 시각. 실행 중 NULL',
'pulled_cnt':'수신 건수', 'pushed_cnt':'송신 건수', 'conflict_cnt':'충돌 건수', 'body':'본문', 'area':'설정 영역 코드', 'action':'수행 행위 코드',
'diff_json':'변경 필드와 이전·이후 값 JSON. 비밀값 제외', 'at_utc':'행위 발생 UTC 시각', 'editor_del':'편집자의 삭제 허용 여부',
'def_edit_sc':'기본 편집 범위', 'def_del_sc':'기본 삭제 범위', 'max_edit_sc':'최대 편집 범위', 'max_del_sc':'최대 삭제 범위',
'edit_sc':'허용 편집 범위', 'del_sc':'허용 삭제 범위', 'by_id':'행위자 사용자 ID', 'at':'등록·행위 UTC 시각',
'occ_start':'예외 적용 전 원래 회차 시작 UTC 시각. 종일은 원래 시간대 자정을 UTC로 변환', 'cancel':'해당 회차 취소 여부',
'o_title':'변경 제목. NULL이면 변경 없음', 'o_note':'변경 설명. NULL이면 변경 없음', 'o_loc':'변경 장소. NULL이면 변경 없음',
'o_start_utc':'변경 시작 UTC 시각', 'o_end_utc':'변경 종료 UTC 시각(미포함)', 'o_all_day':'변경 종일 여부. 시간 변경 시 필수',
'o_tz':'변경 시간대', 'o_cat_id':'변경 카테고리 ID. NULL이면 변경 없음', 'ver_no':'일정별 증가하는 버전 번호',
'summary':'변경 요약', 'snap':'변경 당시 전체 일정 스냅샷 JSON', 'diff':'변경점 JSON',
'start_utc':'시작 UTC 시각', 'end_utc':'종료 UTC 시각(미포함)', 'memo':'기록 메모', 'task_id':'할 일 ID', 'joined_at':'참여 UTC 시각',
'freq':'반복 주기', 'interval_val':'반복 간격. 1이면 매 주기', 'end_type':'종료 유형 NONE 또는 UNTIL', 'end_until':'마지막 발생을 허용하는 현지 날짜(포함)',
'stt':'음성 인식 텍스트', 'tags':'기존 태그 표시 문자열. 정식 태그 검색 관계가 아님', 'mood':'기분 코드', 'sumry':'하루 요약', 'grat':'감사 기록',
'a_id':'사전순으로 작은 사용자 ULID', 'b_id':'사전순으로 큰 사용자 ULID', 'req_by':'친구 요청자. 반드시 a_id 또는 b_id',
'owner_id':'그룹 소유 사용자 ID', 'gid':'캘린더 그룹 ID', 'enabled':'카탈로그 활성 여부', 'code':'고유 업무 코드',
'pack_id':'스티커 팩 ID', 'label':'스티커 표시 이름', 'asset_url':'스티커 자산 URL', 'installed':'설치 여부', 'pinned':'고정 여부',
'all_day':'종일 일정 여부', 'start_date':'종일 일정의 현지 시작 날짜', 'end_date':'종일 일정의 현지 종료 날짜(미포함)',
'row_version':'낙관적 동시성 제어 버전. 수정 SQL에서 비교 및 증가', 'rrule':'반복 회차 생성 규칙 문자열. 파싱·횟수 제한은 서비스 책임',
'weekday':'ISO 요일: 월=1, 일=7', 'external_subject':'공급자가 발급한 안정적인 외부 계정 식별자', 'account_id':'동일 사용자의 외부 캘린더 계정 ID',
'o_start_date':'변경 종일 시작 날짜', 'o_end_date':'변경 종일 종료 날짜(미포함)',
}
special_desc = {
 ('event_share','user_id'):'공유를 받은 사용자 ID. 일정 소유자와 달라도 정상',
 ('task_member','user_id'):'참여 사용자 ID. 할 일 소유자와 달라도 정상',
 ('cal_group_mem','user_id'):'그룹 참여 사용자 ID',
 ('event_ex','user_id'):'일정 소유자 ID. 행위자는 by_id로 구분',
 ('settings_audit_log','user_id'):'설정 변경 대상 사용자 ID. 현재 모델은 본인 변경만 기록',
 ('theme_catalog','id'):'테마 코드. 기본 테마는 default',
}

# Parent-first creation. Self-reference is legal at CREATE TABLE time.
ordered = []
while len(ordered) < len(tables):
    ready = [name for name, table in tables.items() if name not in ordered and all(parent == name or parent in ordered for _, _, parent, _ in foreign_keys(table))]
    assert ready, 'Unexpected dependency cycle'
    ordered.extend(ready)

sql = ["-- Timeflow target design, MySQL 8.4 / InnoDB; empty schema only.",
       "-- Review artifact, NOT a Flyway migration. No DROP/REPLACE or FK disabling.",
       "-- Select a newly created empty database before sourcing this file.",
       "SET NAMES utf8mb4;", "SET SESSION time_zone = '+00:00';", "SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';", '']
for name in ordered:
    table = tables[name]
    rows = [f'  `{col}` {spec}' for col, spec in table['cols'].items()]
    rows += ['  ' + value for value in table['constraints']]
    sql += [f'-- {names[name[4:]][0]}', f'CREATE TABLE `{name}` (', ',\n'.join(rows),
            f") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='{names[name[4:]][0]}';", '']
sql += ["-- Required reference data for tbl_user_pref.theme_id DEFAULT 'default'.",
        "INSERT INTO tbl_theme_catalog (id, name) VALUES ('default', '기본 테마');", '']
ddl = '\n'.join(sql)
(OUT / 'timeflow-mysql84-schema.sql').write_text(ddl, encoding='utf-8')

header = (OUT / 'design-overview.inc.md').read_text(encoding='utf-8')
doc = [header, '\n## 2. 테이블 정의서\n',
       'NULL 열의 Y는 NULL 허용, N은 NOT NULL이다. PK/FK는 복합 키의 구성원도 표시한다. `—`는 명시 제약 없음이며, NOT NULL·기본값 없음 컬럼은 INSERT 시 필수다. 모든 시간 정밀도는 6자리다. CHAR(26)은 모두 `ascii_bin`이며, 기타 별도 정렬 규칙은 해당 표와 DDL에 표시한다. 각 표 아래 UK·CHECK는 복합 조건까지 포함한 실제 DDL과 일치한다.\n']
for number, name in enumerate(tables, 1):
    table = tables[name]
    short = name[4:]
    label, meaning = names[short]
    doc += [f'### 2.{number}. `{name}` / {label}\n', meaning + '\n',
            '| 컬럼명 | 데이터 타입 | NULL | Key | 기본값·추가 속성 | 설명 |', '|---|---|:---:|---|---|---|']
    keyset = keys(table)
    fks = list(foreign_keys(table))
    for col, spec in table['cols'].items():
        datatype = re.match(r'^\w+(?:\(\d+\))?', spec)[0]
        key_labels = []
        if any(title == 'PRIMARY KEY' and col in cols for title, cols in keyset):
            key_labels.append('PK')
        if any(col in cols for _, cols, _, _ in fks):
            key_labels.append('FK')
        if any(title.startswith('UNIQUE') and col in cols for title, cols in keyset):
            key_labels.append('UK')
        extra = spec[len(datatype):].replace('NOT NULL', '').replace(' NULL', '').strip()
        desc = special_desc.get((short, col), descriptions.get(col))
        assert desc is not None, (name, col)
        if col == 'id' and datatype == 'BIGINT':
            desc = '자동 증가 행 식별자. 기존 BIGINT API 식별자 유지'
        doc.append(f"| `{col}` | `{datatype}` | {'N' if 'NOT NULL' in spec else 'Y'} | {', '.join(key_labels) or '—'} | {('`' + extra + '`') if extra else '—'} | {desc} |")
    doc.append('')
    for value in table['constraints']:
        if value.startswith('UNIQUE') or ' CHECK ' in value:
            doc.append(f'- `{value}`')
    doc.append('')

doc += ['## 3. 관계(Relationship) 정의\n',
 '아래는 모든 FK의 완전한 매핑이다. 부모 한 행의 자식 개수는 기본 0..N이고, 자식 FK가 PK 또는 UK이면 0..1이다. 자식의 부모 참여는 FK 구성 컬럼 중 NULL이 허용되면 선택(0..1), 모두 NOT NULL이면 필수(1)다. 모든 FK는 `ON DELETE RESTRICT ON UPDATE RESTRICT`를 사용한다.\n',
 '| 자식 테이블 | FK명·컬럼 | 부모 테이블·컬럼 | 부모→자식 | 자식→부모 |', '|---|---|---|---|---|']
for name, table in tables.items():
    for fname, cols, parent, refs in foreign_keys(table):
        unique = any(not title.startswith('KEY ') and set(k).issubset(cols) for title, k in keys(table))
        optional = any('NOT NULL' not in table['cols'][col] for col in cols)
        doc.append(f"| `{name}` | `{fname}` ({', '.join(cols)}) | `{parent}` ({', '.join(refs)}) | {'1:0..1' if unique else '1:0..N'} | {'0..1' if optional else '1'} |")
doc += ['\n### N:M 및 집합 관계\n',
 '| 양쪽 엔티티 | 연결 테이블 | 중복 방지 |', '|---|---|---|',
 '| 일정 ↔ 사용자 | `tbl_event_share` | UNIQUE(event_id, user_id) |',
 '| 할 일 ↔ 사용자 | `tbl_task_member` | UNIQUE(task_id, user_id) |',
 '| 그룹 ↔ 사용자 | `tbl_cal_group_mem` | UNIQUE(gid, user_id) |',
 '| 스티커 팩 ↔ 사용자 | `tbl_user_sticker_pack` | UNIQUE(user_id, pack_id) |',
 '| 사용자 ↔ 사용자 | `tbl_friend` | UNIQUE(a_id, b_id), CHECK(a_id < b_id) |',
 '\n사용자 환경설정·일정 정책·할 일 반복 규칙은 부모 PK를 자식 PK로 재사용한다. DB는 “최대 한 건”을 보장하며, 필수 초기 행 생성은 가입·일정 생성 트랜잭션에서 처리한다. 일정 회차 예외는 UNIQUE(event_id)로 최대 한 건이다. 원본 관계도에서 모두 1:N으로 표시한 부분을 실제 키 제약에 맞춰 보정했다.\n',
 '## 4. 인덱스(Index) 전략\n',
 'PK·UK는 식별 및 중복 방지와 조회에 재사용한다. FK 선두 컬럼 인덱스는 모두 명시했다. `(user_id, id)` UK는 일반 PK와 달리 “동일 소유자” FK의 후보 키이므로 유지한다. 저선택도 상태 플래그 단독 인덱스 대신 사용자·상태·날짜를 조합한다. 아래 목록은 DDL의 모든 비-PK 인덱스다.\n',
 '| 테이블 | 인덱스 | 컬럼 순서 | 목적 |', '|---|---|---|---|']
reasons = {
'ix_users_status':'관리자 계정 목록의 상태·삭제 여부 필터',
'ix_refresh_token_user':'사용자별 미폐기 토큰의 만료 조회와 세션 일괄 폐기',
'ix_login_throttle_lock':'잠금 해제 시각이 지난 로그인 제한 행 정리',
'ix_routine_log_date':'날짜별 루틴 결과 집계·보존 기간 정리',
'ix_category_parent':'사용자의 특정 부모 아래 카테고리 목록·트리 전개',
'ix_category_state':'사용자별 활성·보관 카테고리 목록',
'ix_data_file_user_kind':'사용자별 가져오기·내보내기 파일 목록',
'ix_data_job_user_state':'사용자별 진행 중·완료 작업 목록',
'ix_import_mapping_user':'사용자와 원본 유형으로 매핑 프로필 탐색. 추가된 이름 UK와 선두 중복하므로 실측 후 제거 가능',
'ix_sync_run_user_time':'사용자별 최근 동기화 이력 정렬과 기간 조회',
'ix_sync_run_log_account_time':'외부 계정별 최근 실행 내역',
'ix_settings_audit_user_time':'사용자별 설정 변경의 기간별 감사 조회',
'ix_event_share_user':'공유받은 사용자의 일정 목록 조인',
'ix_task_member_user':'참여 사용자 기준 할 일 목록 조인',
'ix_memo_user_state':'사용자별 수신함·분류 상태 메모 목록',
'ix_cal_group_member_user':'사용자가 참여한 그룹 목록 조인',
'ix_events_user_time':'사용자별 미삭제 시간 일정의 기간 조회 및 커서 페이지',
'ix_events_user_day':'사용자별 미삭제 종일 일정의 날짜 구간 조회',
'ix_events_series_time':'반복 시리즈의 특정 시각 이후 회차 조회',
'ix_events_series_day':'반복 시리즈의 특정 날짜 이후 종일 회차 조회',
'ix_task_user_due':'사용자별 마감순 할 일 조회', 'ix_task_user_status':'사용자별 상태·논리 삭제 여부 필터',
'ix_routine_user_time':'사용자별 활성 루틴과 실행 시각 정렬',
'ix_time_entry_user_time':'사용자별 실제 기록 구간 조회. end_utc는 범위 잔여 필터',
'ix_time_entry_kind':'사용자별 기록 유형의 기간 통계',
'ix_planner_item_user_date_type':'사용자별 날짜·항목 유형 조회',
'ix_data_job_queue':'대기 작업을 상태·생성순으로 획득',
'ix_sync_run_account_time':'외부 계정별 최근 실행 내역',
'ix_support_ticket_state_time':'문의 처리 대기열의 상태·생성순 조회',
'ix_friend_a_state':'친구 쌍의 첫 위치에서 상태별 조회', 'ix_friend_b_state':'친구 쌍의 두 번째 위치에서 상태별 조회',
}
for name, table in tables.items():
    for title, cols in keys(table):
        if title == 'PRIMARY KEY':
            continue
        idx = title.split()[-1]
        reason = reasons.get(idx)
        if not reason:
            if title.startswith('UNIQUE'):
                reason = '업무 키 중복 방지·동등 조건 조회' if cols != ('user_id','id') else '동일 소유자 복합 FK가 참조할 후보 키'
            elif '_fk_' in idx:
                reason = 'FK 참조 검사·부모 삭제 시 자식 탐색·조인 지원'
            elif 'expiry' in idx:
                reason = '만료 데이터 배치 정리 대상 검색'
            else:
                reason = '선두 컬럼 필터와 후속 컬럼 정렬·범위 조회 지원'
        doc.append(f"| `{name}` | `{idx}` | `{', '.join(cols)}` | {reason} |")

doc.append((OUT / 'design-operations.inc.md').read_text(encoding='utf-8'))
doc += ['\n## 5. DDL (Data Definition Language) 쿼리\n',
 '다음은 [별도 SQL 파일](timeflow-mysql84-schema.sql)과 동일한 전체 스크립트다. 선택한 빈 DB에 부모 테이블부터 생성하고, 필수 기본 테마 한 행을 입력한다. 기존 DB용 증분 마이그레이션은 아니다.\n', '```sql', ddl.rstrip(), '```\n']
(OUT / 'timeflow-database-design.md').write_text('\n'.join(doc), encoding='utf-8')
print(f"Generated {len(tables)} tables, {sum(len(t['cols']) for t in tables.values())} columns, {sum(len(list(foreign_keys(t))) for t in tables.values())} FKs")
