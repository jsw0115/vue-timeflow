import {readFileSync,readdirSync} from 'node:fs'
import path from 'node:path'
const walk=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(x=>x.isDirectory()?walk(path.join(dir,x.name)):[path.join(dir,x.name)])
const code=value=>'```json\n'+JSON.stringify(value,null,2)+'\n```'
const cell=value=>String(value??'—').replaceAll('|',' / ').replaceAll('\n',' ')
export function splitTop(text) {
  const parts=[];let start=0,depth=0,angle=0,quote=null
  for(let i=0;i<text.length;i++) {
    const c=text[i]
    if(quote){if(c===quote&&text[i-1]!=='\\')quote=null;continue}
    if(c==='"'||c==="'"||c==='`'){quote=c;continue}
    if(c==='('||c==='['||c==='{')depth++
    if(c===')'||c===']'||c==='}')depth--
    if(c==='<')angle++;if(c==='>')angle--
    if(c===','&&depth===0&&angle===0){parts.push(text.slice(start,i).trim());start=i+1}
  }
  parts.push(text.slice(start).trim());return parts.filter(Boolean)
}
function parens(text,start) {
  let depth=0,quote=null
  for(let i=start;i<text.length;i++) {
    const c=text[i]
    if(quote){if(c===quote&&text[i-1]!=='\\')quote=null;continue}
    if(c==='"'||c==="'"){quote=c;continue}
    if(c==='(')depth++;if(c===')'&&--depth===0)return [text.slice(start+1,i),i]
  }
  throw Error('Unbalanced Java signature')
}
function stripAnnotations(text){return text.replace(/@\w+(?:\((?:[^()"']|"(?:\\.|[^"\\])*"|'[^']*')*\))?\s*/g,'').trim()}
export function generateCurrent(root,output) {
  const base=path.join(root,'backend/src/main/java/kr/timebar/diary'),files=walk(base).filter(p=>p.endsWith('.java'))
  const sources=Object.fromEntries(files.map(p=>[path.basename(p,'.java'),readFileSync(p,'utf8')]))
  const records={},enums={}
  for(const [name,src] of Object.entries(sources)) {
    for(const r of src.matchAll(/public record (\w+)(?:<[^>]+>)?\s*\(/g)) {
      const [args]=parens(src,r.index+r[0].length-1)
      records[r[1]]=splitTop(args).map(raw=>{const cleaned=stripAnnotations(raw),m=cleaned.match(/^(.+?)\s+(\w+)$/);if(!m)throw Error('Unparsed record '+r[1]+': '+raw);return {name:m[2],type:m[1],required:/@NotBlank|@NotNull|@NotEmpty|@AssertTrue/.test(raw),constraints:[...raw.matchAll(/@(NotBlank|NotNull|NotEmpty|Email|AssertTrue|Pattern|Size|Min|Max)\b/g)].map(m=>m[1]).join(', ')}})
    }
    for(const m of src.matchAll(/(?:public )?enum (\w+)\s*\{([^;{}]+)/g)) {const values=m[2].split(',').map(x=>x.trim()).filter(x=>/^[A-Z][A-Z_]*$/.test(x));if(values.length)enums[m[1]]=values}
  }
  function sample(type,name='',depth=0) {
    if(depth>7)throw Error('Unexpected recursion')
    type=type.replaceAll(' ','')
    if(type.startsWith('List<'))return [sample(type.slice(5,-1),name,depth+1)]
    if(type==='Void'||type==='void')return null
    if(records[type])return Object.fromEntries(records[type].map(f=>[f.name,sample(f.type,f.name,depth+1)]))
    if(enums[type.split('.').at(-1)])return enums[type.split('.').at(-1)][0]
    if(['int','Integer','long','Long'].includes(type))return name==='month'?9:name==='year'?2026:name.toLowerCase().includes('duration')?30:1
    if(['double','Double'].includes(type))return 50
    if(['boolean','Boolean'].includes(type))return /agree|onoff|enabled/i.test(name)
    if(type==='LocalDate')return '2026-09-26'
    if(type==='LocalTime')return name.startsWith('end')?'10:00:00':'09:00:00'
    if(/DateTime|Instant/.test(type))return '2026-09-26T00:00:00Z'
    if(type.startsWith('Map<'))return {}
    if(/token/i.test(name))return 'example-token-not-valid'
    if(/password/i.test(name))return 'Example-Password-2026!'
    if(name==='email')return 'demo@example.test'
    if(name==='nickname')return '김지수'
    if(name==='date'||name==='from'||name==='to'||name==='start')return name==='to'?'2026-09-27':'2026-09-26'
    if(name==='atTime')return '09:00'
    if(name==='days')return 'mon,tue,wed,thu,fri'
    if(/id$/i.test(name))return '01J00000000000000000000001'
    if(/color/i.test(name))return '#2f5d46'
    return name==='title'||name==='name'?'설계 검토':'example'
  }
  const operations=[]
  for(const [controller,src] of Object.entries(sources).filter(([name])=>name.endsWith('Controller'))) {
    const basePath=src.match(/@RequestMapping\("([^"]+)"\)/)?.[1];if(!basePath)continue
    const matches=[...src.matchAll(/@(Get|Post|Put|Patch|Delete)Mapping(?:\(([^\r\n]*?)\))?/g)]
    for(let i=0;i<matches.length;i++) {
      const m=matches[i],segment=src.slice(m.index,matches[i+1]?.index??src.length)
      const signature=segment.match(/public\s+(.+?)\s+(\w+)\s*\(/)
      if(!signature)throw Error('Unparsed controller method '+controller)
      const [args]=parens(segment,signature.index+signature[0].length-1)
      const parameters=splitTop(args).map(raw=>{const match=stripAnnotations(raw).match(/^(.+?)\s+(\w+)$/);if(!match)throw Error('Unknown parameter '+raw);const location=raw.includes('@RequestBody')?'body':raw.includes('@RequestPart')?'multipart':raw.includes('@PathVariable')?'path':raw.includes('@RequestHeader')?'header':'query';return {name:match[2],type:match[1],location,required:location==='path'||!(/required\s*=\s*false|defaultValue\s*=/.test(raw)),default:raw.match(/defaultValue\s*=\s*"([^"]+)"/)?.[1]}})
      const route=basePath+(m[2]?.match(/"([^"]*)"/)?.[1]??'')
      const status=segment.includes('HttpStatus.CREATED')?201:segment.includes('HttpStatus.NO_CONTENT')||segment.includes('ResponseEntity.noContent()')?204:200
      const stub=segment.match(/ContractResponses.stub\("([^"]+)"\)/)?.[1]
      const responseType=signature[1].match(/^ApiResponse<(.+)>$/)?.[1]??(signature[1].includes('SseEmitter')?'SseEmitter':'void')
      operations.push({method:m[1].toUpperCase(),route,parameters,status,stub,responseType,controller,kind:stub?'계약 stub':controller==='PlannerController'?'공용 메모리 시연':'서비스 연결',public:['/api/auth/signup','/api/auth/login','/api/auth/refresh'].includes(route)})
    }
  }
  let doc='# 현재 /api 소스 계약 상세\n\n기준 2026-09-27. Java 소스에서 생성한 정적 계약이며 DB 실행 결과가 아닙니다. 목표 /api/v1과 구분합니다.\n\n'+`총 ${operations.length}개: 서비스 연결 ${operations.filter(o=>o.kind==='서비스 연결').length}, stub ${operations.filter(o=>o.stub).length}, 공용 메모리 ${operations.filter(o=>o.kind==='공용 메모리 시연').length}.\n\n`+
  '## 공통 주의사항\n\n- 응답은 success/data/message 3필드입니다. 내부 ErrorCode는 JSON에 노출되지 않으므로 아래 코드명을 클라이언트가 받는다고 가정하지 마세요.\n- SecurityConfig는 공개 인증 경로 외 JWT를 요구하지만 관리자 역할 검사는 없습니다. stub 200은 저장 성공이 아닙니다.\n- JSON Content-Type: application/json, Accept: application/json. STT stub만 multipart/form-data; boundary는 HTTP 클라이언트가 지정합니다.\n- 현재 CORS 허용 헤더는 Authorization/Content-Type/X-Request-Id뿐입니다. 목표 If-Match/Idempotency-Key/CSRF/ETag 사용에는 서버 설정 변경이 필요합니다.\n- 존재하지 않는 리소스·서비스 조건은 소스를 함께 확인하세요. IllegalArgumentException/NoSuchElementException은 400, ApiException은 지정 상태, 기타 예외는 500이므로 모든 누락 파라미터가 항상400이라고 보장하지 않습니다.\n- 현재 SQL/JPA 이름 불일치로 실제 DB 부팅이 실패할 수 있습니다. [정합성 보고서](../design/04-schema-gaps.md) 참고.\n- 예시는 DTO 자료형으로 생성한 합성 데이터입니다. 서비스 기본값·실제 응답 값은 DB/시간에 따라 달라집니다. 기록 본문 Map 기반 stub에는 필수 필드 계약 자체가 아직 없습니다.\n\n## 공통 오류\n\n| 내부 코드 | HTTP | 원인 | 대응 |\n|---|---|---|---|\n'
  const errors=[...sources.ErrorCode.matchAll(/(\w+)\(HttpStatus\.(\w+),\s*"([^"]+)"\)/g)]
  const statusMap={BAD_REQUEST:400,CONFLICT:409,UNAUTHORIZED:401,FORBIDDEN:403,NOT_FOUND:404,TOO_MANY_REQUESTS:429,INTERNAL_SERVER_ERROR:500}
  for(const [,name,status,message] of errors)doc+=`| ${name} | ${statusMap[status]} | ${message} | ${status==='UNAUTHORIZED'?'재발급/재로그인':status==='BAD_REQUEST'?'입력·enum·날짜 확인':status==='FORBIDDEN'?'계정 상태/잠금/권한 확인 후 대기':status==='CONFLICT'?'중복 여부·현재 상태 확인':'requestId 또는 요청 시각으로 서버 로그 확인'} |\n`
  doc+='\n```json\n{"success":false,"data":null,"message":"인증 토큰이 유효하지 않습니다."}\n```\n\n## 엔드포인트별 요청·응답\n'
  for(const o of operations) {
    if(o.controller==='ChatController') {
      doc+=`\n### ${o.method} ${o.route}\n\n- 상태: **서비스 연결 · CHAT_ENABLED=true 조건부 활성화**\n- 소스: ChatController.java\n- 인증: JWT + 활성 계정/방 참여 권한. 미리보기 데이터는 브라우저 전용이며 API 인증을 우회하지 않습니다.\n- 성공 HTTP: ${o.status}; ${o.responseType==='SseEmitter'?'text/event-stream (JSON envelope 없음)':o.status===204?'본문 없음':'ApiResponse<'+o.responseType+'>'}\n- 요청·응답·커서·오류: [채팅 API 상세 설계](../chat/api/design.md), [전체 15개 채팅 목록](../chat/api/catalog.md).\n`
      continue
    }
    const body=o.parameters.find(p=>p.location==='body'),multipart=o.parameters.find(p=>p.location==='multipart')
    doc+=`\n### ${o.method} ${o.route}\n\n- 상태: **${o.kind}**\n- 소스: ${o.controller}.java\n- 요청 URL: http://localhost:8080${o.route} (로컬 예시)\n- 헤더: ${o.public?'Authorization 없음':'Authorization: Bearer <access-token>'}, Accept: application/json${body?', Content-Type: application/json':multipart?', Content-Type: multipart/form-data; boundary=...':''}\n- 성공 HTTP: ${o.status}; ${o.status===204?'본문 없음':o.stub?'CONTRACT_READY이며 실 처리 없음':'ApiResponse<'+o.responseType+'>'}\n\n`
    doc+=o.parameters.length?'| 위치 | 파라미터 | Java 타입 | 필수 | 기본값 |\n|---|---|---|---|---|\n'+o.parameters.map(p=>`| ${p.location} | ${p.name} | ${cell(p.type)} | ${p.required?'예':'아니오'} | ${p.default??'없음'} |`).join('\n')+'\n':'요청 파라미터 없음.\n'
    if(body)doc+='\n요청 본문 예시'+(body.type.startsWith('Map')?' (stub: 임의 JSON, 필드 미정의)':'')+':\n\n'+code(sample(body.type))+'\n'
    if(multipart)doc+='\nfile: 바이너리 파일. 현재 stub은 STT 변환을 수행하지 않습니다. 파일 허용량·MIME 검증 계약은 미정입니다.\n'
    if(o.status!==204)doc+='\n성공 응답 예시:\n\n'+code({success:true,data:o.stub?{endpoint:o.stub,status:'CONTRACT_READY'}:sample(o.responseType),message:o.stub?'컨트롤러 계약만 준비되었습니다.':null})+'\n'
    doc+='\n오류 처리: '+(!o.public?'JWT 누락/무효 401 → 로그인 확인. ':'')+'본문 검증 위반 400 → DTO 필수값 확인; 서비스 충돌 시409 → 현재 상태 재조회; 미처리 예외500 → 로그 확인. 개별 에러코드 필드는 아직 없으며 공통 오류 표를 참고합니다.\n'
  }
  doc+='\n## DTO 필드 사전\n\n필수 표시는 Bean Validation annotation만 반영합니다. 응답 DTO의 선택 표시는 null 가능성 보장이 아니라 요청 검증 annotation이 없다는 의미입니다. Java primitive는 누락 시 기본값으로 역직렬화될 수 있으므로 required와 기본값을 혼동하지 마세요.\n'
  for(const [name,fields] of Object.entries(records))doc+=`\n### ${name}\n\n| 필드 | 자료형 | 검증 필수 | annotation |\n|---|---|---|---|\n`+fields.map(f=>`| ${f.name} | ${cell(f.type)} | ${f.required?'예':'미지정'} | ${f.constraints||'없음'} |`).join('\n')+'\n'
  doc+='\n## Enum 사전\n\n'+Object.entries(enums).map(([n,v])=>`- ${n}: ${v.join(', ')}`).join('\n')+'\n'
  output('docs/api-info/current-contract.md',doc)
  output('docs/api-info/current-operations.json',JSON.stringify(operations,null,2))
}
