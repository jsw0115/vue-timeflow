// 실제 컨트롤러와 입력 규칙을 대조해 프런트엔드 API 목록·명세·OpenAPI를 생성한다.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateCurrent, splitTop } from './design-docs/current.mjs'

const root = fileURLToPath(new URL('../../', import.meta.url))
const destination = 'docs/api/frontend-backend-2026-10-10/'
const walk = directory => readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)])
const java = walk(path.join(root, 'backend/src/main/java/kr/timebar/diary')).filter(file => file.endsWith('.java')).map(file => readFileSync(file, 'utf8'))
let operations
generateCurrent(root, (name, value) => { if (name.endsWith('current-operations.json')) operations = JSON.parse(value) })
operations.sort((a, b) => a.route.localeCompare(b.route) || a.method.localeCompare(b.method))
const schemas = {}
const string = (maxLength = 200) => ({ type: 'string', maxLength })
const integer = (minimum, maximum) => ({ type: 'integer', ...(minimum == null ? {} : { minimum }), ...(maximum == null ? {} : { maximum }) })
const boolean = { type: 'boolean' }
const date = { type: 'string', format: 'date' }
const array = items => ({ type: 'array', items, maxItems: 500 })
const object = (properties, required = []) => ({ type: 'object', properties, required, additionalProperties: false })
const ref = name => ({ $ref: '#/components/schemas/' + name })
const choice = (...values) => ({ type: 'string', enum: values })
const enumValues = {}
for (const source of java) for (const match of source.matchAll(/(?:public )?enum (\w+)\s*\{([^;{}]+)/g)) {
  const values = match[2].split(',').map(value => value.trim()).filter(value => /^[A-Za-z][A-Za-z_]*$/.test(value))
  if (values.length) enumValues[match[1]] = values
}
function javaType(type) {
  type = type.replaceAll(' ', '')
  if (enumValues[type.split('.').at(-1)]) return choice(...enumValues[type.split('.').at(-1)])
  if (type === 'Void' || type === 'void') return { type: 'null' }
  if (type === 'T') return {}
  const page = type.match(/^(Page|SearchPage)<(.+)>$/)
  if (page) return object({ items: array(javaType(page[2])), nextCursor: { type: ['string', 'null'] }, hasNext: boolean, ...(page[1] === 'SearchPage' ? { indexing: boolean } : {}) }, ['items', 'nextCursor', 'hasNext', ...(page[1] === 'SearchPage' ? ['indexing'] : [])])
  if (['long', 'Long', 'int', 'Integer'].includes(type)) return integer()
  if (['double', 'Double', 'float', 'Float'].includes(type)) return { type: 'number' }
  if (['boolean', 'Boolean'].includes(type)) return boolean
  if (type === 'LocalDate') return date
  if (type === 'Instant') return { type: 'string', format: 'date-time' }
  if (type.startsWith('List<')) return array(javaType(type.slice(5, -1)))
  if (type.startsWith('Map<') || type === '?') return { type: 'object', additionalProperties: true }
  if (type === 'String' || /Time/.test(type)) return { type: 'string' }
  return ref(type)
}
function argumentText(source, offset) {
  let depth = 0, quote = false
  for (let index = offset; index < source.length; index++) {
    const char = source[index]
    if (char === '"' && source[index - 1] !== '\\') quote = !quote
    if (!quote && char === '(') depth++
    if (!quote && char === ')' && --depth === 0) return source.slice(offset + 1, index)
  }
  throw Error('Unbalanced record')
}
for (const source of java) for (const match of source.matchAll(/public record (\w+)(?:<[^>]+>)?\s*\(/g)) {
  if (match[1] === 'ApiResponse' || match[1] === 'FeaturePage') continue
  const fields = splitTop(argumentText(source, match.index + match[0].length - 1))
  const properties = {}, required = []
  for (const field of fields) {
    const cleaned = field.replace(/@\w+(?:\((?:[^()"']|"(?:\\.|[^"\\])*"|'[^']*')*\))?\s*/g, '').trim()
    const parts = cleaned.match(/^(.+?)\s+(\w+)$/)
    if (!parts) throw Error('Unparsed DTO field: ' + cleaned)
    properties[parts[2]] = javaType(parts[1])
    const definition = properties[parts[2]]
    const min = field.match(/@Min\((\d+)\)/), max = field.match(/@Max\((\d+)\)/), size = field.match(/@Size\(([^)]*)\)/)
    if (min) definition.minimum = Number(min[1])
    if (max) definition.maximum = Number(max[1])
    if (/@Positive(?:\s|$)/.test(field)) definition.minimum = 1
    if (/@PositiveOrZero/.test(field)) definition.minimum = 0
    if (/@Email/.test(field)) definition.format = 'email'
    if (size) for (const bound of size[1].matchAll(/(min|max)\s*=\s*(\d+)/g)) definition[bound[1] + (definition.type === 'array' ? 'Items' : 'Length')] = Number(bound[2])
    if (/@NotBlank|@NotNull|@NotEmpty|@AssertTrue/.test(field)) required.push(parts[2])
    else if (!['int', 'long', 'boolean', 'double', 'float'].includes(parts[1])) properties[parts[2]] = { anyOf: [definition, { type: 'null' }] }
  }
  schemas[match[1]] = object(properties, required)
}
// 플래너 생성은 버전 생략/0, 변경은 조회한 공개 버전 1 이상을 요구한다.
schemas.PlannerItem.properties.version = integer(1)
schemas.PlannerItem.required.push('version')
schemas.PlannerItemCreate = object({ ...schemas.PlannerItem.properties, version: integer(0, 0) }, schemas.PlannerItem.required.filter(field => field !== 'version'))
schemas.PlannerItemUpdate = object({ ...schemas.PlannerItem.properties }, [...schemas.PlannerItem.required])
const clock = { type: 'string', pattern: '^(?:[01][0-9]|2[0-3]):[0-5][0-9]$' }
schemas.RecurrenceException = object({ date, action: choice('skip', 'override'), title: string(), startTime: clock, endTime: clock }, ['date', 'action'])
schemas.RecurrenceException.description = 'skip은 그 날짜의 회차를 뺀다. override는 일정에서만 쓰며 그 회차의 title·startTime·endTime 중 바꾼 필드만 담는다(하나 이상 필수, 날짜는 바꾸지 않는다). 종료는 시작 이후여야 하고 종료 시각은 회차 종료일에 적용된다. 루틴은 skip만 받는다.'
schemas.Recurrence = object({ frequency: choice('none', 'daily', 'weekly', 'monthly', 'yearly'), interval: integer(1, 99), weekdays: array(integer(0, 6)), endMode: choice('never', 'until', 'count'), until: { type: 'string', description: 'endMode=until이면 유효한 YYYY-MM-DD. 그 외 빈 문자열 허용.' }, count: integer(1, 999), exceptions: { type: 'array', maxItems: 366, items: ref('RecurrenceException') } }, ['frequency'])
schemas.Recurrence.description = 'frequency=none 외에는 interval/endMode가 필수. weekly는 weekdays 최소 1개. until 종료는 시작일 이상. count 종료는 count 필수. 존재하지 않는 월말·윤년 회차는 건너뛴다. exceptions는 회차 예외 목록(쉬는 날·회차 변경, 최대 366개, 한 날짜에 하나)이다. 쉬는 날은 그 날짜의 회차를 빼지만 count 종료의 회차 수에는 포함된다. 회차 변경은 그 회차의 제목·시각만 바꾼다.'
schemas.Goal = object({ count: integer(1, 9999), unit: string() }, ['count', 'unit'])
schemas.TemplateBlock = object({ time: { type: 'string', pattern: '^(?:[01][0-9]|2[0-3]):[0-5][0-9]$' }, title: string(), duration: integer(1, 1440) }, ['time', 'title'])
schemas.BoardColumn = object({ id: string(), title: string(), wip: integer(0, 500) }, ['id', 'title', 'wip'])
schemas.BoardCard = object({ id: string(), columnId: string(), title: string(), assignee: string(), due: { type: 'string' }, priority: choice('low', 'normal', 'high'), labels: array(string()), checklist: array(object({ text: string(), done: boolean }, ['text', 'done'])), plannerBlock: string(), order: integer(0, 10000) }, ['id', 'columnId', 'title', 'priority', 'order'])
const booleans = new Set('pinned actionable open favorite read live published popup paused notify completed openRecords'.split(' '))
const numbers = { amount: integer(-1e12, 1e12), duration: integer(1, 1440), alarm: integer(0, 10080), leaveDays: { type: 'number', minimum: 0.5, maximum: 365, multipleOf: 0.5 }, expense: { type: 'number', minimum: 0, maximum: 1e8 }, md: { type: 'number', minimum: 0, maximum: 100000 }, progress: { type: 'number', minimum: 0, maximum: 100 }, years: integer(0, 100), days: integer(3, 100), capacity: integer(2, 500), reminderMinutes: integer(0, 1440), minMinutes: integer(1, 600) }
const arrays = { tags: array(string()), achievements: array(string()), skillTags: array(string()), links: { ...array(string(2000)), maxItems: 10 }, notifyDays: array(integer(0, 365)), attendeeIds: array(string(36)), itemIds: array(string(100)), blocks: array(ref('TemplateBlock')), columns: array(ref('BoardColumn')), cards: array(ref('BoardCard')) }
const featureSource = java.find(source => source.includes('public enum FeatureType'))
for (const match of featureSource.matchAll(/(\w+)\("([^"]*)",\s*"([^"]*)"\)/g)) {
  const [_, name, fields, required] = match
  if (['ACTUAL_SESSION', 'BACKUP_JOB'].includes(name)) continue // 서버 명령 전용 저장 종류는 일반 CRUD 입력을 노출하지 않는다.
  const properties = {}
  for (const field of fields.split(' ')) {
    properties[field] = booleans.has(field) ? boolean : numbers[field] ?? arrays[field] ?? (['date', 'startDate', 'endDate', 'from', 'to', 'deadline', 'appliedDate', 'interviewDate'].includes(field) ? date : ['startedAt', 'endedAt'].includes(field) ? { type: 'string', format: 'date-time' } : field === 'value' ? { oneOf: [{ type: 'object', additionalProperties: true }, { type: 'array', items: {} }] } : field === 'recurrence' ? ref('Recurrence') : field === 'goal' ? ref('Goal') : string(['body', 'handover'].includes(field) ? 20000 : 200))
  }
  if (name === 'ROUTINE_RECORD') properties.days = { ...array(integer(0, 6)), minItems: 1 }
  if (name === 'FOCUS') properties.mode = choice('pomodoro', 'stopwatch', 'free')
  if (name === 'MONEY') properties.type = choice('in', 'out')
  if (name === 'WORK_RECORD') { properties.type = choice('연차', '반차', '외근', '출장', '이직'); properties.half = choice('오전', '오후') }
  if (name === 'COMMUNITY') { properties.joinPolicy = choice('open', 'approval'); properties.visibility = choice('public', 'private') }
  if (name === 'CHALLENGE') { properties.verify = choice('self', 'record'); properties.windowStart = clock; properties.windowEnd = clock }
  if (name === 'CAREER_ACTIVITY') { properties.activityType = choice('work', 'intern', 'part-time', 'freelance', 'project', 'study', 'community'); properties.visibility = choice('private') }
  if (name === 'CAREER') { properties.employmentType = choice('full-time', 'contract', 'intern', 'part-time', 'freelance', 'other'); properties.employmentStatus = choice('current', 'ended') }
  if (name === 'JOB_APPLICATION') { properties.status = choice('interested', 'preparing', 'applied', 'screening-passed', 'interview', 'accepted', 'rejected', 'on-hold', 'withdrawn'); properties.postingUrl = string(2000) }
  for (const field of required.split(' ')) if (properties[field]?.type === 'string') properties[field] = { ...properties[field], minLength: 1 }
  for (const [field, definition] of Object.entries(properties)) if (!required.split(' ').includes(field)) properties[field] = { anyOf: [definition, { type: 'null' }] }
  schemas[name + 'Create'] = object(properties, required.split(' '))
  schemas[name + 'Update'] = object({ ...properties, version: integer(1) }, [...required.split(' '), 'version'])
  schemas[name + 'Upsert'] = object({ ...properties, version: integer(1) }, required.split(' '))
  schemas[name + 'Response'] = { type: 'object', properties: { ...properties, id: string(100), version: integer(1), createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' } }, additionalProperties: true }
}
schemas.MONEYCreate.description = 'KRW 정수. type=in은 양수, out은 음수. 0은 거부한다.'
schemas.WORK_RECORDCreate.description = '종료 일시는 시작 이후. 반차는 같은 날짜와 half 필수. 연차는 leaveDays 0.5일 단위. 외근·출장은 location, 출장은 expense, 이직은 toCompany/role 필수.'
schemas.CHALLENGECreate.description = 'verify는 self(직접 인증, 기본) 또는 record(실시간 실제 기록으로 확인). record이면 minMinutes(1~600) 필수. windowStart·windowEnd(HH:mm)는 record에서만 함께 정하며 끝이 시작보다 늦어야 한다(자정을 넘지 않음). openRecords=true(기록 공개 챌린지)는 record여야 한다. 만든 뒤에는 규칙을 바꾸지 않는다.'
schemas.CAREER_ACTIVITYCreate.description = 'activityType은 회사 업무(work)·인턴(intern)·아르바이트(part-time)·프리랜서(freelance)·개인 프로젝트(project)·학습(study)·커뮤니티 활동(community). endDate는 date 이후. experienceId는 본인 경력(/api/work/career/projects)의 ID만 받고, 없거나 다른 계정 경력이면 400. links는 http/https 절대 주소 최대 10개이며 서버가 호출하지 않는다. visibility는 private만 받고 빼면 private로 저장한다.'
schemas.JOB_APPLICATIONCreate.description = 'status는 관심(interested)·준비 중(preparing)·지원 완료(applied)·서류 통과(screening-passed)·면접 예정(interview)·최종 합격(accepted)·불합격(rejected)·보류(on-hold)·철회(withdrawn). 상태 전이 제한은 없다. postingUrl은 http/https 절대 주소(최대 2000자)이며 서버가 공고를 가져오지 않는다.'
schemas.CAREERCreate.description = '고용 형태 employmentType은 정규직(full-time)·계약직(contract)·인턴(intern)·아르바이트(part-time)·프리랜서(freelance)·기타(other). 재직 상태 employmentStatus는 재직 중(current)·종료(ended). endDate는 startDate 이후. current이면 endDate를 비우고, ended이면 endDate가 필요하다. 상세 필드는 모두 선택이며 예전 자유 기간(period)도 받는다. 기간 겹침·공백은 서버가 막지 않는다.'
schemas.SCHEDULECreate.description = '종료 일시는 시작 이후, 최대 366일. 참석자 ID는 메타데이터이며 공유 권한을 만들지 않는다.'
schemas.SETTINGCreate.description = 'JSON 최대 깊이 8, 객체 100필드, 배열 500항목, 저장 크기 128 KiB. apiKey/password/secret/cardNumber/accessToken/refreshToken은 중첩 위치에서도 거부한다. 자동화·AI 설정 저장은 실행을 의미하지 않는다.'

for (const [name, schema] of Object.entries(schemas)) if (name.endsWith('Create') && schema.description) for (const suffix of ['Update', 'Upsert']) schemas[name.slice(0, -6) + suffix].description = schema.description
for (const name of ['DIARY', 'REVIEW']) { schemas[name + 'DateUpsert'] = object(schemas[name + 'Upsert'].properties, schemas[name + 'Upsert'].required.filter(field => field !== 'date')) }
const resources = { '/api/schedules': 'SCHEDULE', '/api/routine-records': 'ROUTINE_RECORD', '/api/diaries': 'DIARY', '/api/memos': 'MEMO', '/api/ddays': 'DDAY', '/api/money/entries': 'MONEY', '/api/focus/sessions': 'FOCUS', '/api/events/templates': 'EVENT_TEMPLATE', '/api/planner/templates': 'PLANNER_TEMPLATE', '/api/work/records': 'WORK_RECORD', '/api/work/wiki': 'WIKI', '/api/work/wbs/nodes': 'WBS', '/api/work/career/projects': 'CAREER', '/api/work/portfolio': 'PORTFOLIO', '/api/career/activities': 'CAREER_ACTIVITY', '/api/career/applications': 'JOB_APPLICATION', '/api/contacts': 'CONTACT', '/api/share/groups': 'GROUP', '/api/communities': 'COMMUNITY', '/api/admin/content': 'CONTENT', '/api/admin/notices': 'NOTICE' }
const custom = {
  'POST /api/planner/items': ref('PlannerItemCreate'),
  'PUT /api/planner/items/{id}': ref('PlannerItemUpdate'),
  'POST /api/planner/recordings/start': object({ requestId: { ...string(80), minLength: 16, pattern: '^[A-Za-z0-9_-]+$' }, title: { ...string(200), minLength: 1 }, timeZone: string(200), sourceKind: { ...choice('task', 'schedule'), description: '할 일·일정에서 시작할 때 원본 종류. sourceId와 함께 보낸다. 다른 계정의 원본이면 404.' }, sourceId: string(100), mode: { ...choice('pomodoro', 'countdown', 'stopwatch'), description: '집중 타이머 종류. 빼면 플래너의 실제 기록이다.' }, targetMinutes: { ...integer(1, 1440), description: '포모도로·카운트다운에만 필수. 스톱워치·모드 없는 기록에 보내면 400.' } }, ['requestId', 'title', 'timeZone']),
  'POST /api/tasks/{taskId}/schedules': { ...object(schemas.SCHEDULECreate.properties, schemas.SCHEDULECreate.required.filter(field => field !== 'title')), description: '할 일을 일정으로 배치하고 할 일→일정 연결을 같은 트랜잭션에서 남긴다. title을 비우면 할 일 제목을 복사하며, 그 뒤 할 일 제목을 바꿔도 일정 제목은 바뀌지 않는다. Idempotency-Key를 받는다.' },
  'POST /api/planner/recordings/{id}/finish': object({ requestId: { ...string(80), minLength: 16, pattern: '^[A-Za-z0-9_-]+$' }, version: integer(1), endedAt: { type: 'string', format: 'date-time', description: '시작 이후·마지막 일시정지·재개 이후·서버 현재 시각+5초 이내. 일시정지 중이면 그 일시정지를 이 시각에서 닫는다. 응답 유실 시 같은 식별자와 시각으로 재전송.' } }, ['requestId', 'version', 'endedAt']),
  'POST /api/planner/recordings/{id}/pause': { ...object({ version: integer(1) }, ['version']), description: '진행 중(RUNNING) 기록을 서버 현재 시각으로 일시정지한다. 기록 하나에 100번까지. 상태나 version이 다르면 409.' },
  'POST /api/planner/recordings/{id}/resume': { ...object({ version: integer(1) }, ['version']), description: '일시정지(PAUSED) 기록의 마지막 일시정지를 서버 현재 시각으로 닫고 다시 시작한다. 상태나 version이 다르면 409.' },
  'POST /api/planner/recordings/{id}/cancel': { ...object({ version: integer(1) }, ['version']), description: '끝내지 않은 기록을 지우고 원본 연결도 지운다. 끝낸 기록은 409, 다른 계정 기록은 404.' },
  'POST /api/memos/{id}/convert-to-task': object({ version: integer(1), due: date, category: string() }, ['version']),
  'POST /api/career/activities/{id}/sources': { ...object({ kind: { type: 'string', enum: ['schedule', 'actual', 'wbs'] }, id: string(100) }, ['kind', 'id']), description: '커리어 활동에 근거 원본(일정·실제 기록·WBS 작업)을 잇는다(PR-24). 같은 계정의 기록만, 활동마다 50개까지(넘으면 409). 없는 원본·다른 계정 원본은 같은 404. 응답은 근거 목록이고, 지워진 원본은 title 없이 broken=true로 보인다.' },
  'POST /api/contacts/{id}/account': { ...object({ version: integer(1) }, ['version']), description: '연락처 이메일과 정확히 같은 활성 계정을 찾아 accountId·accountNickname을 넣는다(Q-21). 이메일이 없으면 400, 없는 계정·자기 자신·차단은 같은 404, 사람 찾기와 같은 1분 20번 제한(429). 일반 저장에서는 이 두 값을 받지 않고, 이메일이 바뀌면 연결을 끊는다.' },
  'POST /api/events/templates/{id}/apply': object({ date, startTime: string(5) }, ['date', 'startTime']),
  'POST /api/planner/templates/{id}/apply': object({ date }, ['date']),
  'PUT /api/planner/reviews/{date}': ref('REVIEWDateUpsert'), 'PUT /api/planner/canvas': ref('BOARDUpsert'), 'PUT /api/work/resume': ref('RESUMEUpsert'),
  'POST /api/work/portfolio-links': { ...object({ itemIds: array(string(100)), scope: { type: 'string', enum: ['public', 'link'] }, expiresInDays: { type: 'integer', enum: [1, 7, 30] } }, ['itemIds']), description: '고른 포트폴리오 항목만 여는 링크(Q-22). scope 기본 link: 1·7·30일(기본 7) 뒤 만료, 주소는 이 응답에서 한 번만 보인다. public: 만료 없음, 목록에서 주소를 다시 보인다. 열린 링크는 20개까지(넘으면 409).' },
  'POST /api/share/friends/invite': object({ userId: string(36) }, ['userId']),
  'POST /api/share/groups/{id}/members': object({ userId: string(36), role: choice('viewer', 'editor') }, ['userId']),
  'PUT /api/share/groups/{id}/share-level': { ...object({ level: choice('none', 'busy', 'title', 'detail') }, ['level']), description: '이 그룹에 내 일정을 보이는 범위. none 공유 안 함(철회), busy 바쁜 시간만, title 제목 포함, detail 상세 포함(내용·분류·색). 활성 멤버만 바꾼다. 처음 값은 none이다.' },
  'POST /api/communities/{id}/members': object({ userId: string(36), role: choice('viewer', 'editor') }, ['userId']),
  'POST /api/communities/{id}/join': object({ message: string(2000) }),
  'PUT /api/communities/{id}/join-requests/{userId}': object({ approved: boolean, reason: string(2000) }, ['approved']),
  'POST /api/communities/{id}/posts': ref('POSTCreate'), 'PUT /api/communities/{id}/posts/{postId}': ref('POSTUpdate'),
  'POST /api/communities/{id}/posts/{postId}/comments': ref('COMMENTCreate'),
  'PUT /api/communities/{id}/posts/{postId}/like': object({ liked: boolean }, ['liked']),
  'POST /api/communities/{id}/challenges': ref('CHALLENGECreate'),
  'POST /api/communities/{id}/challenges/{challengeId}/join': { ...object({ consent: boolean }), description: '기록 공개 챌린지(openRecords)는 consent=true여야 참여한다. 끝난 챌린지는 409.' },
  'PUT /api/communities/{id}/challenges/{challengeId}/checkins/{date}': { ...object({ sessionId: string(100) }), description: '본문 없이 보내면 직접 인증. sessionId는 내 실제 기록 중 실시간으로 시작·종료한 완료 기록(다른 계정·없는 기록은 404). 시간대가 없으면 기록 시작 날짜(사용자 하루 기준)가 인증 날짜와 같아야 하고, 시간대가 있으면 그 날짜의 시간대와 겹친 분이 minMinutes 이상이어야 한다. record 챌린지는 sessionId 필수. 같은 기록은 한 챌린지에서 한 번만 쓴다(409).' },
  'POST /api/communities/{id}/posts/{postId}/report': object({ reason: string() }, ['reason']),
  'PUT /api/admin/moderation/{id}': object({ userId: string(36), version: integer(1), action: choice('REMOVE', 'IGNORE') }, ['userId', 'version', 'action']),
  'PUT /api/routine-records/{id}/history/{date}': object({ completed: boolean, version: integer(1) }, ['completed']),
  'POST /api/settings': ref('SETTINGUpsert'), 'POST /api/settings/{section}': ref('SETTINGUpsert'), 'PUT /api/admin/settings': ref('SETTINGUpsert'),
  'PUT /api/user/profile': object({ nickname: string(80), timeZone: string(64), intro: string(), mode: choice('J', 'P', 'B'), dayStartHour: { ...integer(0, 6), description: '하루 경계 시각(정시). 기본 0. 통계·오늘의 날짜 배정에만 쓰고 저장된 시각은 바꾸지 않는다. intro·mode처럼 보내지 않으면 저장값에서 빠진다.' } }, ['nickname']),
  'PUT /api/user/password': object({ currentPassword: string(72), newPassword: { ...string(72), minLength: 8 } }, ['currentPassword', 'newPassword']),
  'POST /api/admin/users': object({ email: { type: 'string', format: 'email', maxLength: 200 }, nickname: string(80), password: { ...string(72), minLength: 8 }, role: choice('USER', 'ADMIN') }, ['email', 'nickname', 'password']),
  'PUT /api/admin/users/{id}': object({ nickname: string(80), role: choice('USER', 'ADMIN'), status: choice('ACTIVE', 'SUSPENDED', 'DELETED') }),
  'PUT /api/admin/tickets/{id}': object({ userId: string(36), version: integer(1), reply: string(20000), status: choice('OPEN', 'IN_PROGRESS', 'ANSWERED', 'HOLD') }, ['userId', 'version', 'status']),
  'POST /api/support/tickets': ref('TICKETCreate'), 'POST /api/reports/draft': object({ date, category: string() }, ['date']),
  'POST /api/reports/{reportKey}': ref('REPORTUpsert'), 'POST /api/diary/{date}': ref('DIARYDateUpsert'),
  'PUT /api/attachments/{id}/retention': object({ days: integer(0, 365) }, ['days']),
  'POST /api/insight/generate': object({ from: date, to: date, features: array(string()) }),
  'POST /api/billing/checkout': object({ planId: string(), returnUrl: string() }), 'POST /api/billing/cancel': object({ reason: string() }),
  'POST /api/settings/notifications/kakao/verify': object({ phone: string(), code: string(), consent: boolean }),
  'POST /api/cofocus/rooms': object({ title: string(), recordingConsent: boolean }),
}
const pageOf = items => object({ items: array(items), page: integer(0), size: integer(1, 100), total: integer(0) }, ['items', 'page', 'size', 'total'])
const flexible = properties => ({ type: 'object', properties, additionalProperties: true })
const instant = { type: 'string', format: 'date-time' }
const actualTimer = { mode: choice('pomodoro', 'countdown', 'stopwatch'), targetMinutes: integer(1, 1440), pauses: { type: 'array', maxItems: 100, items: object({ from: instant, to: instant }, ['from']), description: '서버 시각으로 찍은 일시정지 구간. 끝(to)이 없는 구간은 일시정지 중인 마지막 하나뿐이다. 기록 시간에서 뺀다.' } }
const actualFields = { title: string(200), startedAt: instant, endedAt: instant, timeZone: string(200), state: choice('RUNNING', 'PAUSED', 'COMPLETED'), elapsedSeconds: integer(0), finishKey: string(80), sourceKind: choice('task', 'schedule'), sourceId: string(100), ...actualTimer }
schemas.ActualRecording = object({ ...actualFields, id: string(100), version: integer(1), createdAt: instant, updatedAt: instant }, ['id', 'title', 'startedAt', 'timeZone', 'state', 'version', 'createdAt', 'updatedAt'])
schemas.ActualRecording.description = '서버가 시작·일시정지·재개 시각을 저장한다. 종료는 version·요청 식별자·시각으로 멱등 처리하며 일시정지를 뺀 초 단위로 집계한다. FOCUS나 planner_item에 같은 시간을 중복 생성하지 않는다. mode가 있는 기록(집중 타이머)은 통계의 집중 시간에도 센다.'
const backupTypes = ['DIARY', 'MEMO', 'DDAY', 'MONEY', 'REVIEW', 'FOCUS', 'ACTUAL_SESSION']
const actualBackup = object({ title: string(200), startedAt: instant, endedAt: instant, timeZone: string(200), state: { const: 'COMPLETED' }, elapsedSeconds: { ...integer(0, 3155760000), description: '일시정지를 뺀 초.' }, ...actualTimer }, ['title', 'startedAt', 'endedAt', 'timeZone', 'state', 'elapsedSeconds'])
schemas.BackupRecord = { oneOf: backupTypes.map(kind => object({ kind: { const: kind }, id: { ...string(100), pattern: '^[A-Za-z0-9_@-]+$' }, version: integer(1), data: kind === 'ACTUAL_SESSION' ? actualBackup : ref(kind + 'Create') }, ['kind', 'id', 'version', 'data'])) }
schemas.BackupAttachment = object({ id: string(100), name: string(200), sizeBytes: integer(1, 5242880), expiresAt: { type: ['string', 'null'], format: 'date-time' }, contentBase64: { type: 'string', maxLength: 8388608 }, sha256: { type: 'string', pattern: '^[a-f0-9]{64}$' } }, ['id', 'name', 'sizeBytes', 'expiresAt', 'contentBase64', 'sha256'])
schemas.BackupFile = object({ schemaVersion: { const: 1 }, backupId: string(80), exportedAt: instant, timeZone: { const: 'UTC' }, includedTypes: { type: 'array', items: choice(...backupTypes) }, excluded: array(string()), records: array(ref('BackupRecord')), attachments: { type: 'array', maxItems: 50, items: ref('BackupAttachment') }, checksum: { type: 'string', pattern: '^[a-f0-9]{64}$' } }, ['schemaVersion', 'backupId', 'exportedAt', 'timeZone', 'includedTypes', 'excluded', 'records', 'attachments', 'checksum'])
schemas.BackupFile.description = '전체 계정 백업이 아닌 7종 서버 기록·개인 첨부의 수동 백업. 최대 JSON 8 MiB, 기록 500개, 첨부 50개·총 5 MiB. checksum 제외 키를 재귀 정렬한 UTF-8 JSON의 SHA-256. 토큰·설정·공유 권한·진행 중 기록·만료/그룹 첨부 제외. 서명이나 파일 작성자 인증이 아니므로 입력·소유권 검사를 별도로 수행한다.'
schemas.BackupJob = flexible({ id: string(100), operation: choice('EXPORT', 'RESTORE'), state: choice('FILE_READY', 'PREVIEWED', 'COMPLETED'), recordCount: integer(0,500), attachmentCount: integer(0,50), finishedAt: instant, items: { type: 'array', maxItems: 550, items: flexible({ kind: string(), sourceId: string(100), targetId: string(100), action: choice('CREATE','SKIP'), title: string(), reason: string(), result: choice('CREATED','PRESERVED') }) } })
schemas.BackupJob.description = '인증 계정별 저장 작업. 미리보기 후 같은 파일로 복원하며 전체 트랜잭션 또는 롤백. 같은 파일의 완료 재시도는 저장된 결과를 반환한다. 기존 ID/회고 날짜는 건너뛰고 새 첨부 ID를 본문 링크에 반영한다.'
schemas.CategoryStats = object({ category: string(), plannedMinutes: integer(0), actualMinutes: integer(0) }, ['category', 'plannedMinutes', 'actualMinutes'])
schemas.TimeBlock = object({ id: { type: ['integer', 'string'] }, title: string(), date, minutes: integer(0), type: choice('EVENT', 'TASK', 'ROUTINE', 'DIARY', 'MEMO', 'ACTUAL') }, ['id', 'title', 'date', 'minutes', 'type'])
// 통계 수치마다 그 수치를 만든 원본 행. 목록의 분 합계가 수치와 같다(PR-10 6단계, UF-118)
schemas.StatSource = object({ kind: choice('schedule', 'planner', 'recording', 'focus'), id: string(), recordId: string(), title: string(), date, minutes: integer(0), category: string() }, ['kind', 'id', 'recordId', 'title', 'date', 'minutes', 'category'])
schemas.StatTaskSource = object({ kind: { const: 'task' }, id: string(), recordId: string(), title: string(), date: { type: ['string', 'null'], format: 'date' }, done: boolean }, ['kind', 'id', 'recordId', 'title', 'date', 'done'])
schemas.StatSources = object({ planned: array(ref('StatSource')), actual: array(ref('StatSource')), focus: array(ref('StatSource')), tasks: array(ref('StatTaskSource')) }, ['planned', 'actual', 'focus', 'tasks'])
schemas.Stats = object({ from: date, to: date, timeZone: string(64), dayStartHour: integer(0, 6), plannedMinutes: integer(0), actualMinutes: integer(0), focusMinutes: { ...integer(0), description: '집중 세션(FOCUS)과 집중 타이머(mode가 있는 실제 기록)의 분. 타이머 기록은 actualMinutes에도 들어가고, sources.focus에는 kind recording 행으로 온다.' }, completedTasks: integer(0), totalTasks: integer(0), categories: array(ref('CategoryStats')), timeBlocks: array(ref('TimeBlock')), focusSessions: array(ref('FOCUSResponse')), sources: ref('StatSources') }, ['from', 'to', 'timeZone', 'dayStartHour', 'plannedMinutes', 'actualMinutes', 'focusMinutes', 'completedTasks', 'totalTasks', 'categories', 'timeBlocks', 'focusSessions', 'sources'])
// ownerName은 목록에만 있다(PR-10 5단계)
schemas.Attachment = object({ id: string(), ownerId: string(), ownerName: string(), groupId: { type: ['string', 'null'] }, name: string(), sizeBytes: integer(1, 10485760), expiresAt: { type: ['string', 'null'], format: 'date-time' }, createdAt: { type: 'string', format: 'date-time' } }, ['id', 'ownerId', 'groupId', 'name', 'sizeBytes', 'expiresAt', 'createdAt'])
schemas.RoutineHistory = object({ routineId: string(), items: array(object({ date, completed: boolean, status: choice('done', 'missed', 'skipped', 'pending') }, ['date', 'completed', 'status'])), done: integer(0), total: integer(0), skipped: integer(0), rate: integer(0, 100), streak: integer(0), best: integer(0) }, ['routineId', 'items', 'done', 'total', 'skipped', 'rate', 'streak', 'best'])
schemas.RoutineHistory.description = 'total은 done과 missed 회차 수다. 쉬는 날(skipped)과 오늘·미래의 미완료 회차(pending)는 rate 분모에 넣지 않고 연속 기록을 끊지 않는다. 지난 미완료 회차(missed)만 연속 기록을 끊는다.'
schemas.POSTResponse.properties = { ...schemas.POSTResponse.properties, authorId: string(), name: string(), likes: integer(0), comments: integer(0), liked: boolean }
schemas.Profile = object({ id: string(), nickname: string(80), email: { type: 'string', format: 'email' }, timeZone: string(64), extra: flexible({ intro: string(), mode: choice('J', 'P', 'B'), dayStartHour: integer(0, 6) }) }, ['id', 'nickname', 'email', 'timeZone', 'extra'])
schemas.SharedOccurrence = { ...object({ ownerId: string(36), ownerName: string(80), level: choice('busy', 'title', 'detail'), startDate: date, endDate: date, startTime: string(5), endTime: string(5), title: string(200), body: string(20000), category: string(200), color: string(200) }, ['ownerId', 'ownerName', 'level', 'startDate', 'endDate', 'startTime', 'endTime']), description: '그룹 멤버가 고른 범위만큼만 담는다. busy는 시간만, title은 제목까지, detail은 내용·분류·색까지. 일정 ID는 어느 범위에도 없다.' }
const responseOverrides = {
  'PUT /api/share/groups/{id}/share-level': object({ groupId: string(100), level: choice('none', 'busy', 'title', 'detail') }, ['groupId', 'level']),
  'GET /api/share/groups/{id}/schedules': array(ref('SharedOccurrence')),
  'GET /api/share/groups/{id}/preview': array(ref('SharedOccurrence')),
  'GET /api/share/people': object({ id: string(36), nickname: string(80) }, ['id', 'nickname']),
  'GET /api/share/friends': array(object({ id: string(100), senderId: string(36), recipientId: string(36), status: choice('PENDING', 'ACCEPTED'), createdAt: instant, friendId: string(36), friendName: string(80) }, ['id', 'senderId', 'recipientId', 'status', 'createdAt', 'friendId', 'friendName'])),
  'GET /api/communities/{id}/members': array(object({ userId: string(36), role: choice('owner', 'editor', 'viewer'), status: { const: 'ACTIVE' }, message: string(2000), nickname: string(80) }, ['userId', 'role', 'status', 'nickname'])),
  'GET /api/communities/{id}/join-requests': { ...array(object({ userId: string(36), role: choice('viewer'), status: { const: 'PENDING' }, message: string(2000), nickname: string(80) }, ['userId', 'role', 'status', 'nickname'])), description: '승인을 기다리는 가입 신청. 방장만 부른다. 신청자는 DELETE /members/{자기 ID}로 승인 전에 신청을 취소할 수 있다.' },
  'GET /api/share/blocks': array(object({ userId: string(36), nickname: string(80) }, ['userId', 'nickname'])),
  'GET /api/share/groups/{id}/members': { ...array(object({ userId: string(36), role: choice('owner', 'editor', 'viewer'), status: choice('ACTIVE', 'INVITED'), message: string(2000), nickname: string(80) }, ['userId', 'role', 'status', 'nickname'])), description: '기본은 활성 멤버. status=invited면 아직 수락하지 않은 초대이고 방장만 부를 수 있다.' },
  'GET /api/record-links': array(object({ kind: choice('task', 'schedule', 'actual'), id: string(100), title: string(200), direction: choice('source', 'target') }, ['kind', 'id', 'title', 'direction'])),
  'POST /api/tasks/{taskId}/schedules': ref('SCHEDULEResponse'),
  'GET /api/planner/recordings': { type: 'array', items: ref('ActualRecording') },
  'GET /api/planner/recordings/current': object({ active: { anyOf: [ref('ActualRecording'), { type: 'null' }] }, serverTime: instant }, ['active', 'serverTime']),
  'GET /api/planner/recordings/{id}': ref('ActualRecording'), 'POST /api/planner/recordings/start': ref('ActualRecording'), 'POST /api/planner/recordings/{id}/finish': ref('ActualRecording'),
  'POST /api/planner/recordings/{id}/pause': ref('ActualRecording'), 'POST /api/planner/recordings/{id}/resume': ref('ActualRecording'),
  'GET /api/user/data/backup': ref('BackupFile'),
  'GET /api/user/data/backup/status': object({ lastExport: { anyOf: [ref('BackupJob'), { type: 'null' }] }, lastRestore: { anyOf: [ref('BackupJob'), { type: 'null' }] }, includedTypes: array(string()), excluded: array(string()) }, ['lastExport', 'lastRestore', 'includedTypes', 'excluded']),
  'POST /api/user/data/backup/preview': ref('BackupJob'), 'POST /api/user/data/backup/{jobId}/restore': ref('BackupJob'),
  'GET /api/diary/calendar': array(object({ date, count: integer(0) }, ['date', 'count'])),
  'GET /api/diary/{date}': pageOf(ref('DIARYResponse')), 'POST /api/diary/{date}': ref('DIARYResponse'),
  'GET /api/schedules/occurrences': array(flexible({ ...schemas.SCHEDULEResponse.properties, sourceId: string(), occurrenceKey: string(), overridden: boolean })),
  'GET /api/routine-records/{id}/history': ref('RoutineHistory'), 'PUT /api/routine-records/{id}/history/{date}': ref('ROUTINE_COMPLETIONResponse'),
  'GET /api/money/summary': object({ income: integer(0), expense: integer(0), balance: integer(), categories: { type: 'object', additionalProperties: integer(0) }, count: integer(0) }, ['income', 'expense', 'balance', 'categories', 'count']),
  'GET /api/stat/dashboard': ref('Stats'), 'GET /api/stat/plan-actual': ref('Stats'), 'GET /api/stat/focus': ref('Stats'), 'GET /api/stat/category': array(ref('CategoryStats')),
  'GET /api/home/summary': object({ date, planner: ref('PlannerViewResponse'), items: array(ref('PlannerItem')), stats: ref('Stats'), unreadNotifications: integer(0), schedules: array(ref('SCHEDULEResponse')), routineRecords: array(ref('ROUTINE_RECORDResponse')) }, ['date', 'planner', 'items', 'stats', 'unreadNotifications', 'schedules', 'routineRecords']),
  'GET /api/planner/reviews/{date}': ref('REVIEWResponse'), 'PUT /api/planner/reviews/{date}': ref('REVIEWResponse'),
  'GET /api/planner/canvas': flexible(schemas.BOARDResponse.properties), 'PUT /api/planner/canvas': ref('BOARDResponse'),
  'GET /api/work/wbs': object({ items: array(flexible({ ...schemas.WBSResponse.properties, rollupMd: { type: 'number' }, rollupProgress: integer(0,100) })), totalMd: { type: 'number' }, totalProgress: integer(0,100) }, ['items', 'totalMd', 'totalProgress']),
  'GET /api/work/wiki/{id}/history': array(ref('WIKIResponse')),
  'GET /api/work/resume': flexible({ ...schemas.RESUMEResponse.properties, version: integer(0) }), 'PUT /api/work/resume': ref('RESUMEResponse'),
  'POST /api/work/portfolio-links': object({ id: string(64), scope: { type: 'string', enum: ['public', 'link'] }, itemIds: array(string(100)), token: string(43), url: string(), expiresAt: { type: 'string', format: 'date-time' }, createdAt: { type: 'string', format: 'date-time' } }, ['id', 'scope', 'itemIds', 'token', 'url']),
  'GET /api/work/portfolio-links': { ...array(object({ id: string(64), scope: { type: 'string', enum: ['public', 'link'] }, itemIds: array(string(100)), token: string(43), expiresAt: { type: 'string', format: 'date-time' }, createdAt: { type: 'string', format: 'date-time' } }, ['id', 'scope', 'itemIds'])), description: '내가 만든 링크 중 열려 있는 것. token은 전체 공개(public)에만 있다.' },
  'GET /api/public/portfolios/{token}': object({ items: array(ref('PORTFOLIOCreate')), scope: { type: 'string', enum: ['public', 'link'] }, expiresAt: { type: 'string', format: 'date-time' } }, ['items', 'scope']),
  'GET /api/user/profile': ref('Profile'), 'PUT /api/user/profile': ref('Profile'),
  'GET /api/attachments': array(ref('Attachment')), 'POST /api/attachments': ref('Attachment'), 'PUT /api/attachments/{id}/retention': ref('Attachment'), 'POST /api/attachments/purge-expired': object({ deleted: integer(0) }, ['deleted']),
  'GET /api/search': pageOf(flexible({ id: string(), domain: string(), title: string(), body: string(20000), date })), 'GET /api/search/tags': array(object({ tag: string(), count: integer(0) }, ['tag', 'count'])),
  'GET /api/communities/{id}/posts': pageOf(ref('POSTResponse')), 'POST /api/communities/{id}/posts': ref('POSTResponse'), 'PUT /api/communities/{id}/posts/{postId}': ref('POSTResponse'),
  'GET /api/communities/{id}/posts/{postId}/comments': array(ref('COMMENTResponse')), 'POST /api/communities/{id}/posts/{postId}/comments': ref('COMMENTResponse'),
  'GET /api/communities/{id}/challenges': array(flexible({ ...schemas.CHALLENGEResponse.properties, members: integer(0), joined: boolean, myDays: integer(0), myLastDate: { anyOf: [date, { type: 'null' }] } })), 'POST /api/communities/{id}/challenges': ref('CHALLENGEResponse'),
  'GET /api/communities/{id}/challenges/{challengeId}/ranking': { ...array(object({ userId: string(), nickname: string(), doneDays: integer(0), verifiedDays: integer(0), rankingHidden: boolean }, ['userId', 'nickname', 'doneDays', 'verifiedDays'])), description: '참여 중이면서 커뮤니티 활성 회원인 사람. 인증 일수와 그중 실제 기록으로 확인한 일수만 집계하고 개인 기록은 집계하지 않는다. 서로 차단한 사람은 빠진다. 계정 설정 share-visibility의 rankingVisible이 false인 회원은 다른 회원의 응답에서 빠지고, 본인 응답에는 rankingHidden: true로 남는다(PR-19 UF-136).' },
  'GET /api/communities/{id}/challenges/{challengeId}/checkins': { ...array(ref('ChallengeCheckin')), description: 'userId로 한 사람만 고를 수 있다. 다른 참여자에게는 날짜·인증 방식만 보이고, 기록 제목·시각·분은 본인 것과 기록 공개 챌린지에 동의한 참여자 것만 담는다.' },
  'PUT /api/communities/{id}/challenges/{challengeId}/checkins/{date}': ref('ChallengeCheckin'),
  'GET /api/notifications': pageOf(ref('NOTIFICATIONResponse')), 'PUT /api/notifications/{id}/read': ref('NOTIFICATIONResponse'),
  'GET /api/integrations/capabilities': array(object({ feature: string(), available: { const: false }, status: { const: 'PROVIDER_REQUIRED' } }, ['feature', 'available', 'status'])),
  'GET /api/sync/status': object({ providers: array({}), conflicts: array({}), logs: array({}), available: { const: false } }, ['providers', 'conflicts', 'logs', 'available']),
  'GET /api/user/social-accounts': { type: 'array', maxItems: 0, items: {} },
}
schemas.ChallengeCheckin = object({ userId: string(36), nickname: string(), date, method: choice('self', 'record'), minutes: integer(0), startedAt: { type: 'string', format: 'date-time' }, endedAt: { type: 'string', format: 'date-time' }, title: string() }, ['userId', 'nickname', 'date', 'method'])
schemas.Error = object({ success: { const: false }, data: { type: 'null' }, message: { type: 'string' } }, ['success', 'data', 'message'])
const paths = {}, contract = []
const envelope = data => object({ success: { const: true }, data, message: { type: ['string', 'null'] } }, ['success', 'data', 'message'])
for (const operation of operations) {
  const key = operation.method + ' ' + operation.route
  const publicRoute = operation.public || operation.route === '/api/public/portfolios/{token}'
  const external = operation.controller === 'IntegrationController'
  const parameters = operation.parameters.filter(parameter => !['body', 'multipart'].includes(parameter.location)).map(parameter => ({ name: parameter.name, in: parameter.location, required: parameter.required, schema: { ...javaType(parameter.type), ...(parameter.default == null ? {} : { default: parameter.type === 'int' ? Number(parameter.default) : parameter.default }) } }))
  if (operation.controller === 'PlannerController') for (const parameter of parameters) if (parameter.name === 'version') parameter.schema.minimum = 1
  let request = custom[key]
  const resource = Object.entries(resources).find(([base]) => operation.route === base || operation.route === base + '/{id}')?.[1]
  if (!request && resource && ['POST', 'PUT'].includes(operation.method)) request = ref(resource + (operation.method === 'PUT' ? 'Update' : 'Create'))
  const body = operation.parameters.find(parameter => parameter.location === 'body')
  if (body && !request) {
    if (body.type.startsWith('Map')) throw Error('Map request lacks a contract: ' + key)
    request = javaType(body.type)
  }
  const multipart = operation.parameters.some(parameter => parameter.location === 'multipart')
  const requestBody = request ? { required: true, content: { 'application/json': { schema: request } } } : multipart ? { required: true, content: { 'multipart/form-data': { schema: object({ file: { type: 'string', format: 'binary', description: operation.controller === 'BackupController' ? 'schemaVersion=1인 백업 JSON. 최대 8 MiB. 미리보기와 같은 파일로만 복원.' : '첨부 최대 10 MiB. STT는 제공자 미설정.' } }, ['file']) } } } : undefined
  let data = operation.responseType === 'void' ? {} : javaType(operation.responseType)
  if (resource && operation.responseType === '?') data = operation.method === 'GET' && operation.route === Object.keys(resources).find(base => resources[base] === resource) ? object({ items: array(ref(resource + 'Response')), page: integer(0), size: integer(1, 100), total: integer(0) }, ['items', 'page', 'size', 'total']) : ref(resource + 'Response')
  data = responseOverrides[key] ?? data
  if (operation.controller === 'SettingsController' && operation.method !== 'DELETE') data = flexible({ ...schemas.SETTINGResponse.properties, version: integer(0) })
  const binary = key === 'GET /api/attachments/{id}/download'
  const sse = operation.responseType === 'SseEmitter'
  const unavailable = external && operation.method !== 'GET'
  const responses = {}
  if (!unavailable) responses[operation.status] = operation.status === 204 ? { description: '본문 없음.' } : { description: external ? '미연결 상태. 연동 성공이 아님.' : '성공. 세부 정책은 README와 기능 규약을 따른다.', content: { [binary ? 'application/octet-stream' : sse ? 'text/event-stream' : 'application/json']: { schema: binary || sse ? { type: 'string', ...(binary ? { format: 'binary' } : {}) } : envelope(data) } } }
  for (const status of ['400', ...(publicRoute ? [] : ['401', '403']), '404', '409', ...(external || operation.controller === 'SettingsController' ? ['503'] : [])]) responses[status] = { description: ({ 400: '입력 검증 오류.', 401: '인증 필요 또는 폐기된 토큰.', 403: '역할·회원 권한 부족.', 404: '없음·타인 리소스·만료.', 409: '버전·현재 상태 충돌.', 503: '외부 제공자 및 어댑터 미설정.' })[status], content: { 'application/json': { schema: ref('Error') } } }
  const specification = { operationId: operation.controller + '_' + operation.method.toLowerCase() + '_' + operation.route.replace(/[^A-Za-z0-9]/g, '_'), tags: [operation.controller], summary: key, security: publicRoute ? [] : [{ bearerAuth: [] }], parameters, ...(requestBody ? { requestBody } : {}), responses, 'x-implementation-status': operation.implementationStatus, 'x-source': operation.controller + '.java', 'x-admin-required': operation.route.startsWith('/api/admin/'), 'x-test-evidence': 'verification.md' }
  ;(paths[operation.route] ??= {})[operation.method.toLowerCase()] = specification
  contract.push({ ...operation, public: publicRoute, requestSchema: request, responseSchema: data, externalBoundary: external })
}
const openapi = { openapi: '3.1.0', info: { title: 'Timeflow 프런트엔드 기능 API', version: '2026-10-10', description: '실제 /api 컨트롤러 기준. 서비스 연결은 모든 경로의 실 DB 검증을 뜻하지 않는다. 외부 제공자 실행은 503. 설정 wildcard는 허용된 섹션만 사용한다.' }, servers: [{ url: 'http://localhost:8080' }], paths, components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } }, schemas } }
const rows = contract.map(operation => `| ${operation.method} | \`${operation.route}\` | ${operation.public ? '공개' : operation.route.startsWith('/api/admin/') ? 'JWT + ADMIN' : 'JWT'} | ${operation.externalBoundary ? '외부 연동 경계' : '실제 처리 소스 있음'} | ${operation.controller} |`).join('\n')
const catalog = `# API 목록\n\n기준 2026-10-10. 총 ${contract.length}개 매핑이며 wildcard 경로는 허용된 값을 선택한다. 채팅은 CHAT_ENABLED=true 조건부 등록이다. 구현·검증 범위는 [검증 기록](verification.md)을 확인한다.\n\n| 메서드 | 경로 | 인증 | 처리 | 소스 |\n|---|---|---|---|---|\n${rows}\n`
function resolve(schema) { return schema?.$ref ? schemas[schema.$ref.split('/').at(-1)] : schema }
function typeLabel(schema) { if (schema?.anyOf) return schema.anyOf.map(typeLabel).join(' 또는 '); return schema?.$ref?.split('/').at(-1) ?? schema?.type ?? (schema?.oneOf ? 'object 또는 array' : 'JSON') }
let specification = '# API 상세 명세\n\n공통 응답·동시성·시간·기능별 동작은 [기능 규약](README.md)을 따른다. 아래 요청 필드는 실제 컨트롤러·FeatureInput·Java DTO에서 생성하며 조건부 검증은 각 schema 설명과 규약을 함께 적용한다. 예전 /api/v1 목표 계약과 혼용하지 않는다.\n'
for (const operation of contract) {
  const schema = resolve(operation.requestSchema)
  specification += `\n## ${operation.method} ${operation.route}\n\n인증은 ${operation.public ? '공개' : operation.route.startsWith('/api/admin/') ? 'JWT + ADMIN' : 'JWT'}이며 소스는 ${operation.controller}.java다. ${operation.externalBoundary ? '제공자 연동 경계. 실행 요청은 503이며 조회는 미연결 상태를 반환한다.' : `성공 HTTP는 ${operation.status}다.`}\n`
  if (operation.parameters.filter(parameter => !['body', 'multipart'].includes(parameter.location)).length) specification += '\n| 위치 | 이름 | 타입 | 필수 | 기본값 |\n|---|---|---|---|---|\n' + operation.parameters.filter(parameter => !['body', 'multipart'].includes(parameter.location)).map(parameter => `| ${parameter.location} | ${parameter.name} | ${parameter.type} | ${parameter.required ? '예' : '아니오'} | ${parameter.default ?? '없음'} |`).join('\n') + '\n'
  if (schema?.properties) specification += '\n| 본문 필드 | 타입 | 필수 | 제약 |\n|---|---|---|---|\n' + Object.entries(schema.properties).map(([field, definition]) => `| ${field} | ${typeLabel(definition)} | ${schema.required?.includes(field) ? '예' : '아니오'} | ${[definition.format, definition.enum?.join('/'), definition.minimum != null ? '최소 ' + definition.minimum : '', definition.maximum != null ? '최대 ' + definition.maximum : '', definition.maxLength ? '길이 ≤ ' + definition.maxLength : '', definition.description].filter(Boolean).join(' · ') || '기능 규약 참조'} |`).join('\n') + '\n'
  if (schema?.description) specification += '\n' + schema.description + '\n'
  if (operation.parameters.some(parameter => parameter.location === 'multipart')) specification += '\nfile을 multipart/form-data로 전달한다. boundary는 HTTP 클라이언트가 지정한다.\n'
  specification += '\n응답 schema는 OpenAPI의 해당 operation을 확인한다. 오류는 HTTP 상태와 `{success:false,data:null,message}`로 구분한다. 내부 ErrorCode 이름은 JSON에 포함되지 않는다.\n'
}
const missing = new Set()
function validateReferences(value) { if (value && typeof value === 'object') { if (value.$ref && !schemas[value.$ref.split('/').at(-1)]) missing.add(value.$ref); Object.values(value).forEach(validateReferences) } }
validateReferences(openapi)
if (missing.size) throw Error('Unresolved OpenAPI schemas: ' + [...missing].join(', '))
const outputs = { 'catalog.md': catalog, 'specification.md': specification, 'openapi.json': JSON.stringify(openapi, null, 2) + '\n', 'operations.json': JSON.stringify(contract, null, 2) + '\n' }
for (const [name, value] of Object.entries(outputs)) {
  const target = path.join(root, destination, name)
  if (process.argv.includes('--check')) { if (readFileSync(target, 'utf8') !== value) throw Error('Contract differs from source: ' + name) }
  else writeFileSync(target, value, 'utf8')
}
console.log(`${process.argv.includes('--check') ? 'Verified' : 'Generated'} ${contract.length} operations and ${Object.keys(schemas).length} schemas`)
