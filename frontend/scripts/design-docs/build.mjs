import { readFileSync, readdirSync, mkdirSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { schemas, helpers } from './model.mjs'
import { endpoints, groups, domainRules } from './endpoints.mjs'
import { generateCurrent } from './current.mjs'
import { generateDatabase } from './database.mjs'
const root = path.resolve(process.argv[2] ?? fileURLToPath(new URL('../../../', import.meta.url)))
if (!existsSync(path.join(root,'backend/src/main/java/kr/timebar/diary'))) throw Error('Expected Timeflow project root')
const check=process.argv.includes('--check')
const written=[]
export function output(relative, text) {
  const target=path.resolve(root,relative)
  if(!target.startsWith(path.join(root,'docs')+path.sep)) throw Error('Only documentation output is allowed')
  const value=text.replace(/\r\n/g,'\n').trimEnd()+'\n'
  if(check) { if(!existsSync(target)||readFileSync(target,'utf8')!==value) throw Error('Stale generated document: '+relative) }
  else { mkdirSync(path.dirname(target),{recursive:true}); writeFileSync(target,value,'utf8') }
  written.push(relative)
}
const {ref,arr,str,num,bool,nullable}=helpers
const json=value=>JSON.stringify(value,null,2)
const cell=value=>String(value??'—').replaceAll('|','&#124;').replaceAll('\n',' ')
const resolve=s=>s?.$ref?schemas[s.$ref.split('/').at(-1)]:s
export function example(s) {
  s=resolve(s)
  if(!s) throw Error('Missing schema')
  if(s.example!==undefined) return s.example
  if(s.anyOf && !s.type) return example(s.anyOf[0])
  if(s.type==='object') return Object.fromEntries(Object.entries(s.properties??{}).map(([k,v])=>[k,example(v)]))
  if(s.type==='array') return [example(s.items)]
  if(s.type==='null') return null
  if(s.const!==undefined) return s.const
  return s.enum?.[0]??(s.type==='boolean'?false:s.type==='integer'||s.type==='number'?s.minimum??0:'example')
}
function shape(s) {
  if(s.$ref) return s.$ref.split('/').at(-1)
  if(s.anyOf) return s.anyOf.map(shape).join(' / ')
  if(s.type==='array') return shape(s.items)+'[]'
  return s.format?`${s.type} (${s.format})`:s.type??'object'
}
function limits(s) {
  if(s.$ref) return ''
  return [s.enum&&'허용: '+s.enum.join(', '),s.minLength!==undefined&&'최소 '+s.minLength+'자',s.maxLength!==undefined&&'최대 '+s.maxLength+'자',s.minimum!==undefined&&'최소 '+s.minimum,s.maximum!==undefined&&'최대 '+s.maximum,s.maxItems!==undefined&&'최대 '+s.maxItems+'개',s.uniqueItems&&'중복 불가',s.pattern&&'정규식 '+s.pattern,s.default!==undefined&&'기본 '+s.default].filter(Boolean).join('; ')
}
function fields(s,prefix='',depth=0) {
  s=resolve(s);if(depth>7) throw Error('Unexpected deep schema')
  if(s.type==='array') return fields(s.items,prefix+'[]',depth+1)
  return Object.entries(s.properties??{}).flatMap(([key,value])=>{
    const name=prefix?prefix+'.'+key:key,v=resolve(value)
    const row=`| ${name} | ${shape(value)} | ${s.required?.includes(key)?'필수':'선택'} | ${cell(value.description??v.description??'하위 구조 참조')} ${cell(limits(value))} |`
    return [row,...(v.type==='object'||v.type==='array'?fields(v,name,depth+1):[])]
  })
}
const fieldTable=s=>'| 필드 | 타입 | 필수 여부 | 의미·제약 |\n|---|---|---|---|\n'+fields(s).join('\n')
const errorCatalog={
  VALIDATION_FAILED:[400,'형식·필수 파라미터·알 수 없는 필드가 잘못됨','error.fields의 path에 해당하는 입력을 수정 후 재요청'],
  TOKEN_INVALID:[401,'인증 누락·서명 오류·폐기된 세션','세션을 확인하고 다시 로그인; 토큰을 로그에 남기지 않음'],
  TOKEN_EXPIRED:[401,'access token 만료','refresh 1회만 시도; refresh도 실패하면 로그인'],
  INVALID_CREDENTIALS:[401,'이메일 또는 비밀번호 불일치','입력 확인; 어떤 항목이 틀렸는지 노출하지 않음'],
  FORBIDDEN:[403,'ADMIN·OWNER·멤버십 등 기능 권한 부족','승인된 권한을 확인; 같은 요청 자동 재시도 금지'],
  CSRF_REJECTED:[403,'Origin/CSRF token 불일치','등록된 브라우저 origin 및 CSRF 쿠키/헤더를 갱신'],
  NOT_FOUND:[404,'대상 없음 또는 다른 사람의 비공개 리소스','ID와 접근권한을 확인; 존재 여부 추측 금지'],
  DUPLICATE_EMAIL:[409,'정규화 이메일 중복','로그인/비밀번호 재설정 안내; 공개 메시지는 과도한 정보 제외'],
  IDEMPOTENCY_CONFLICT:[409,'같은 멱등키에 다른 요청 본문','동일 요청은 원래 키, 새 의도는 새 UUID 사용'],
  TIME_OVERLAP:[409,'ACTUAL 블록이 기존 실제 시간과 겹침','허용된 충돌 ID의 시간을 조회하고 조정'],
  MEMBERSHIP_REQUIRED:[403,'승인된 커뮤니티 회원이 아님','가입/승인 후 새로 조회; 클라이언트 표시만으로 우회 금지'],
  CAPACITY_EXCEEDED:[409,'커뮤니티 정원 초과','모집 상태 재조회; 다른 커뮤니티 선택'],
  OWNER_REQUIRED:[409,'마지막 소유자 탈퇴·제거 시도','소유권 이전 또는 그룹 삭제 정책 적용'],
  HAS_CHILDREN:[409,'WBS에 하위 작업이 있음','하위 작업 이동/삭제 후 다시 요청'],
  STATE_CONFLICT:[409,'진행중 챌린지 기간 변경·상위 WBS 공수 수정 등 상태 충돌','최신 상태를 조회하고 허용된 항목만 변경'],
  SYNC_RESET_REQUIRED:[410,'변경 커서 보관기간 30일 경과','전체 스냅샷 재동기화; 미전송 로컬 변경은 별도 보존'],
  VERSION_CONFLICT:[412,'If-Match와 현재 버전 불일치','최신 GET 후 변경 비교·사용자 확인; 자동 덮어쓰기 금지'],
  PRECONDITION_REQUIRED:[428,'필수 If-Match 또는 If-None-Match 누락','GET의 ETag 또는 신규 생성 * 전송'],
  INVALID_RANGE:[422,'종료<=시작, 날짜 범위 초과, 잘못된 조건 조합','해당 지역 시간과 타입별 필수 필드 확인'],
  CONTENT_TOO_LARGE:[413,'목적별 본문/파일 크기 상한 초과','크기를 줄이거나 분할 업로드'],
  UNSUPPORTED_MEDIA:[415,'Content-Type/MIME 불허','허용 MIME 및 요청 Content-Type 사용'],
  RATE_LIMITED:[429,'계정/IP/기기별 제한','Retry-After 이후 jitter를 포함해 제한적 재시도'],
  UPSTREAM_UNAVAILABLE:[503,'메일·푸시·AI·외부 캘린더 일시 장애','작업 상태 조회; 서버는 outbox 재시도, 중복 제출 금지'],
  INTERNAL_ERROR:[500,'예상하지 못한 서버 오류','requestId로 운영자 문의; 쓰기 재시도는 멱등키 유지'],
}
schemas.Meta={type:'object',additionalProperties:false,properties:{requestId:str('추적 ID','req-example'),serverTime:str('서버 UTC','2026-09-26T00:00:00Z',{format:'date-time'})},required:['requestId','serverTime']}
schemas.ErrorField={type:'object',additionalProperties:false,properties:{path:str('오류 필드 JSON path','endAt'),reason:str('수정 안내','시작보다 늦은 시각을 입력해주세요.')},required:['path','reason']}
schemas.ErrorDetail={type:'object',additionalProperties:false,properties:{code:str('안정된 기계 판독 코드','INVALID_RANGE'),fields:arr('입력 오류 위치',ref('ErrorField'),100)},required:['code','fields']}
schemas.ErrorResponse={type:'object',additionalProperties:false,properties:{success:{type:'boolean',const:false},data:{type:'null'},message:str('사용자 메시지','입력값을 확인해주세요.'),error:ref('ErrorDetail'),meta:ref('Meta')},required:['success','data','message','error','meta']}
function responseSchema(name) {
  if(name.startsWith('@')) {
    const resource=name.slice(1),key=resource+'Page'
    schemas[key]??={type:'object',additionalProperties:false,properties:{items:arr('권한 범위의 목록',ref(resource),100),nextCursor:nullable(str('다음 페이지 커서; 마지막 null','opaque-cursor')),hasNext:bool('다음 페이지 여부')},required:['items','nextCursor','hasNext']}
    return ref(key)
  }
  if(name.startsWith('[]')) return arr('기간 내 집계 배열',ref(name.slice(2)),366)
  return ref(name)
}
function statusOf(e) { return !e.response?204:e.flags.includes('accepted')?202:e.flags.includes('upsert')?200:e.method==='POST'&&!e.flags.includes('action')&&(!e.path.startsWith('/auth/')||e.id==='AUTH-01')?201:200 }
function errorsOf(e) {
  return [...new Set(['VALIDATION_FAILED','RATE_LIMITED','INTERNAL_ERROR',...(!e.flags.includes('public')?['TOKEN_INVALID','TOKEN_EXPIRED','FORBIDDEN','NOT_FOUND']:[]),...(e.request?['INVALID_RANGE','UNSUPPORTED_MEDIA']:[]),...(e.flags.includes('version')||e.flags.includes('upsert')?['VERSION_CONFLICT','PRECONDITION_REQUIRED']:[]),...(e.id==='AUTH-01'?['DUPLICATE_EMAIL']:[]),...(e.path.endsWith('/login')?['INVALID_CREDENTIALS']:[]),...(e.flags.includes('csrf')?['CSRF_REJECTED']:[]),...(e.method==='POST'&&!e.path.startsWith('/auth/')?['IDEMPOTENCY_CONFLICT']:[]),...(e.path.startsWith('/time-entries')&&e.method!=='GET'?['TIME_OVERLAP']:[]),...(e.group===5?['MEMBERSHIP_REQUIRED','CAPACITY_EXCEEDED','STATE_CONFLICT','OWNER_REQUIRED']:[]),...(e.group===4?['HAS_CHILDREN','STATE_CONFLICT']:[]),...(e.group===6?['OWNER_REQUIRED']:[]),...(e.id==='SYNC-01'?['SYNC_RESET_REQUIRED']:[]),...(e.flags.includes('accepted')?['UPSTREAM_UNAVAILABLE']:[]),...(e.id==='FILE-01'?['CONTENT_TOO_LARGE']:[])])]
}
function pathSchema(name) {
  if(name==='date') return helpers.date('YYYY-MM-DD, 유효한 지역 달력 날짜')
  if(name==='provider') return helpers.en('사전 등록한 OAuth 제공자',['GOOGLE','APPLE','KAKAO'])
  if(name==='type') return helpers.en('휴지통 리소스 종류',['EVENT','TASK','ROUTINE','DIARY','MEMO'])
  if(name==='tag') return str('URL 인코딩한 # 없는 태그','업무',{minLength:1,maxLength:40})
  return helpers.id(name==='occurrenceKey'?'서버가 반환한 지역 회차+offset 불투명 키':'원본/대상 리소스 ID; 소유권 서버 재검증')
}
const spec={openapi:'3.1.1',info:{title:'Timeflow target API design — NOT IMPLEMENTED',version:'2026-09-26',description:'목표 /api/v1 설계. 현재 서버 /api와 호환되는 구현 완료 계약이 아닙니다. 모든 예시는 합성 데이터입니다.'},servers:[{url:'https://api.example.test/api/v1',description:'문서용 예약 도메인; 실제 서버 아님'}],tags:groups.map(([name,description])=>({name,description})),paths:{},components:{securitySchemes:{BearerAuth:{type:'http',scheme:'bearer',bearerFormat:'JWT'},RefreshCookie:{type:'apiKey',in:'cookie',name:'tf_refresh'}},schemas},security:[{BearerAuth:[]}]}
for(const e of endpoints) {
  e.parameters=[...[...e.path.matchAll(/\{(\w+)\}/g)].map(m=>({name:m[1],in:'path',required:true,schema:pathSchema(m[1]),description:pathSchema(m[1]).description})),...e.parameters]
  if(e.flags.includes('version')) e.parameters.push({name:'If-Match',in:'header',required:true,schema:str('GET 응답 ETag; 양쪽 따옴표 포함','"1"')})
  if(e.flags.includes('upsert')) {
    e.parameters.push({name:'If-Match',in:'header',required:false,schema:str('기존 수정 시 필수; 두 조건 헤더 중 정확히 하나','"1"')})
    e.parameters.push({name:'If-None-Match',in:'header',required:false,schema:str('신규 저장 시 *; 두 헤더 동시 전송 금지','*',{enum:['*']})})
  }
  if(e.method==='POST'&&!e.path.startsWith('/auth/')) e.parameters.push({name:'Idempotency-Key',in:'header',required:true,schema:str('24시간 동안 동일 key+본문=동일 결과','00000000-0000-4000-8000-000000000001',{format:'uuid'})})
  if(e.flags.includes('csrf')) e.parameters.push({name:'X-CSRF-Token',in:'header',required:true,schema:str('로그인 응답의 tf_csrf 쿠키와 일치','example-csrf-token')},{name:'Origin',in:'header',required:true,schema:str('서버 allowlist origin','https://app.example.test')})
  e.status=statusOf(e);e.errorCodes=errorsOf(e)
  e.dataSchema=e.response?responseSchema(e.response):null
  e.successSchema=e.dataSchema?{type:'object',additionalProperties:false,properties:{success:{type:'boolean',const:true},data:e.dataSchema,message:{type:['string','null'],example:null},meta:ref('Meta')},required:['success','data','message','meta']}:null
  e.responseExample=e.successSchema?example(e.successSchema):null
  if(e.responseExample) e.responseExample.success=true
  if(e.id==='TASK-05')e.responseExample.data.status='DONE'
  if(e.id==='FOCUS-02')e.responseExample.data.status='COMPLETED'
  if(['HOME-03','MENTION-02'].includes(e.id))e.responseExample.data.read=true
  if(['SHARE-03','GROUP-09'].includes(e.id))e.responseExample.data.status='ACCEPTED'
  if(e.id==='COMMUNITY-10')e.responseExample.data.status='MEMBER'
  if(e.id==='EVENT-03')Object.assign(e.responseExample.data,{...schemas.EventPatch.example,version:2})
  e.requestExample=e.request?example(ref(e.request)):null
  const responses={}
  const success={description:e.status===204?'성공, 본문 없음':e.status===202?'비동기 처리 접수; 완료 보장 아님':'성공',headers:{'X-Request-Id':{schema:{type:'string'},description:'서버 추적 ID'}}}
  if(e.successSchema) success.content={'application/json':{schema:e.successSchema,example:e.responseExample}}
  if(e.response&&!e.response.startsWith('@')&&!e.response.startsWith('[]')&&schemas[e.response]?.properties?.version) success.headers.ETag={schema:{type:'string'},example:'"1"',description:'변경 요청의 If-Match 값'}
  if([201,202].includes(e.status)) success.headers.Location={schema:{type:'string',format:'uri-reference'},description:'생성된 원본 또는 작업 상태 리소스 URL'}
  if(e.flags.includes('cookieSet')||e.id==='AUTH-03') success.headers['Set-Cookie']={schema:{type:'string'},description:'tf_refresh HttpOnly; Secure; SameSite=Lax; Path=/api/v1/auth 및 읽기 가능한 tf_csrf Secure; SameSite=Lax; Path=/ (별도 Set-Cookie). native 응답에는 없음.'}
  if(e.id==='AUTH-04') success.headers['Set-Cookie']={schema:{type:'string'},description:'tf_refresh, tf_csrf Max-Age=0; 기존 Path 일치'}
  responses[e.status]=success
  if(e.flags.includes('upsert')) responses[201]={...success,description:'신규 생성 (If-None-Match: *)',headers:{...success.headers,Location:{schema:{type:'string'},description:'생성한 리소스 URL'}}}
  for(const code of e.errorCodes) {
    const [status,cause,solution]=errorCatalog[code]
    responses[status]??={description:'',content:{'application/json':{schema:ref('ErrorResponse'),examples:{}}}}
    responses[status].description += `${code}: ${cause}. ${solution}. `
    responses[status].content['application/json'].examples[code]={value:{success:false,data:null,message:cause,error:{code,fields:code==='INVALID_RANGE'?[{path:'endAt',reason:'시작보다 늦은 시각 입력'}]:[]},meta:{requestId:'req-example',serverTime:'2026-09-26T00:00:00Z'}}}
    if(status===429||status===503) responses[status].headers={'Retry-After':{schema:{type:'integer',minimum:1},description:'재시도 대기 초'}}
  }
  const op={operationId:e.id,summary:e.summary,description:'설계 단계·미구현. '+domainRules[e.group],tags:[groups[e.group][0]],'x-implementation-status':'PLANNED','x-authorization':e.flags.includes('admin')?'ADMIN':e.flags.includes('owner')?'OWNER':e.flags.includes('public')?'PUBLIC':'USER + RESOURCE_ACL',parameters:e.parameters,responses,security:e.flags.includes('public')?[]:e.flags.includes('cookie')?[{RefreshCookie:[]}]:[{BearerAuth:[]}]}
  if(e.request) op.requestBody={required:true,content:{'application/json':{schema:ref(e.request),example:e.requestExample}}}
  if(spec.paths[e.path]?.[e.method.toLowerCase()]) throw Error('Duplicate route '+e.path)
  ;(spec.paths[e.path]??={})[e.method.toLowerCase()]=op
}
const oldCatalog=readFileSync(path.join(root,'docs/api/api-catalog.md'),'utf8')
const oldIds=[...oldCatalog.matchAll(/^\| ([A-Z]+-\d+) \|/gm)].map(m=>m[1])
for(const id of oldIds) if(!endpoints.some(e=>e.id===id)) throw Error('Missing original API '+id)
if(new Set(endpoints.map(e=>e.id)).size!==endpoints.length) throw Error('Duplicate operation ID')
output('docs/9-API/openapi.target.json',json(spec))
let catalog='# 전체 목표 API 목록\n\n기준 2026-09-26 · 전부 설계/미구현. 기존 '+oldIds.length+'개 범위 보존, 추가 '+(endpoints.length-oldIds.length)+'개, 총 '+endpoints.length+'개. 앞부분은 /api/v1.\n\n| ID | Method | Path | 기능 | 상세 문서 |\n|---|---|---|---|---|\n'
for(const e of endpoints) catalog+=`| ${e.id} | ${e.method} | ${e.path} | ${e.summary} | [${groups[e.group][1]}](${groups[e.group][0]}.md#${e.id.toLowerCase()}) |\n`
output('docs/9-API/catalog.md',catalog)
for(const [index,[filename,label]] of groups.entries()) {
  const list=endpoints.filter(e=>e.group===index)
  let doc=`# ${label} API 상세 설계\n\n2026-09-26 · 목표 /api/v1 · **서버 미구현** · ${list.length}개\n\n[전체 목록](catalog.md) · [공통 규칙](00-conventions.md) · [오류 사전](errors.md) · [OpenAPI JSON](openapi.target.json)\n\n## 업무 규칙\n\n${domainRules[index]}\n\n## 빠른 이동\n\n`+list.map(e=>`- [${e.id} ${e.summary}](#${e.id.toLowerCase()})`).join('\n')+'\n'
  for(const e of list) {
    const params=e.parameters.filter(p=>p.in!=='header'),headers=e.parameters.filter(p=>p.in==='header')
    let url='/api/v1'+e.path.replace(/\{(\w+)\}/g,(_,n)=>encodeURIComponent(example(pathSchema(n))))
    const query=params.filter(p=>p.in==='query'&&p.required)
    if(query.length) url+='?'+query.map(p=>p.name+'='+encodeURIComponent(example(p.schema))).join('&')
    const auth=e.flags.includes('public')?'공개 (빈도 제한)':e.flags.includes('cookie')?'refresh 쿠키 + CSRF':e.flags.includes('admin')?'JWT + ADMIN':e.flags.includes('owner')?'JWT + 리소스 OWNER':'JWT + 본인/공유/멤버십 권한'
    doc+=`\n<a id="${e.id.toLowerCase()}"></a>\n## ${e.id} · ${e.summary}\n\n- 요청 URL: \`https://api.example.test/api/v1${e.path}\` (예약 예시 도메인)\n- HTTP 메서드: **${e.method}**\n- 인증·인가: ${auth}\n- 구현 상태: PLANNED; 현재 /api와 호환되지 않음\n\n### 요청 헤더\n\n| 헤더 | 필수 | 값·설명 |\n|---|---|---|\n| Accept | 권장 | application/json |\n`
    if(!e.flags.includes('public')&&!e.flags.includes('cookie')) doc+='| Authorization | 필수 | Bearer &lt;access-token&gt; |\n'
    if(e.flags.includes('cookie')) doc+='| Cookie | 필수 | tf_refresh=&lt;refresh-token&gt;; 브라우저 자동 전송 |\n'
    if(e.request) doc+='| Content-Type | 필수 | application/json; charset=utf-8 |\n'
    for(const p of headers) doc+=`| ${p.name} | ${p.required?'필수':'조건부'} | ${cell(p.schema.description)}; 예 ${cell(example(p.schema))} |\n`
    doc+='| X-Request-Id | 선택 | 최대128자 UUID; 서버는 신뢰하지 않고 검증/재발급 가능 |\n'
    doc+='\n### 경로·쿼리 파라미터\n\n'+(params.length?'| 위치 | 이름 | 타입 | 필수 | 기본값·검증 |\n|---|---|---|---|---|\n'+params.map(p=>`| ${p.in} | ${p.name} | ${shape(p.schema)} | ${p.required?'예':'아니오'} | ${cell(p.schema.description)}; ${cell(limits(p.schema))} |`).join('\n'):'없음. 쿼리로 사용자 ID나 권한을 받지 않습니다.')+'\n'
    doc+='\n### 요청 본문\n\n'+(e.request?fieldTable(ref(e.request))+'\n\n```json\n'+json(e.requestExample)+'\n```':'없음. 빈 JSON 본문을 보낼 필요가 없습니다.')+'\n'
    doc+='\n### 요청 예시\n\n```http\n'+e.method+' '+url+' HTTP/1.1\nHost: api.example.test\nAccept: application/json\n'
    if(!e.flags.includes('public')&&!e.flags.includes('cookie'))doc+='Authorization: Bearer <access-token>\n'
    if(e.flags.includes('cookie'))doc+='Cookie: tf_refresh=<refresh-token>\n'
    for(const p of headers.filter(p=>p.required||p.name==='If-None-Match'))doc+=p.name+': '+example(p.schema)+'\n'
    if(e.request)doc+='Content-Type: application/json\n\n'+json(e.requestExample)+'\n'
    doc+='```\n\n### 성공 응답\n\nHTTP **'+e.status+'**'+(e.flags.includes('upsert')?' (최초 생성 201, 기존 갱신 200)':'')+'. '
    doc+=e.status===204?'응답 본문 없음. JSON 파싱하지 않습니다.\n':(e.status===202?'접수 상태이며 완료 여부는 작업 조회 API로 확인합니다. ':'')+'응답 헤더 및 구조는 아래와 같습니다.\n\n'+Object.entries(spec.paths[e.path][e.method.toLowerCase()].responses[e.status].headers).map(([k,v])=>'- '+k+': '+v.description).join('\n')+'\n\n'+fieldTable(e.successSchema)+'\n\n```json\n'+json(e.responseExample)+'\n```\n'
    doc+='\n### 오류와 처리\n\n| HTTP | code | 원인 | 클라이언트 해결 방법 |\n|---|---|---|---|\n'+e.errorCodes.map(code=>{const [status,cause,solution]=errorCatalog[code];return `| ${status} | ${code} | ${cause} | ${solution} |`}).join('\n')+'\n'
  }
  output('docs/9-API/'+filename+'.md',doc)
}
output('docs/9-API/errors.md','# 오류 코드·예외 처리 사전\n\n**목표 /api/v1 계약**. 현재 /api는 error.code를 직렬화하지 않습니다. [현재 계약](current-contract.md)과 구분하세요.\n\n| HTTP | error.code | 원인 | 해결 방법 |\n|---|---|---|---|\n'+Object.entries(errorCatalog).map(([code,[status,cause,solution]])=>`| ${status} | ${code} | ${cause} | ${solution} |`).join('\n')+'\n\n## 오류 응답 예시\n\n```json\n'+json(spec.paths['/events'].post.responses[422].content['application/json'].examples.INVALID_RANGE.value)+'\n```\n\n파라미터 오류에는 원문 비밀번호/토큰/SQL/파일 경로를 넣지 않습니다. 401 재발급은 단일 실행 잠금으로 묶고, 403/404/409/412는 자동 반복하지 않습니다. 429/503은 Retry-After와 지수 backoff+jitter, 최대 시도 수를 적용합니다. 202 작업의 실제 실패는 조회 응답 status=FAILED와 errorCode로 표현합니다.\n')
generateCurrent(root,output)
generateDatabase(root,output)
const evidenceFiles=['backend/src/main/resources/db/migration/V1__initial_schema.sql','backend/src/main/java/kr/timebar/diary/security/SecurityConfig.java','docs/api/api-catalog.md']
output('docs/design/source-snapshot.json',json({date:'2026-09-26',targetOperations:endpoints.length,originalCatalogOperations:oldIds.length,files:evidenceFiles.map(file=>({file,sha256:createHash('sha256').update(readFileSync(path.join(root,file))).digest('hex')}))}))
console.log((check?'Verified':'Generated')+` ${written.length} documents; ${endpoints.length} target operations (${oldIds.length} original + ${endpoints.length-oldIds.length} additions).`)
