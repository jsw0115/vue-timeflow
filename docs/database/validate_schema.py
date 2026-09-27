"""Validate the review DDL in the dedicated, disposable MySQL container only.

Prerequisite: docker run --rm --name timeflow-schema-review-20260926
             -e MYSQL_ALLOW_EMPTY_PASSWORD=yes -d mysql:8.4
No host port or volume is needed. This script never accesses the application DB.
Run once per fresh container: python docs/database/validate_schema.py
"""
from pathlib import Path
import hashlib
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parent
CONTAINER = 'timeflow-schema-review-20260926'
DATABASE = 'timeflow_design_review'
DDL = ROOT / 'timeflow-mysql84-schema.sql'


def sql(statement, database=DATABASE):
    command = ['docker', 'exec', '-i', CONTAINER, 'mysql', '--default-character-set=utf8mb4', '-uroot', '-N', '-B']
    if database:
        command.append(database)
    return subprocess.run(command, input=statement.encode('utf-8'), stdout=subprocess.PIPE, stderr=subprocess.PIPE)


def ok(statement, database=DATABASE):
    result = sql(statement, database)
    if result.returncode:
        raise RuntimeError(result.stderr.decode('utf-8', errors='replace'))
    return result.stdout.decode('utf-8').strip()


# This is a fresh, dedicated schema. Existing names deliberately cause failure.
ok(f'CREATE DATABASE {DATABASE} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;', None)
ddl = DDL.read_text(encoding='utf-8')
ok(ddl)
version = ok('SELECT VERSION();')
assert version.startswith('8.4.'), version
metadata = {
    'tables': int(ok("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE();")),
    'columns': int(ok("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE();")),
    'foreign_keys': int(ok("SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND constraint_type='FOREIGN KEY';")),
    'checks': int(ok("SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_schema=DATABASE() AND constraint_type='CHECK';")),
}
assert metadata['tables'] == 40
assert metadata['columns'] == len(re.findall(r'^  `\w+` ', ddl, re.M))
assert metadata['foreign_keys'] == ddl.count('FOREIGN KEY')
assert metadata['checks'] == ddl.count(' CHECK ')
assert ok("SELECT COUNT(*) FROM information_schema.referential_constraints WHERE constraint_schema=DATABASE() AND (delete_rule <> 'RESTRICT' OR update_rule <> 'RESTRICT');") == '0'

U1, U2, MISSING = '00000000000000000000000001', '00000000000000000000000002', '00000000000000000000000999'
C1, C2 = '00000000000000000000000101', '00000000000000000000000102'
T1, R1 = '00000000000000000000000201', '00000000000000000000000301'
F1, A1 = '00000000000000000000000401', '00000000000000000000000501'
ok(f"""
SET time_zone='+00:00';
INSERT INTO tbl_users (id,email,pw_hash,nick,role,st) VALUES
('{U1}','one@example.test','test-only','One','USER','ACTIVE'),
('{U2}','two@example.test','test-only','Two','USER','ACTIVE');
INSERT INTO tbl_category (id,user_id,name) VALUES ('{C1}','{U1}','One'),('{C2}','{U2}','Two');
INSERT INTO tbl_user_device (id,user_id,device_id) VALUES ('00000000000000000000000601','{U1}','device-one');
INSERT INTO tbl_event_series (id,user_id) VALUES (1,'{U1}');
INSERT INTO tbl_events (id,user_id,title,series_id,cat_id,start_utc,end_utc) VALUES
(1,'{U1}','Timed',1,'{C1}','2026-09-26 01:00:00','2026-09-26 02:00:00');
INSERT INTO tbl_events (id,user_id,title,all_day,start_date,end_date) VALUES
(2,'{U1}','All-day',1,'2026-09-26','2026-09-27');
INSERT INTO tbl_task (id,user_id,title,st,pri,energy_lvl,event_id,cat_id) VALUES
('{T1}','{U1}','Task','TODO','MEDIUM','LOW',1,'{C1}');
INSERT INTO tbl_task_repeat_rule (task_id) VALUES ('{T1}');
INSERT INTO tbl_task_repeat_weekday (task_id,weekday) VALUES ('{T1}',1);
INSERT INTO tbl_routine (id,user_id,name,at_time) VALUES ('{R1}','{U1}','Routine','08:00:00');
INSERT INTO tbl_routine_weekday (routine_id,weekday) VALUES ('{R1}',1);
INSERT INTO tbl_routine_log (id,routine_id,dt,st) VALUES ('00000000000000000000000701','{R1}','2026-09-26','done');
INSERT INTO tbl_data_file (id,user_id,kind,filename,storage_key) VALUES ('{F1}','{U1}','EXPORT','test.json','review/test.json');
INSERT INTO tbl_data_job (id,user_id,typ,fmt,result_file_id) VALUES ('00000000000000000000000801','{U1}','EXPORT','JSON','{F1}');
INSERT INTO tbl_ext_cal_account (id,user_id,provider,external_subject) VALUES ('{A1}','{U1}','GOOGLE','subject-one');
INSERT INTO tbl_sync_run_log (id,user_id,account_id,st,started_utc) VALUES ('00000000000000000000000901','{U1}','{A1}','RUNNING',NOW(6));
INSERT INTO tbl_user_pref (user_id) VALUES ('{U1}');
INSERT INTO tbl_dash_layout (id,user_id,`json`) VALUES ('00000000000000000000001001','{U1}','{{"schemaVersion":1}}');
INSERT INTO tbl_event_policy (event_id) VALUES (1);
INSERT INTO tbl_event_share (id,event_id,user_id,role,by_id,`at`) VALUES ('00000000000000000000001101',1,'{U2}','viewer','{U1}',NOW(6));
INSERT INTO tbl_event_ex (id,event_id,user_id,occ_start,by_id) VALUES ('00000000000000000000001201',1,'{U1}','2026-09-26 01:00:00','{U1}');
INSERT INTO tbl_event_ver (id,event_id,ver_no,`at`,by_id,snap) VALUES ('00000000000000000000001301',1,1,NOW(6),'{U1}','{{"schemaVersion":1}}');
INSERT INTO tbl_task_member (task_id,user_id,joined_at) VALUES ('{T1}','{U2}',NOW(6));
INSERT INTO tbl_diary (id,user_id,dt) VALUES ('00000000000000000000001401','{U1}','2026-09-26');
INSERT INTO tbl_friend (id,a_id,b_id,req_by) VALUES ('00000000000000000000001501','{U1}','{U2}','{U1}');
INSERT INTO tbl_cal_group (id,owner_id,name) VALUES ('00000000000000000000001601','{U1}','Group');
INSERT INTO tbl_cal_group_mem (id,gid,user_id,`at`) VALUES ('00000000000000000000001701','00000000000000000000001601','{U2}',NOW(6));
INSERT INTO tbl_sticker_pack (id,code,name) VALUES ('00000000000000000000001801','review-pack','Pack');
INSERT INTO tbl_user_sticker_pack (id,user_id,pack_id,`at`) VALUES ('00000000000000000000001901','{U1}','00000000000000000000001801',NOW(6));
""")

cases = []


def case(label, statement, error=None):
    result = sql("SET time_zone='+00:00'; START TRANSACTION; " + statement + '; ROLLBACK;')
    message = result.stderr.decode('utf-8', errors='replace')
    if error is None:
        assert result.returncode == 0, (label, message)
    else:
        assert result.returncode != 0 and f'ERROR {error} ' in message, (label, error, message)
    cases.append({'scenario': label, 'expected_error': error, 'result': 'PASS'})


case('고아 사용자 참조 차단', f"INSERT INTO tbl_memo (id,user_id) VALUES ('{MISSING}','{MISSING}')", 1452)
case('다른 사용자 카테고리 연결 차단', f"UPDATE tbl_task SET cat_id='{C2}' WHERE id='{T1}'", 1452)
case('다른 사용자 일정 연결 차단', f"UPDATE tbl_task SET user_id='{U2}',cat_id=NULL WHERE id='{T1}'", 1452)
case('다른 사용자 시리즈 연결 차단', f"INSERT INTO tbl_events(user_id,title,series_id,start_utc,end_utc) VALUES ('{U2}','Wrong owner',1,NOW(6),DATE_ADD(NOW(6),INTERVAL 1 HOUR))", 1452)
case('다른 사용자 결과 파일 연결 차단', f"UPDATE tbl_data_job SET user_id='{U2}'", 1452)
case('다른 사용자 외부 계정 연결 차단', f"UPDATE tbl_sync_run_log SET user_id='{U2}'", 1452)
case('다른 사용자 카테고리 부모 차단', f"UPDATE tbl_category SET parent_id='{C2}' WHERE id='{C1}'", 1452)
case('카테고리 자기 참조 차단', f"UPDATE tbl_category SET parent_id=id WHERE id='{C1}'", 3819)
case('개인 카테고리 소유자 필수', f"UPDATE tbl_category SET user_id=NULL WHERE id='{C1}'", 1048)
case('일정 종료 역전 차단', "UPDATE tbl_events SET end_utc=start_utc WHERE id=1", 3819)
case('일정 시간 필수 쌍 차단', "UPDATE tbl_events SET start_utc=NULL WHERE id=1", 3819)
case('종일 일정 UTC 혼재 차단', "UPDATE tbl_events SET start_utc='2026-09-26 00:00:00' WHERE id=2", 3819)
case('종일 종료일 역전 차단', "UPDATE tbl_events SET end_date=start_date WHERE id=2", 3819)
case('여러 날 시간 일정 허용', "UPDATE tbl_events SET end_utc='2026-09-28 02:00:00' WHERE id=1")
case('여러 날 종일 일정 허용', "UPDATE tbl_events SET end_date='2026-09-29' WHERE id=2")
case('잘못된 BOOLEAN 차단', "UPDATE tbl_events SET all_day=2 WHERE id=1", 3819)
case('중복 기본 레이아웃 차단', f"INSERT INTO tbl_dash_layout(id,user_id,`json`) VALUES ('{MISSING}','{U1}','{{}}')", 1062)
case('NULL 기본 화면 크기 차단', "UPDATE tbl_dash_layout SET bp=NULL", 1048)
case('잘못된 JSON 차단', "UPDATE tbl_dash_layout SET `json`='invalid-json'", 3140)
case('1:1 사용자 설정 중복 차단', f"INSERT INTO tbl_user_pref(user_id) VALUES ('{U1}')", 1062)
case('1:1 일정 정책 중복 차단', 'INSERT INTO tbl_event_policy(event_id) VALUES (1)', 1062)
case('1:1 반복 규칙 중복 차단', f"INSERT INTO tbl_task_repeat_rule(task_id) VALUES ('{T1}')", 1062)
case('회차 예외 중복 차단', f"INSERT INTO tbl_event_ex(id,event_id,user_id,occ_start,by_id) VALUES ('{MISSING}',1,'{U1}',NOW(6),'{U1}')", 1062)
case('예외 시간 모드 NULL 우회 차단', "UPDATE tbl_event_ex SET o_start_utc=NOW(6),o_end_utc=DATE_ADD(NOW(6),INTERVAL 1 HOUR),o_all_day=NULL", 3819)
case('예외 종일 변경 허용', "UPDATE tbl_event_ex SET o_all_day=1,o_start_date='2026-09-26',o_end_date='2026-09-27'")
case('일정 버전 중복 차단', f"INSERT INTO tbl_event_ver(id,event_id,ver_no,`at`,by_id,snap) VALUES ('{MISSING}',1,1,NOW(6),'{U1}','{{}}')", 1062)
case('일정 공유 중복 차단', f"INSERT INTO tbl_event_share(id,event_id,user_id,role,by_id,`at`) VALUES ('{MISSING}',1,'{U2}','viewer','{U1}',NOW(6))", 1062)
case('공유받는 사용자 고아 참조 차단', f"UPDATE tbl_event_share SET user_id='{MISSING}'", 1452)
case('할 일 멤버 중복 차단', f"INSERT INTO tbl_task_member(task_id,user_id,joined_at) VALUES ('{T1}','{U2}',NOW(6))", 1062)
case('그룹 멤버 중복 차단', f"INSERT INTO tbl_cal_group_mem(id,gid,user_id,`at`) VALUES ('{MISSING}','00000000000000000000001601','{U2}',NOW(6))", 1062)
case('스티커 설치 중복 차단', f"INSERT INTO tbl_user_sticker_pack(id,user_id,pack_id,`at`) VALUES ('{MISSING}','{U1}','00000000000000000000001801',NOW(6))", 1062)
case('루틴 날짜 중복 차단', f"INSERT INTO tbl_routine_log(id,routine_id,dt,st) VALUES ('{MISSING}','{R1}','2026-09-26','done')", 1062)
case('다이어리 날짜 중복 차단', f"INSERT INTO tbl_diary(id,user_id,dt) VALUES ('{MISSING}','{U1}','2026-09-26')", 1062)
case('친구 역방향 쌍 차단', f"INSERT INTO tbl_friend(id,a_id,b_id,req_by) VALUES ('{MISSING}','{U2}','{U1}','{U1}')", 3819)
case('자기 자신 친구 차단', f"INSERT INTO tbl_friend(id,a_id,b_id,req_by) VALUES ('{MISSING}','{U1}','{U1}','{U1}')", 3819)
case('친구 외부 요청자 차단', f"UPDATE tbl_friend SET req_by='{MISSING}'", 3819)
case('요일 범위 차단', f"INSERT INTO tbl_routine_weekday(routine_id,weekday) VALUES ('{R1}',8)", 3819)
case('루틴 요일 중복 차단', f"INSERT INTO tbl_routine_weekday(routine_id,weekday) VALUES ('{R1}',1)", 1062)
case('할 일 요일 중복 차단', f"INSERT INTO tbl_task_repeat_weekday(task_id,weekday) VALUES ('{T1}',1)", 1062)
case('반복 종료 날짜 필수', "UPDATE tbl_task_repeat_rule SET end_type='UNTIL',end_until=NULL", 3819)
case('반복 간격 양수 보장', "UPDATE tbl_task_repeat_rule SET interval_val=0", 3819)
case('알 수 없는 할 일 상태 차단', "UPDATE tbl_task SET st='INVALID'", 3819)
case('기기 미연결 토큰 허용', f"INSERT INTO tbl_refresh_token(id,user_id,tok_hash,exp_utc) VALUES ('{MISSING}','{U1}',REPEAT('a',64),DATE_ADD(NOW(6),INTERVAL 1 DAY))")
case('동일 사용자 기기 토큰 허용', f"INSERT INTO tbl_refresh_token(id,user_id,device_id,tok_hash,exp_utc) VALUES ('{MISSING}','{U1}','device-one',REPEAT('a',64),DATE_ADD(NOW(6),INTERVAL 1 DAY))")
case('다른 사용자 기기 토큰 차단', f"INSERT INTO tbl_refresh_token(id,user_id,device_id,tok_hash,exp_utc) VALUES ('{MISSING}','{U2}','device-one',REPEAT('a',64),DATE_ADD(NOW(6),INTERVAL 1 DAY))", 1452)
case('음수 파일 크기 차단', 'UPDATE tbl_data_file SET size_b=-1', 3819)
case('동기화 종료 역전 차단', "UPDATE tbl_sync_run_log SET ended_utc=DATE_SUB(started_utc,INTERVAL 1 SECOND)", 3819)
case('외부 공급자 다중 계정 허용', f"INSERT INTO tbl_ext_cal_account(id,user_id,provider,external_subject) VALUES ('{MISSING}','{U1}','GOOGLE','subject-two')")
case('동일 외부 계정 중복 차단', f"INSERT INTO tbl_ext_cal_account(id,user_id,provider,external_subject) VALUES ('{MISSING}','{U1}','GOOGLE','subject-one')", 1062)
case('참조 중인 사용자 삭제 차단', f"DELETE FROM tbl_users WHERE id='{U1}'", 1451)
case('참조 중인 일정 삭제 차단', 'DELETE FROM tbl_events WHERE id=1', 1451)
case('실제 기록 0분 구간 차단', f"INSERT INTO tbl_time_entry(id,user_id,typ,title,start_utc,end_utc,tz) VALUES ('{MISSING}','{U1}','ACTUAL','Test',NOW(6),NOW(6),'Asia/Seoul')", 3819)
case('플래너 소유자 필수', "INSERT INTO tbl_planner_item(type,title) VALUES ('NOTE','Test')", 1364)
case('플래너 시간 한쪽 NULL 차단', f"INSERT INTO tbl_planner_item(type,title,user_id,date,start_time) VALUES ('NOTE','Test','{U1}','2026-09-26','09:00:00')", 3819)
case('방해금지 자정 통과 허용', "UPDATE tbl_user_pref SET dnd_s='22:00:00',dnd_e='07:00:00'")
case('방해금지 한쪽 NULL 차단', "UPDATE tbl_user_pref SET dnd_s='22:00:00',dnd_e=NULL", 3819)

result = {
    'mysql_version': version, 'ddl_sha256': hashlib.sha256(DDL.read_bytes()).hexdigest(),
    'metadata': metadata, 'tests': cases,
}
(ROOT / 'timeflow-schema-validation.json').write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
report = [
    '# MySQL 목표 스키마 검증 보고서\n',
    '검증일: 2026-09-26. 업무 DB에 접속하지 않고, 호스트 볼륨·포트를 연결하지 않은 일회용 컨테이너에서 검증했다.\n',
    f'- 서버: MySQL `{version}` (`mysql:8.4` 이미지)',
    f'- DDL SHA-256: `{result["ddl_sha256"]}`',
    f'- 생성 성공: {metadata["tables"]}개 테이블, {metadata["columns"]}개 컬럼, {metadata["foreign_keys"]}개 FK, {metadata["checks"]}개 CHECK',
    f'- 무결성 시나리오: **{len(cases)} / {len(cases)} 통과**. 정상 fixture 입력도 성공.',
    '- 모든 FK의 삭제·갱신 규칙이 RESTRICT임을 information_schema에서 확인.',
    '- 재현 코드: [validate_schema.py](validate_schema.py), 기계 판독 결과: [JSON](timeflow-schema-validation.json).',
    '- 실패 예상 테스트는 단순 실패 여부뿐 아니라 MySQL 오류 코드도 확인했다. 각 시나리오는 롤백하여 독립 실행했다.\n',
    '| 시나리오 | 예상 오류 | 결과 |', '|---|---|---|',
]
for item in cases:
    report.append(f'| {item["scenario"]} | {item["expected_error"] or "정상 처리"} | PASS |')
report += [
    '\n실데이터 이관, 실사용 조회 성능, API 호환성, 서비스 권한, 동시성 제어 구현은 검증 대상에 포함되지 않았다. 특히 DB FK는 소프트 삭제 상태·공유 권한·카테고리 다중 노드 순환을 판단하지 않는다. 해당 책임은 [설계서](timeflow-database-design.md)에 명시했다.\n',
    '재실행은 새 일회용 컨테이너에서 수행한다. 검증 스크립트는 기존 DB를 삭제하거나 덮어쓰지 않으므로 같은 컨테이너에서 재실행하면 DB명 중복으로 중단된다. 검증용 컨테이너는 사용 후 `docker stop timeflow-schema-review-20260926`으로 정리한다. `--rm`으로 실행하여 컨테이너 데이터가 함께 정리된다.\n',
]
(ROOT / 'timeflow-schema-validation.md').write_text('\n'.join(report), encoding='utf-8')
print(json.dumps({'mysql_version': version, **metadata, 'passed': len(cases)}, ensure_ascii=True))
