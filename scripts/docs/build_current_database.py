# 격리 개발 DB의 메타데이터로 현재 ERD와 전체 테이블 정의서를 생성하고 소스 변경을 검사한다.
from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
from collections import defaultdict
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SNAPSHOT = ROOT / 'docs/database/current-schema.json'
DOCUMENT = ROOT / 'docs/database/current-database.md'
PURPOSES = {
    'users': '통합 사용자 계정과 인증 무효화 버전',
    'refresh_token': '해시된 갱신 토큰과 폐기·만료 이력',
    'login_throttle': '로그인 시도 제한과 잠금 상태',
    'events': '구형 일정과 물리화한 반복 회차',
    'task': '구형 할 일과 분류 스냅샷',
    'routine': '구형 루틴 정의', 'routine_log': '루틴의 날짜별 수행 상태',
    'planner_item': '사용자 소유의 구형 수동 플래너 항목',
    'task_assignee': '할 일별 담당자 후보',
    'task_checklist_item': '할 일 체크리스트와 담당자·낙관적 버전',
    'planner_preference': '사용자별 기본 플래너 보기',
    'feature_record': '허용된 종류별 개인·공용 기능 JSON 기록',
    'feature_member': '공유 그룹·커뮤니티 참여자와 권한·상태',
    'feature_friend': '친구 요청과 정규화한 사용자 쌍',
    'feature_block': '사용자별 차단 관계',
    'feature_file': '첨부 파일의 실제 바이트·소유권·보관 기한',
    'chat_user': '통합 계정과 연결되는 채팅 사용자 표시 정보',
    'chat_room': 'DM·그룹 대화방과 방별 순번',
    'chat_member': '대화방 참여·탈퇴와 읽음 위치',
    'chat_message': '영속 메시지와 재전송 중복 방지',
    'chat_outbox': '커밋 후 실시간 이벤트 재전파 작업',
    'chat_mention': '메시지의 사용자 멘션과 읽음 상태',
    'chat_tag': '채팅 해시태그 사전',
    'chat_message_tag': '메시지와 태그의 연결',
    'chat_search_document': '메시지 검색용 정규화 문서',
    'chat_search_gram': '부분 검색용 검색 조각 색인',
    'flyway_schema_history': 'Core·workspace 마이그레이션 이력',
    'flyway_chat_history': '채팅 전용 마이그레이션 이력',
}
MEANINGS = {
    'id': '행 식별자', 'user_id': '사용자 식별자', 'owner_id': '소유자 식별자',
    'email': '로그인 이메일', 'pw_hash': '비밀번호 해시', 'nick': '닉네임',
    'role': '권한 또는 참여 역할', 'st': '도메인 상태', 'status': '처리·참여 상태',
    'tz': '사용자 시간대', 'email_vfy': '이메일 확인 상태', 'is_enabled': '계정 사용 여부',
    'auth_version': '계정 전체 인증 무효화 버전', 'last_login_utc': '마지막 로그인 UTC 시각',
    'pw_chg_utc': '비밀번호 변경 UTC 시각', 'c_at': '생성 UTC 시각',
    'u_at': '수정 UTC 시각', 'd_at': '소프트 삭제 UTC 시각',
    'created_at': '생성 시각. 실제 저장 타입·API 시간대 규칙 확인',
    'updated_at': '수정 시각. 실제 저장 타입·API 시간대 규칙 확인',
    'device_id': '기기 식별자', 'tok_hash': '갱신 토큰 해시', 'jti': '토큰 고유 식별자',
    'exp_utc': '만료 UTC 시각', 'rev_utc': '폐기 UTC 시각', 'last_used_utc': '마지막 사용 UTC 시각',
    'key_type': '로그인 제한 키의 종류', 'key_val': '로그인 제한 키 값',
    'fail_cnt': '실패 횟수', 'lock_utc': '잠금 종료 UTC 시각', 'last_fail_utc': '마지막 실패 UTC 시각',
    'title': '제목', 'body': '본문', 'note': '비고·설명', 'name': '표시 이름',
    'category': '분류 표시값', 'date': '업무 기준 날짜', 'dt': '수행 날짜',
    'start_time': '현지 시작 시각', 'end_time': '현지 종료 시각', 'location': '장소',
    'visibility': '공개 범위', 'series_id': '구형 반복 시리즈 식별자',
    'pri': '할 일 우선순위', 'energy_lvl': '필요 에너지 수준', 'duration_min': '예상 소요 분',
    'due': '마감 날짜', 'cat_id': '분류 식별자', 'cat_name': '분류 이름 스냅샷',
    'cat_color': '분류 색상 스냅샷', 'cat_icon': '분류 아이콘 스냅샷',
    'event_id': '연결 일정 식별자. 구형 타입 불일치 주의', 'is_repeat': '반복 여부',
    'icon': '아이콘 표시값', 'at_time': '루틴 시각 문자열', 'days': '수행 요일 문자열',
    'onoff': '활성 여부', 'notify': '알림 설정 여부. 실제 외부 발송과 구분',
    'n_min': '알림 선행 분', 'routine_id': '루틴 식별자', 'type': '항목 종류',
    'dday': 'D-Day 표시 여부', 'task_id': '할 일 식별자', 'completed': '완료 여부',
    'assignee_id': '해당 할 일의 담당자 후보 식별자', 'version': '수정 충돌 검사 버전',
    'default_view': '기본 플래너 보기', 'kind': '기능 기록 또는 방 종류',
    'record_id': '기능 종류 안의 기록 식별자', 'payload': 'FeatureType 허용 필드를 검증한 JSON 본문',
    'space_type': '그룹·커뮤니티 구분', 'space_id': '참여 공간 식별자',
    'message': '참여 요청 메시지', 'pair_key': '중복 친구 쌍 방지 키',
    'sender_id': '보낸 사용자 식별자', 'recipient_id': '받는 사용자 식별자',
    'target_id': '차단 대상 사용자 식별자', 'group_id': '공유 그룹 식별자',
    'size_bytes': '파일 바이트 크기', 'content': '첨부 파일 바이트', 'expires_at': '보관 만료 시각',
    'nickname': '채팅 표시 닉네임', 'direct_key': 'DM 사용자 쌍의 중복 방지 키',
    'last_sequence': '방의 마지막 메시지 순번', 'room_id': '대화방 식별자',
    'last_read_sequence': '사용자가 읽은 마지막 방 순번', 'joined_at': '입장 시각',
    'left_at': '탈퇴 시각', 'sequence_no': '방 안의 메시지 순번',
    'client_message_id': '클라이언트 재전송 멱등 식별자', 'event_type': '전파 이벤트 종류',
    'attempts': '전파 시도 횟수', 'available_at': '다음 실행 가능 시각',
    'published_at': '전파 완료 시각', 'message_id': '메시지 식별자',
    'read_at': '멘션 읽음 시각', 'tag_id': '태그 식별자', 'tag': '정규화한 태그',
    'normalized_body': '검색용 정규화 본문', 'gram': '부분 검색용 조각',
    'installed_rank': 'Flyway 적용 순번', 'description': '마이그레이션 설명',
    'script': '마이그레이션 스크립트 이름', 'checksum': 'Flyway 체크섬',
    'installed_by': '적용 DB 계정', 'installed_on': '적용 시각',
    'execution_time': '적용 소요 밀리초', 'success': '적용 성공 여부',
}


def fingerprints():
    files = list((ROOT / 'backend/src/main/resources/db').rglob('*.sql'))
    files += list((ROOT / 'backend/src/main/java/db').rglob('*.java'))
    files += list((ROOT / 'backend/src/main/java/kr/timebar/diary/config').glob('*Migration*.java'))
    files += [ROOT / 'backend/src/main/java/kr/timebar/diary/config/CoreSchemaInspector.java']
    return {str(p.relative_to(ROOT)).replace('\\', '/'): hashlib.sha256(p.read_text(encoding='utf-8').encode('utf-8')).hexdigest()
            for p in sorted(files)}


def capture(container, as_of):
    if not re.fullmatch(r'timeflow-(?:manual-\d{8}|chat)-mysql-1', container):
        raise SystemExit('문서 캡처는 이름이 확인된 격리 MySQL 컨테이너만 허용합니다.')
    queries = [
        "SELECT JSON_OBJECT('section','server','schema',DATABASE(),'mysqlVersion',VERSION());",
        "SELECT JSON_OBJECT('section','table','name',TABLE_NAME,'engine',ENGINE,'collation',TABLE_COLLATION) FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME;",
        "SELECT JSON_OBJECT('section','column','table',TABLE_NAME,'name',COLUMN_NAME,'ordinal',ORDINAL_POSITION,'type',COLUMN_TYPE,'nullable',IS_NULLABLE,'default',COLUMN_DEFAULT,'extra',EXTRA,'key',COLUMN_KEY,'comment',COLUMN_COMMENT) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() ORDER BY TABLE_NAME,ORDINAL_POSITION;",
        "SELECT JSON_OBJECT('section','index','table',TABLE_NAME,'name',INDEX_NAME,'nonUnique',NON_UNIQUE,'position',SEQ_IN_INDEX,'column',COLUMN_NAME) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() ORDER BY TABLE_NAME,INDEX_NAME,SEQ_IN_INDEX;",
        "SELECT JSON_OBJECT('section','fk','table',k.TABLE_NAME,'name',k.CONSTRAINT_NAME,'column',k.COLUMN_NAME,'position',k.ORDINAL_POSITION,'parent',k.REFERENCED_TABLE_NAME,'parentColumn',k.REFERENCED_COLUMN_NAME,'deleteRule',r.DELETE_RULE,'updateRule',r.UPDATE_RULE) FROM information_schema.KEY_COLUMN_USAGE k JOIN information_schema.REFERENTIAL_CONSTRAINTS r ON k.CONSTRAINT_SCHEMA=r.CONSTRAINT_SCHEMA AND k.CONSTRAINT_NAME=r.CONSTRAINT_NAME AND k.TABLE_NAME=r.TABLE_NAME WHERE k.TABLE_SCHEMA=DATABASE() AND k.REFERENCED_TABLE_NAME IS NOT NULL ORDER BY k.TABLE_NAME,k.CONSTRAINT_NAME,k.ORDINAL_POSITION;",
        "SELECT JSON_OBJECT('section','check','table',t.TABLE_NAME,'name',t.CONSTRAINT_NAME,'expression',c.CHECK_CLAUSE) FROM information_schema.TABLE_CONSTRAINTS t JOIN information_schema.CHECK_CONSTRAINTS c ON t.CONSTRAINT_SCHEMA=c.CONSTRAINT_SCHEMA AND t.CONSTRAINT_NAME=c.CONSTRAINT_NAME WHERE t.TABLE_SCHEMA=DATABASE() AND t.CONSTRAINT_TYPE='CHECK' ORDER BY t.TABLE_NAME,t.CONSTRAINT_NAME;",
        "SELECT JSON_OBJECT('section','migration','history','core','version',version,'description',description,'success',success) FROM flyway_schema_history ORDER BY installed_rank;",
        "SELECT JSON_OBJECT('section','migration','history','chat','version',version,'description',description,'success',success) FROM flyway_chat_history ORDER BY installed_rank;",
    ]
    command = ['docker', 'exec', '-i', container, 'sh', '-c',
               'MYSQL_PWD="$MYSQL_PASSWORD" exec mysql -u "$MYSQL_USER" -D "$MYSQL_DATABASE" --batch --raw --skip-column-names --default-character-set=utf8mb4']
    run = subprocess.run(command, input='\n'.join(queries), text=True, encoding='utf-8', capture_output=True, check=True)
    rows = [json.loads(line) for line in run.stdout.splitlines() if line.strip()]
    if rows[0]['schema'] != 'timeflow_chat_dev':
        raise SystemExit('격리 개발 스키마가 아니므로 문서에 저장하지 않습니다.')
    return {'capturedOn': as_of, 'sourceHashNormalization': 'UTF8_LF',
            'scope': '격리 개발 DB 메타데이터만 조회. 사용자 데이터 미조회.',
            'sourceHashes': fingerprints(), 'rows': rows}


def cell(value):
    return str(value if value is not None else 'NULL').replace('|', '\\|').replace('\n', ' ')


def render(data):
    sections = defaultdict(list)
    for row in data['rows']:
        sections[row['section']].append(row)
    tables = sections['table']
    foreign_keys = {(r['table'], r['name']) for r in sections['fk']}
    date = data['capturedOn']
    lines = ['# 현재 데이터베이스 ERD와 테이블 정의서', '',
             f'작성일 {date}. 수정일 {date}. 상태는 현재 격리 개발 설치의 물리 스키마입니다.', '',
             f"MySQL {sections['server'][0]['mysqlVersion']}의 `timeflow_chat_dev`에서 메타데이터만 읽었습니다. 사용자 데이터와 비밀값은 포함하지 않습니다. 총 {len(tables)}개 테이블 중 Flyway 이력 2개를 제외한 애플리케이션 테이블은 {len(tables)-2}개이며, 컬럼 {len(sections['column'])}개와 물리 FK {len(foreign_keys)}개를 확인했습니다.", '',
             '운영 DB가 동일하다는 보장은 아닙니다. 기존 DB는 실제 Flyway 이력과 별도 비교합니다. 과거 V1의 37개 `tbl_*`와 40개 목표 설계는 이 문서의 현재 설치와 다릅니다. 현재 앱은 신규 기록 다수를 `feature_record`의 종류별 JSON으로 저장합니다.', '',
             '## 목차', '', '- [물리 ERD](#물리-erd)', '- [논리 관계와 JSON 기록](#논리-관계와-json-기록)',
             '- [테이블 목록](#테이블-목록)', '- [테이블 정의](#테이블-정의)', '- [마이그레이션과 재생성](#마이그레이션과-재생성)', '',
             '## 물리 ERD', '', '선은 실제 FK입니다. FK가 없는 사용자 참조는 서비스 권한 검사에 의존하며 아래 논리 관계와 구분합니다.', '', '```mermaid', 'erDiagram']
    for table in tables:
        if not table['name'].startswith('flyway_'):
            name = table['name']
            lines.append('    ' + name + ' {')
            for col in sections['column']:
                if col['table'] == name and col['key'] == 'PRI':
                    lines.append(f"        {col['type'].split('(')[0].split()[0]} {col['name']} PK")
            lines.append('    }')
    for table, name in sorted(foreign_keys):
        parts = [r for r in sections['fk'] if r['table'] == table and r['name'] == name]
        columns = {r['column'] for r in parts}
        optional = any(c['nullable'] == 'YES' for c in sections['column']
                       if c['table'] == table and c['name'] in columns)
        unique_groups = defaultdict(set)
        for idx in sections['index']:
            if idx['table'] == table and not idx['nonUnique']:
                unique_groups[idx['name']].add(idx['column'])
        one_child = any(group <= columns for group in unique_groups.values())
        parent_end = 'o|' if optional else '||'
        child_end = 'o|' if one_child else 'o{'
        lines.append(f"    {parts[0]['parent']} {parent_end}--{child_end} {table} : {name}")
    lines += ['```', '', '## 논리 관계와 JSON 기록', '',
              '- `feature_record`의 PK는 `(owner_id, kind, record_id)`이며 `version`으로 충돌을 검사합니다. `payload`는 LONGTEXT이지만 서비스에서 JSON·종류·허용 필드·크기를 검증합니다. DB JSON 타입이나 FK가 자동으로 내용의 무결성을 보장하는 구조가 아닙니다.',
              '- 신규 일정·다이어리·메모·업무·WBS·위키·경력·커뮤니티 등의 계약은 [최신 API 상세 명세](../api/frontend-backend-2026-10-10/specification.md)와 `FeatureType`을 따릅니다. 별도의 동명 물리 테이블이 있다고 가정하지 않습니다.',
              '- `feature_member`의 공간과 `feature_record` 부모, 파일의 그룹, WBS·위키 부모와 공유는 서비스에서 같은 소유자·공간·활성 상태를 확인합니다.',
              '- `users`와 `chat_user`는 인증 어댑터로 연결됩니다. Core 계정 ID의 UUID·ULID 호환과 채팅 V4의 폭 확장을 반영하며, 모든 ID가 무조건 26자리라고 가정하지 않습니다.',
              '- `task.event_id` 문자열과 `events.id` BIGINT의 차이는 남아 있습니다. 연결 FK를 새로 그리거나 데이터를 강제 변환하지 않습니다.',
              '- 구형 `events/routine/planner_item`과 신규 `SCHEDULE/ROUTINE_RECORD`를 동시에 쓰면 중복될 수 있습니다. 새 화면 연결은 사용할 계약을 먼저 선택합니다.', '',
              '## 테이블 목록', '', '| 테이블 | 역할 |', '| --- | --- |']
    for table in tables:
        name = table['name']
        lines.append(f'| [{name}](#{name.replace("_", "-")}) | {PURPOSES[name]} |')
    lines += ['', '## 테이블 정의', '', 'NULL 허용은 DB 정의이며 API의 필수 입력과 다를 수 있습니다. 기본값 NULL과 값 없음의 차이는 `SHOW CREATE TABLE` 및 실제 마이그레이션으로 최종 확인합니다. 시각의 문자열 저장과 구형 축약 필드는 현재 구조를 그대로 기록한 것이며 신규 표준을 뜻하지 않습니다.', '']
    for table in tables:
        name = table['name']
        lines += [f'<a id="{name.replace("_", "-")}"></a>', f'### `{name}`', '', PURPOSES[name] + '.', '',
                  f"엔진 `{table['engine']}`, 비교 규칙 `{table['collation']}`입니다.", '',
                  '| 컬럼 | DB 타입 | NULL 허용 | 기본값 | 키·추가 속성 | 의미 |', '| --- | --- | --- | --- | --- | --- |']
        for col in sections['column']:
            if col['table'] == name:
                meaning = col['comment'] or MEANINGS.get(col['name'], '해당 도메인의 저장 필드. 아래 소스와 API 계약 참조')
                lines.append('| ' + ' | '.join(cell(v) for v in [f"`{col['name']}`", col['type'], col['nullable'], col['default'], (col['key']+' '+col['extra']).strip() or '없음', meaning]) + ' |')
        indices = defaultdict(list)
        for idx in sections['index']:
            if idx['table'] == name:
                indices[(idx['name'], idx['nonUnique'])].append(idx['column'])
        lines += ['', '인덱스와 제약은 다음과 같습니다.', '']
        for (index, non_unique), cols in indices.items():
            lines.append(f'- `{index}`. {"일반" if non_unique else "고유"} 인덱스 `({", ".join(cols)})`.')
        for _, constraint in sorted(k for k in foreign_keys if k[0] == name):
            parts = [r for r in sections['fk'] if r['table'] == name and r['name'] == constraint]
            lines.append(f"- `{constraint}`. `({', '.join(r['column'] for r in parts)})` → `{parts[0]['parent']}({', '.join(r['parentColumn'] for r in parts)})`. DELETE `{parts[0]['deleteRule']}`, UPDATE `{parts[0]['updateRule']}`.")
        for check in sections['check']:
            if check['table'] == name:
                lines.append(f"- `{check['name']}`. CHECK `{cell(check['expression'])}`.")
        lines.append('')
    lines += ['## 마이그레이션과 재생성', '', '| 이력 | 버전 | 설명 | 성공 |', '| --- | --- | --- | --- |']
    for row in sections['migration']:
        lines.append(f"| {row['history']} | {row['version']} | {row['description']} | {row['success']} |")
    lines += ['', '기준은 Core V3, workspace V4·V6, Java Core V5, Chat V1~V4입니다. V2 baseline은 과거 V1을 재실행하지 않기 위한 이력이며 마이그레이션 SQL을 수동 실행하라는 뜻이 아닙니다.', '',
              '[스키마 메타데이터](current-schema.json)에 수집일·마이그레이션 소스의 UTF-8·LF 정규화 SHA-256을 함께 보관합니다. 운영체제 개행 차이는 해시 차이로 취급하지 않습니다. 생성기는 DB 사용자 행을 조회하거나 DDL을 실행하지 않습니다.', '',
              '```powershell', 'python scripts/docs/build_current_database.py --check',
              '# 격리 MySQL이 실행 중일 때만 메타데이터를 다시 캡처합니다.',
              'python scripts/docs/build_current_database.py --capture-container timeflow-chat-mysql-1 --as-of 2026-10-31', '```', '',
              '기존 DB의 변경·복구는 [DB 환경과 마이그레이션 안내](environment.md)를 따릅니다. 운영 스키마와 자동 동기화하거나 과거 검토용 DDL을 적용하지 않습니다.', '']
    return '\n'.join(lines)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--capture-container')
    parser.add_argument('--as-of')
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    if args.check and args.capture_container:
        parser.error('--check와 DB 캡처는 동시에 실행할 수 없습니다.')
    if args.capture_container:
        try:
            parsed_date = date.fromisoformat(args.as_of)
            if args.as_of != parsed_date.isoformat():
                raise ValueError('날짜 형식 불일치')
        except (TypeError, ValueError):
            parser.error('클라이언트 기준 날짜를 --as-of YYYY-MM-DD로 지정하세요.')
        data = capture(args.capture_container, args.as_of)
        SNAPSHOT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    else:
        data = json.loads(SNAPSHOT.read_text(encoding='utf-8'))
    content = render(data)
    if args.check:
        if data['sourceHashes'] != fingerprints():
            raise SystemExit('DB 마이그레이션 소스가 달라졌습니다. 격리 DB 갱신 후 다시 캡처하세요.')
        if DOCUMENT.read_text(encoding='utf-8') != content:
            raise SystemExit('현재 DB 정의서가 메타데이터와 다릅니다. 재생성하세요.')
        print('현재 DB 메타데이터·소스 해시·생성 문서 일치.')
    else:
        DOCUMENT.write_text(content, encoding='utf-8')
        print('현재 DB ERD와 테이블 정의서 생성.')


if __name__ == '__main__':
    main()
