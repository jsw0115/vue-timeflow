"""Real JDBC/HTTP recovery checks on explicitly named disposable schemas only.

Requires the running local mysqldata + timeflow-chat-redis-1 containers and a built JAR.
Reads ignored backend/.env; never prints tokens, password hashes or account contents.
The original timeflow/auth_db schemas are never written by this script.
"""
import concurrent.futures
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / 'backend/build/database-recovery'
ENVIRONMENT = dict(line.split('=', 1) for line in (ROOT / 'backend/.env').read_text('utf-8').splitlines()
                   if line and not line.startswith('#') and '=' in line)
SCHEMAS = {'timeflow_verify_20261003', 'timeflow_empty_verify_20261003', 'timeflow_reject_verify_20261003'}
RESULTS = []
CREATE_NO_WINDOW = getattr(subprocess, 'CREATE_NO_WINDOW', 0)


def java_executable():
    command = os.environ.get('TIMEFLOW_JAVA') or shutil.which('java')
    if not command:
        raise RuntimeError('Java 17 is required')
    settings = subprocess.run([command, '-XshowSettings:properties', '-version'],
                              capture_output=True, text=True, timeout=15, creationflags=CREATE_NO_WINDOW)
    home = re.search(r'^\s*java\.home = (.+)$', settings.stderr, re.MULTILINE)
    if not home:
        raise RuntimeError('Cannot resolve the actual JDK executable')
    return str(Path(home.group(1).strip()) / 'bin' / ('java.exe' if os.name == 'nt' else 'java'))


JAVA = java_executable()


def sql(schema, query):
    assert schema in SCHEMAS, 'Verification writes must remain in a disposable schema'
    environment = dict(os.environ, MYSQL_PWD=ENVIRONMENT['DB_PASSWORD'])
    result = subprocess.run(['docker', 'exec', '-e', 'MYSQL_PWD', 'mysqldata', 'mysql', '--protocol=tcp',
                             '--host=127.0.0.1', '--user=timeflow', '--database=' + schema,
                             '--batch', '--raw', '--skip-column-names', '--execute=' + query],
                            env=environment, text=True, encoding='utf-8', capture_output=True, timeout=20)
    if result.returncode:
        raise RuntimeError('Isolated fixture SQL failed: ' + result.stderr)
    return result.stdout.strip()


def passed(name):
    RESULTS.append(name)
    print('PASS: ' + name, flush=True)


def call(port, path, user=None, method='GET', body=None, expected=200):
    headers = {'Content-Type': 'application/json'}
    if user:
        headers['Authorization'] = 'Bearer ' + user['accessToken']
    request = urllib.request.Request(f'http://127.0.0.1:{port}' + path, headers=headers, method=method,
                                     data=None if body is None else json.dumps(body).encode())
    try:
        response = urllib.request.urlopen(request, timeout=20)
    except urllib.error.HTTPError as error:
        response = error
    raw = response.read()
    payload = json.loads(raw) if raw else {}
    if response.status != expected:
        raise AssertionError(f'{method} {path}: HTTP {response.status}, expected {expected}')
    return payload.get('data')


class Server:
    def __init__(self, schema, port, chat=True):
        assert schema in SCHEMAS
        self.port = port
        self.log_path = OUTPUT / f'{schema}-{port}.log'
        self.log = self.log_path.open('w', encoding='utf-8')
        environment = dict(os.environ, **ENVIRONMENT)
        environment.update(DB_URL=f'jdbc:mysql://127.0.0.1:3307/{schema}?connectionTimeZone=UTC&forceConnectionTimeZoneToSession=true',
                           DB_DRIVER='com.mysql.cj.jdbc.Driver',
                           DB_SCHEMA=schema, CHAT_ENABLED=str(chat).lower(), REDIS_HOST='127.0.0.1',
                           REDIS_PORT='16389', SERVER_PORT=str(port), LOGGING_LEVEL_ROOT='WARN',
                           LOGGING_LEVEL_ORG_SPRINGFRAMEWORK='WARN', DEBUG='false')
        self.process = subprocess.Popen([JAVA, '-jar', 'build/libs/timeflow-api-0.1.0.jar',
                                         '--logging.config=classpath:log4j2-chat-local.xml'],
                                        cwd=ROOT / 'backend', env=environment, stdout=self.log,
                                        stderr=subprocess.STDOUT, creationflags=CREATE_NO_WINDOW)

    def wait(self):
        deadline = time.monotonic() + 80
        while time.monotonic() < deadline:
            if self.process.poll() is not None:
                raise RuntimeError(f'Test server stopped; inspect {self.log_path}')
            try:
                with urllib.request.urlopen(f'http://127.0.0.1:{self.port}/actuator/health', timeout=1) as response:
                    if json.load(response)['status'] == 'UP':
                        return
            except (OSError, ValueError):
                pass
            time.sleep(.5)
        raise RuntimeError(f'Test server health timeout; inspect {self.log_path}')

    def stop(self):
        if self.process.poll() is None:
            self.process.terminate()
            try:
                self.process.wait(timeout=15)
            except subprocess.TimeoutExpired:
                self.process.kill()
                self.process.wait(timeout=5)
        self.log.close()


def signup(port, label):
    email = f'recovery-{label}-{uuid.uuid4().hex[:10]}@example.test'
    password = 'RecoveryFixture!2026'
    call(port, '/api/auth/signup', method='POST', expected=201,
         body=dict(email=email, nickname=label, password=password, agreeTerms=True, agreePrivacy=True))
    return call(port, '/api/auth/login', method='POST', body=dict(email=email, password=password))


def exercise_api(schema, port):
    owner = signup(port, 'Owner')
    outsider = signup(port, 'Outsider')
    legacy_id = str(uuid.uuid4())
    legacy_email = 'recovery-uuid-' + uuid.uuid4().hex[:10] + '@example.test'
    sql(schema, f"INSERT INTO users(id,email,pw_hash,nick,role,st,tz,email_vfy,c_at,u_at,is_enabled) "
                f"SELECT '{legacy_id}','{legacy_email}',pw_hash,'UUID Fixture','USER','ACTIVE','Asia/Seoul',"
                f"FALSE,UTC_TIMESTAMP(6),UTC_TIMESTAMP(6),1 FROM users WHERE id='{owner['userId']}';")
    peer = call(port, '/api/auth/login', method='POST',
                body=dict(email=legacy_email, password='RecoveryFixture!2026'))
    assert peer['userId'] == legacy_id
    passed('ULID signup and legacy UUID login retain their identifiers')

    prefs = call(port, '/api/planner/preferences', peer)
    assert prefs == {'defaultView': 'DAILY', 'version': 0}
    saved = call(port, '/api/planner/preferences', peer, 'PUT', {'defaultView': 'MONTHLY', 'version': 0})
    assert saved['version'] == 1
    call(port, '/api/planner/preferences', peer, 'PUT', {'defaultView': 'WEEKLY', 'version': 0}, 409)
    assert call(port, '/api/planner/preferences', peer) == saved
    passed('planner first insert and optimistic conflict work on real JDBC')

    task = call(port, '/api/tasks', owner, 'POST', {'title': 'Recovery task'}, 201)
    base = '/api/tasks/' + task['id']
    call(port, base + '/checklist-items', outsider, expected=404)
    call(port, base + '/assignees/' + legacy_id, owner, 'PUT')
    candidates = call(port, base + '/assignees', owner)
    assert legacy_id in [entry['userId'] for entry in candidates]
    item = call(port, base + '/checklist-items', owner, 'POST',
                {'title': 'UUID assignment', 'assigneeId': legacy_id}, 201)
    assert item['version'] == 1 and item['assigneeId'] == legacy_id
    path = base + '/checklist-items/' + item['id']
    complete = call(port, path + '/completion', owner, 'PUT', {'completed': True, 'version': 1})
    assert complete['version'] == 2 and complete['completed']
    repeated = call(port, path + '/completion', owner, 'PUT', {'completed': True, 'version': 2})
    assert repeated['version'] == 2 and repeated['completed']
    call(port, path, owner, 'PUT', {'title': 'stale', 'assigneeId': None, 'version': 1}, 409)
    call(port, base + '/assignees/' + legacy_id, owner, 'DELETE', expected=409)
    passed('UUID assignments, real version increments and no-op completion retain state')

    def competing_update(title):
        try:
            call(port, path, owner, 'PUT', {'title': title, 'assigneeId': legacy_id, 'version': 2})
            return 200
        except AssertionError as error:
            if 'HTTP 409' in str(error):
                return 409
            raise

    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        statuses = list(pool.map(competing_update, ['Concurrent A', 'Concurrent B']))
    assert sorted(statuses) == [200, 409]
    persisted = call(port, base + '/checklist-items', owner)[0]
    assert persisted['version'] == 3
    call(port, path + '?version=3', owner, 'DELETE', expected=204)
    call(port, base + '/assignees/' + legacy_id, owner, 'DELETE', expected=204)
    assert call(port, base + '/checklist-items', owner) == []
    passed('concurrent parent locks allow one save and reject the stale competitor')

    room = call(port, '/api/chat/rooms', owner, 'POST', {'kind': 'DM', 'memberIds': [legacy_id]})
    reciprocal = call(port, '/api/chat/rooms', peer, 'POST', {'kind': 'DM', 'memberIds': [owner['userId']]})
    assert reciprocal['id'] == room['id']
    room_path = '/api/chat/rooms/' + room['id']
    message = call(port, room_path + '/messages', owner, 'POST',
                   {'clientMessageId': str(uuid.uuid4()), 'body': '복구검증 @UUID #복구',
                    'mentionUserIds': [legacy_id]})
    mentions = call(port, '/api/chat/mentions', peer)
    assert message['id'] in [entry['message']['id'] for entry in mentions['items']]
    hits = call(port, '/api/chat/search?q=' + urllib.parse.quote('복구검증'), peer)
    assert message['id'] in [entry['message']['id'] for entry in hits['items']]
    call(port, '/api/chat/search?q=' + urllib.parse.quote('복구검증'), outsider)
    passed('UUID/ULID DM deduplication, mentions and indexed message search work')

    client = str(uuid.uuid4())
    call(port, '/api/chat/presence', peer, 'PUT', {'clientId': client, 'active': True}, 204)
    presence = call(port, '/api/chat/presence?userIds=' + legacy_id, owner)
    assert presence[0]['active'] and presence[0]['userId'] == legacy_id
    call(port, '/api/chat/presence', peer, 'PUT', {'clientId': client, 'active': False}, 204)
    passed('Redis presence works with legacy UUID accounts')


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    schema = 'timeflow_verify_20261003'
    # A sentinel exercises data preservation even though the actual events table was empty.
    if sql(schema, "SELECT COUNT(*) FROM events WHERE title='preservation-sentinel';") == '0':
        sql(schema, "INSERT INTO events(user_id,title,date,note,created_at,updated_at) VALUES"
                "('01J00000000000000000000001','preservation-sentinel','2026-10-03',"
                "'retained',UTC_TIMESTAMP(6),UTC_TIMESTAMP(6));")
    before = sql(schema, "SELECT COUNT(*) FROM tbllog; SELECT SHA2(CONCAT_WS('|',id,user_id,title,date,note),256) "
                         "FROM events WHERE title='preservation-sentinel';")
    server = Server(schema, 18082)
    try:
        server.wait()
        passed('partial legacy schema starts with core V3/V4/V5 and JPA validate')
        after = sql(schema, "SELECT COUNT(*) FROM tbllog; SELECT SHA2(CONCAT_WS('|',id,user_id,title,date,note),256) "
                            "FROM events WHERE title='preservation-sentinel';")
        assert before == after
        passed('existing log rows and event sentinel are preserved')
        exercise_api(schema, 18082)
        history = sql(schema, 'SELECT version,type,checksum,success FROM flyway_schema_history ORDER BY installed_rank;')
    finally:
        server.stop()

    server = Server(schema, 18082)
    try:
        server.wait()
        assert history == sql(schema, 'SELECT version,type,checksum,success FROM flyway_schema_history ORDER BY installed_rank;')
        passed('restart validates existing history without rebaselining or repeated DDL')
    finally:
        server.stop()

    server = Server('timeflow_empty_verify_20261003', 18083, chat=False)
    try:
        server.wait()
        owner = signup(18083, 'Fresh')
        assert call(18083, '/api/planner/preferences', owner)['version'] == 0
        passed('empty schema starts safely with chat disabled and no destructive V1')
    finally:
        server.stop()

    schema = 'timeflow_reject_verify_20261003'
    server = Server(schema, 18084, chat=False)
    try:
        server.process.wait(timeout=45)
        assert server.process.returncode != 0
        assert sql(schema, 'SELECT COUNT(*) FROM unknown_data;') == '1'
        assert sql(schema, "SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() "
                           "AND TABLE_NAME='flyway_schema_history';") == '0'
        passed('unknown schema is rejected before baseline or data changes')
    finally:
        server.stop()
    (OUTPUT / 'http-results.json').write_text(json.dumps({'passed': RESULTS, 'count': len(RESULTS)},
                                                        ensure_ascii=False, indent=2) + '\n', 'utf-8')
    print('Recovery checks completed: ' + str(len(RESULTS)), flush=True)


if __name__ == '__main__':
    main()
