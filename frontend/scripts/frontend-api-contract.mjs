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
schemas.Recurrence = object({ frequency: choice('none', 'daily', 'weekly', 'monthly', 'yearly'), interval: integer(1, 99), weekdays: array(integer(0, 6)), endMode: choice('never', 'until', 'count'), until: { type: 'string', description: 'endMode=until이면 유효한 YYYY-MM-DD. 그 외 빈 문자열 허용.' }, count: integer(1, 999) }, ['frequency'])
schemas.Recurrence.description = 'frequency=none 외에는 interval/endMode가 필수. weekly는 weekdays 최소 1개. until 종료는 시작일 이상. count 종료는 count 필수. 존재하지 않는 월말·윤년 회차는 건너뛴다.'
schemas.Goal = object({ count: integer(1, 9999), unit: string() }, ['count', 'unit'])
schemas.TemplateBlock = object({ time: { type: 'string', pattern: '^(?:[01][0-9]|2[0-3]):[0-5][0-9]$' }, title: string(), duration: integer(1, 1440) }, ['time', 'title'])
schemas.BoardColumn = object({ id: string(), title: string(), wip: integer(0, 500) }, ['id', 'title', 'wip'])
schemas.BoardCard = object({ id: string(), columnId: string(), title: string(), assignee: string(), due: { type: 'string' }, priority: choice('low', 'normal', 'high'), labels: array(string()), checklist: array(object({ text: string(), done: boolean }, ['text', 'done'])), plannerBlock: string(), order: integer(0, 10000) }, ['id', 'columnId', 'title', 'priority', 'order'])
const booleans = new Set('pinned actionable open favorite read live published popup paused notify completed'.split(' '))
const numbers = { amount: integer(-1e12, 1e12), duration: integer(1, 1440), alarm: integer(0, 10080), leaveDays: { type: 'number', minimum: 0.5, maximum: 365, multipleOf: 0.5 }, expense: { type: 'number', minimum: 0, maximum: 1e8 }, md: { type: 'number', minimum: 0, maximum: 100000 }, progress: { type: 'number', minimum: 0, maximum: 100 }, years: integer(0, 100), days: integer(3, 100), capacity: integer(2, 500), reminderMinutes: integer(0, 1440) }
const arrays = { tags: array(string()), achievements: array(string()), notifyDays: array(integer(0, 365)), attendeeIds: array(string(36)), itemIds: array(string(100)), blocks: array(ref('TemplateBlock')), columns: array(ref('BoardColumn')), cards: array(ref('BoardCard')) }
const featureSource = java.find(source => source.includes('public enum FeatureType'))
for (const match of featureSource.matchAll(/(\w+)\("([^"]*)",\s*"([^"]*)"\)/g)) {
  const [_, name, fields, required] = match
  const properties = {}
  for (const field of fields.split(' ')) {
    properties[field] = booleans.has(field) ? boolean : numbers[field] ?? arrays[field] ?? (['date', 'startDate', 'endDate', 'from', 'to', 'deadline'].includes(field) ? date : ['startedAt', 'endedAt'].includes(field) ? { type: 'string', format: 'date-time' } : field === 'value' ? { oneOf: [{ type: 'object', additionalProperties: true }, { type: 'array', items: {} }] } : field === 'recurrence' ? ref('Recurrence') : field === 'goal' ? ref('Goal') : string(['body', 'handover'].includes(field) ? 20000 : 200))
  }
  if (name === 'ROUTINE_RECORD') properties.days = { ...array(integer(0, 6)), minItems: 1 }
  if (name === 'FOCUS') properties.mode = choice('pomodoro', 'stopwatch', 'free')
  if (name === 'MONEY') properties.type = choice('in', 'out')
  if (name === 'WORK_RECORD') { properties.type = choice('연차', '반차', '외근', '출장', '이직'); properties.half = choice('오전', '오후') }
  if (name === 'COMMUNITY') { properties.joinPolicy = choice('open', 'approval'); properties.visibility = choice('public', 'private') }
  for (const field of required.split(' ')) if (properties[field]?.type === 'string') properties[field] = { ...properties[field], minLength: 1 }
  for (const [field, definition] of Object.entries(properties)) if (!required.split(' ').includes(field)) properties[field] = { anyOf: [definition, { type: 'null' }] }
  schemas[name + 'Create'] = object(properties, required.split(' '))
  schemas[name + 'Update'] = object({ ...properties, version: integer(1) }, [...required.split(' '), 'version'])
  schemas[name + 'Upsert'] = object({ ...properties, version: integer(1) }, required.split(' '))
  schemas[name + 'Response'] = { type: 'object', properties: { ...properties, id: string(100), version: integer(1), createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' } }, additionalProperties: true }
}
schemas.MONEYCreate.description = 'KRW 정수. type=in은 양수, out은 음수. 0은 거부한다.'
schemas.WORK_RECORDCreate.description = '종료 일시는 시작 이후. 반차는 같은 날짜와 half 필수. 연차는 leaveDays 0.5일 단위. 외근·출장은 location, 출장은 expense, 이직은 toCompany/role 필수.'
schemas.SCHEDULECreate.description = '종료 일시는 시작 이후, 최대 366일. 참석자 ID는 메타데이터이며 공유 권한을 만들지 않는다.'
schemas.SETTINGCreate.description = 'JSON 최대 깊이 8, 객체 100필드, 배열 500항목, 저장 크기 128 KiB. apiKey/password/secret/cardNumber/accessToken/refreshToken은 중첩 위치에서도 거부한다. 자동화·AI 설정 저장은 실행을 의미하지 않는다.'

for (const [name, schema] of Object.entries(schemas)) if (name.endsWith('Create') && schema.description) for (const suffix of ['Update', 'Upsert']) schemas[name.slice(0, -6) + suffix].description = schema.description
for (const name of ['DIARY', 'REVIEW']) { schemas[name + 'DateUpsert'] = object(schemas[name + 'Upsert'].properties, schemas[name + 'Upsert'].required.filter(field => field !== 'date')) }
const resources = { '/api/schedules': 'SCHEDULE', '/api/routine-records': 'ROUTINE_RECORD', '/api/diaries': 'DIARY', '/api/memos': 'MEMO', '/api/ddays': 'DDAY', '/api/money/entries': 'MONEY', '/api/focus/sessions': 'FOCUS', '/api/events/templates': 'EVENT_TEMPLATE', '/api/planner/templates': 'PLANNER_TEMPLATE', '/api/work/records': 'WORK_RECORD', '/api/work/wiki': 'WIKI', '/api/work/wbs/nodes': 'WBS', '/api/work/career/projects': 'CAREER', '/api/work/portfolio': 'PORTFOLIO', '/api/contacts': 'CONTACT', '/api/share/groups': 'GROUP', '/api/communities': 'COMMUNITY', '/api/admin/content': 'CONTENT', '/api/admin/notices': 'NOTICE' }
const custom = {
  'POST /api/memos/{id}/convert-to-task': object({ version: integer(1), due: date, category: string() }, ['version']),
  'POST /api/events/templates/{id}/apply': object({ date, startTime: string(5) }, ['date', 'startTime']),
  'POST /api/planner/templates/{id}/apply': object({ date }, ['date']),
  'PUT /api/planner/reviews/{date}': ref('REVIEWDateUpsert'), 'PUT /api/planner/canvas': ref('BOARDUpsert'), 'PUT /api/work/resume': ref('RESUMEUpsert'),
  'POST /api/work/portfolio-links': ref('PORTFOLIO_LINKCreate'),
  'POST /api/share/friends/invite': object({ userId: string(36) }, ['userId']),
  'POST /api/share/groups/{id}/members': object({ userId: string(36), role: choice('viewer', 'editor') }, ['userId']),
  'POST /api/communities/{id}/members': object({ userId: string(36), role: choice('viewer', 'editor') }, ['userId']),
  'POST /api/communities/{id}/join': object({ message: string(2000) }),
  'PUT /api/communities/{id}/join-requests/{userId}': object({ approved: boolean, reason: string(2000) }, ['approved']),
  'POST /api/communities/{id}/posts': ref('POSTCreate'), 'PUT /api/communities/{id}/posts/{postId}': ref('POSTUpdate'),
  'POST /api/communities/{id}/posts/{postId}/comments': ref('COMMENTCreate'),
  'PUT /api/communities/{id}/posts/{postId}/like': object({ liked: boolean }, ['liked']),
  'POST /api/communities/{id}/challenges': ref('CHALLENGECreate'),
  'POST /api/communities/{id}/posts/{postId}/report': object({ reason: string() }, ['reason']),
  'PUT /api/admin/moderation/{id}': object({ userId: string(36), version: integer(1), action: choice('REMOVE', 'IGNORE') }, ['userId', 'version', 'action']),
  'PUT /api/routine-records/{id}/history/{date}': object({ completed: boolean, version: integer(1) }, ['completed']),
  'POST /api/settings': ref('SETTINGUpsert'), 'POST /api/settings/{section}': ref('SETTINGUpsert'), 'PUT /api/admin/settings': ref('SETTINGUpsert'),
  'PUT /api/user/profile': object({ nickname: string(80), timeZone: string(64), intro: string(), mode: choice('J', 'P', 'B') }, ['nickname']),
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
schemas.CategoryStats = object({ category: string(), plannedMinutes: integer(0), actualMinutes: integer(0) }, ['category', 'plannedMinutes', 'actualMinutes'])
schemas.TimeBlock = object({ id: { type: ['integer', 'string'] }, title: string(), date, minutes: integer(0), type: choice('EVENT', 'TASK', 'ROUTINE', 'DIARY', 'MEMO', 'ACTUAL') }, ['id', 'title', 'date', 'minutes', 'type'])
schemas.Stats = object({ from: date, to: date, plannedMinutes: integer(0), actualMinutes: integer(0), focusMinutes: integer(0), completedTasks: integer(0), totalTasks: integer(0), categories: array(ref('CategoryStats')), timeBlocks: array(ref('TimeBlock')), focusSessions: array(ref('FOCUSResponse')) }, ['from', 'to', 'plannedMinutes', 'actualMinutes', 'focusMinutes', 'completedTasks', 'totalTasks', 'categories', 'timeBlocks', 'focusSessions'])
schemas.Attachment = object({ id: string(), ownerId: string(), groupId: { type: ['string', 'null'] }, name: string(), sizeBytes: integer(1, 10485760), expiresAt: { type: ['string', 'null'], format: 'date-time' } }, ['id', 'ownerId', 'groupId', 'name', 'sizeBytes', 'expiresAt'])
schemas.RoutineHistory = object({ routineId: string(), items: array(object({ date, completed: boolean }, ['date', 'completed'])), done: integer(0), total: integer(0), rate: integer(0, 100), streak: integer(0), best: integer(0) }, ['routineId', 'items', 'done', 'total', 'rate', 'streak', 'best'])
schemas.POSTResponse.properties = { ...schemas.POSTResponse.properties, authorId: string(), name: string(), likes: integer(0), comments: integer(0), liked: boolean }
schemas.Profile = object({ id: string(), nickname: string(80), email: { type: 'string', format: 'email' }, timeZone: string(64), extra: flexible({ intro: string(), mode: choice('J', 'P', 'B') }) }, ['id', 'nickname', 'email', 'timeZone', 'extra'])
const responseOverrides = {
  'GET /api/diary/calendar': array(object({ date, count: integer(0) }, ['date', 'count'])),
  'GET /api/diary/{date}': pageOf(ref('DIARYResponse')), 'POST /api/diary/{date}': ref('DIARYResponse'),
  'GET /api/schedules/occurrences': array(flexible({ ...schemas.SCHEDULEResponse.properties, sourceId: string(), occurrenceKey: string() })),
  'GET /api/routine-records/{id}/history': ref('RoutineHistory'), 'PUT /api/routine-records/{id}/history/{date}': ref('ROUTINE_COMPLETIONResponse'),
  'GET /api/money/summary': object({ income: integer(0), expense: integer(0), balance: integer(), categories: { type: 'object', additionalProperties: integer(0) }, count: integer(0) }, ['income', 'expense', 'balance', 'categories', 'count']),
  'GET /api/stat/dashboard': ref('Stats'), 'GET /api/stat/plan-actual': ref('Stats'), 'GET /api/stat/focus': ref('Stats'), 'GET /api/stat/category': array(ref('CategoryStats')),
  'GET /api/home/summary': object({ date, planner: ref('PlannerViewResponse'), items: array(ref('PlannerItem')), stats: ref('Stats'), unreadNotifications: integer(0), schedules: array(ref('SCHEDULEResponse')), routineRecords: array(ref('ROUTINE_RECORDResponse')) }, ['date', 'planner', 'items', 'stats', 'unreadNotifications', 'schedules', 'routineRecords']),
  'GET /api/planner/reviews/{date}': ref('REVIEWResponse'), 'PUT /api/planner/reviews/{date}': ref('REVIEWResponse'),
  'GET /api/planner/canvas': flexible(schemas.BOARDResponse.properties), 'PUT /api/planner/canvas': ref('BOARDResponse'),
  'GET /api/work/wbs': object({ items: array(flexible({ ...schemas.WBSResponse.properties, rollupMd: { type: 'number' }, rollupProgress: integer(0,100) })), totalMd: { type: 'number' }, totalProgress: integer(0,100) }, ['items', 'totalMd', 'totalProgress']),
  'GET /api/work/wiki/{id}/history': array(ref('WIKIResponse')),
  'GET /api/work/resume': flexible({ ...schemas.RESUMEResponse.properties, version: integer(0) }), 'PUT /api/work/resume': ref('RESUMEResponse'),
  'POST /api/work/portfolio-links': object({ id: string(64), token: string(43), url: string(), expiresAt: { type: 'string', format: 'date-time' } }, ['id', 'token', 'url', 'expiresAt']),
  'GET /api/public/portfolios/{token}': object({ items: array(ref('PORTFOLIOCreate')) }, ['items']),
  'GET /api/user/profile': ref('Profile'), 'PUT /api/user/profile': ref('Profile'),
  'GET /api/attachments': array(ref('Attachment')), 'POST /api/attachments': ref('Attachment'), 'PUT /api/attachments/{id}/retention': ref('Attachment'), 'POST /api/attachments/purge-expired': object({ deleted: integer(0) }, ['deleted']),
  'GET /api/search': pageOf(flexible({ id: string(), domain: string(), title: string(), body: string(20000), date })), 'GET /api/search/tags': array(object({ tag: string(), count: integer(0) }, ['tag', 'count'])),
  'GET /api/communities/{id}/posts': pageOf(ref('POSTResponse')), 'POST /api/communities/{id}/posts': ref('POSTResponse'), 'PUT /api/communities/{id}/posts/{postId}': ref('POSTResponse'),
  'GET /api/communities/{id}/posts/{postId}/comments': array(ref('COMMENTResponse')), 'POST /api/communities/{id}/posts/{postId}/comments': ref('COMMENTResponse'),
  'GET /api/communities/{id}/challenges': array(ref('CHALLENGEResponse')), 'POST /api/communities/{id}/challenges': ref('CHALLENGEResponse'),
  'GET /api/communities/{id}/challenges/{challengeId}/ranking': array(object({ userId: string(), doneDays: integer(0) }, ['userId', 'doneDays'])),
  'GET /api/notifications': pageOf(ref('NOTIFICATIONResponse')), 'PUT /api/notifications/{id}/read': ref('NOTIFICATIONResponse'),
  'GET /api/integrations/capabilities': array(object({ feature: string(), available: { const: false }, status: { const: 'PROVIDER_REQUIRED' } }, ['feature', 'available', 'status'])),
  'GET /api/sync/status': object({ providers: array({}), conflicts: array({}), logs: array({}), available: { const: false } }, ['providers', 'conflicts', 'logs', 'available']),
  'GET /api/user/social-accounts': { type: 'array', maxItems: 0, items: {} },
}
schemas.Error = object({ success: { const: false }, data: { type: 'null' }, message: { type: 'string' } }, ['success', 'data', 'message'])
const paths = {}, contract = []
const envelope = data => object({ success: { const: true }, data, message: { type: ['string', 'null'] } }, ['success', 'data', 'message'])
for (const operation of operations) {
  const key = operation.method + ' ' + operation.route
  const publicRoute = operation.public || operation.route === '/api/public/portfolios/{token}'
  const external = operation.controller === 'IntegrationController'
  const parameters = operation.parameters.filter(parameter => !['body', 'multipart'].includes(parameter.location)).map(parameter => ({ name: parameter.name, in: parameter.location, required: parameter.required, schema: { ...javaType(parameter.type), ...(parameter.default == null ? {} : { default: parameter.type === 'int' ? Number(parameter.default) : parameter.default }) } }))
  let request = custom[key]
  const resource = Object.entries(resources).find(([base]) => operation.route === base || operation.route === base + '/{id}')?.[1]
  if (!request && resource && ['POST', 'PUT'].includes(operation.method)) request = ref(resource + (operation.method === 'PUT' ? 'Update' : 'Create'))
  const body = operation.parameters.find(parameter => parameter.location === 'body')
  if (body && !request) {
    if (body.type.startsWith('Map')) throw Error('Map request lacks a contract: ' + key)
    request = javaType(body.type)
  }
  const multipart = operation.parameters.some(parameter => parameter.location === 'multipart')
  const requestBody = request ? { required: true, content: { 'application/json': { schema: request } } } : multipart ? { required: true, content: { 'multipart/form-data': { schema: object({ file: { type: 'string', format: 'binary', description: '첨부 최대 10 MiB. STT는 제공자 미설정.' } }, ['file']) } } } : undefined
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
