import {readFileSync,readdirSync,existsSync} from 'node:fs'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {generateCurrent} from './current.mjs'
const root=path.resolve(process.argv[2]??fileURLToPath(new URL('../../../',import.meta.url)))
const apiDir=path.join(root,'docs/api-info')
const spec=JSON.parse(readFileSync(path.join(apiDir,'openapi.target.json'),'utf8'))
const resolve=s=>s?.$ref?s.$ref.split('/').slice(1).reduce((v,k)=>v?.[k],spec):s
const errors=[]
function assert(condition,message){if(!condition)errors.push(message)}
// This checks the subset emitted by our contract model. It is not a substitute
// for a full external OpenAPI validator or server contract tests.
function validate(value,s,at) {
  s=resolve(s);if(!s){errors.push(at+': unresolved schema');return}
  if(s.anyOf){const good=s.anyOf.some(part=>{const before=errors.length;validate(value,part,at);const ok=errors.length===before;errors.splice(before);return ok});assert(good,at+': anyOf mismatch')}
  if(s.oneOf){let count=0;for(const part of s.oneOf){const before=errors.length;validate(value,part,at);if(errors.length===before)count++;errors.splice(before)}assert(count===1,at+': oneOf mismatch')}
  if(s.not){const before=errors.length;validate(value,s.not,at);const passed=errors.length===before;errors.splice(before);assert(!passed,at+': forbidden combination')}
  if(s.const!==undefined)assert(value===s.const,at+': wrong const')
  if(s.enum)assert(s.enum.includes(value),at+': wrong enum')
  const types=s.type===undefined?[]:Array.isArray(s.type)?s.type:[s.type]
  const actual=value===null?'null':Array.isArray(value)?'array':typeof value==='object'?'object':typeof value
  if(types.length)assert(types.includes(actual)||(actual==='number'&&types.includes('integer')&&Number.isInteger(value)),at+': wrong type '+actual)
  if(value===null)return
  if(typeof value==='object'&&!Array.isArray(value)) {
    for(const k of s.required??[])assert(k in value,at+': missing '+k)
    if(s.minProperties!==undefined)assert(Object.keys(value).length>=s.minProperties,at+': too few fields')
    for(const [k,v] of Object.entries(value)) {
      if(s.additionalProperties===false)assert(k in (s.properties??{}),at+': unknown '+k)
      if(s.properties?.[k])validate(v,s.properties[k],at+'.'+k)
    }
  }
  if(Array.isArray(value)) {
    if(s.minItems!==undefined)assert(value.length>=s.minItems,at+': too few items')
    if(s.maxItems!==undefined)assert(value.length<=s.maxItems,at+': too many items')
    if(s.uniqueItems)assert(new Set(value.map(x=>JSON.stringify(x))).size===value.length,at+': duplicate array items')
    if(s.items)value.forEach((v,i)=>validate(v,s.items,at+'['+i+']'))
  }
  if(typeof value==='string') {
    if(s.minLength!==undefined)assert(value.length>=s.minLength,at+': short string')
    if(s.maxLength!==undefined)assert(value.length<=s.maxLength,at+': long string')
    if(s.pattern)assert(new RegExp(s.pattern).test(value),at+': pattern mismatch')
    if(s.format==='date')assert(/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value)),at+': invalid date')
    if(s.format==='date-time')assert(/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(value)&&!Number.isNaN(Date.parse(value)),at+': invalid instant')
    if(s.format==='uuid')assert(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value),at+': invalid uuid')
    if(s.format==='email')assert(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value),at+': invalid email')
  }
  if(typeof value==='number') {
    if(s.minimum!==undefined)assert(value>=s.minimum,at+': below minimum')
    if(s.maximum!==undefined)assert(value<=s.maximum,at+': above maximum')
    if(s.multipleOf)assert(Math.abs(value/s.multipleOf-Math.round(value/s.multipleOf))<1e-8,at+': multipleOf mismatch')
  }
}
function walk(value,location) {
  if(!value||typeof value!=='object')return
  if(value.$ref)assert(!!resolve(value),location+': unresolved '+value.$ref)
  for(const [key,child]of Object.entries(value))walk(child,location+'.'+key)
}
walk(spec,'spec')
const ids=[];let examples=0
for(const [url,pathItem]of Object.entries(spec.paths))for(const [method,op]of Object.entries(pathItem)) {
  ids.push(op.operationId)
  assert(op['x-implementation-status']==='PLANNED',op.operationId+': status missing')
  for(const m of url.matchAll(/\{(\w+)\}/g))assert(op.parameters.some(p=>p.name===m[1]&&p.in==='path'&&p.required),op.operationId+': undocumented path '+m[1])
  assert(new Set(op.parameters.map(p=>p.in+':'+p.name)).size===op.parameters.length,op.operationId+': duplicate parameter')
  for(const p of op.parameters){const e=p.example??resolve(p.schema)?.example;if(e!==undefined){validate(e,p.schema,op.operationId+'.param.'+p.name);examples++}}
  for(const [type,content]of Object.entries(op.requestBody?.content??{})){validate(content.example,content.schema,op.operationId+'.request');examples++}
  for(const [status,res]of Object.entries(op.responses)) {
    if(status==='204')assert(!res.content,op.operationId+': 204 has body')
    for(const content of Object.values(res.content??{})) {
      if(content.example!==undefined){validate(content.example,content.schema,op.operationId+'.response.'+status);examples++}
      for(const [name,e]of Object.entries(content.examples??{})){validate(e.value,content.schema,op.operationId+'.error.'+name);examples++}
    }
  }
  if(op.requestBody?.content?.['application/json']?.example?.startAt) {
    const b=op.requestBody.content['application/json'].example
    if(b.endAt)assert(Date.parse(b.endAt)>Date.parse(b.startAt),op.operationId+': time inversion')
  }
  if(['TASK-05','FOCUS-02','HOME-03','MENTION-02'].includes(op.operationId))assert(!!op.responses[200],op.operationId+': state update lacks 200')
}
assert(new Set(ids).size===ids.length,'duplicate operationId')
const old=[...readFileSync(path.join(root,'docs/api/api-catalog.md'),'utf8').matchAll(/^\| ([A-Z]+-\d+) \|/gm)].map(m=>m[1])
old.forEach(id=>assert(ids.includes(id),'Missing original API '+id))
const current=JSON.parse(readFileSync(path.join(apiDir,'current-operations.json'),'utf8'))
let sourceOperations
generateCurrent(root,(file,text)=>{if(file.endsWith('current-operations.json'))sourceOperations=JSON.parse(text)})
assert(JSON.stringify(current)===JSON.stringify(sourceOperations),'Current controller inventory differs from source; regenerate --current-only')
assert(current.filter(o=>o.stub).length===52,'Stub count differs from source baseline')
const schema=JSON.parse(readFileSync(path.join(root,'docs/design/current-schema.json'),'utf8'))
assert(schema.tables.length===37,'DDL table count changed; review extraction')
for(const t of schema.tables)assert(t.columns.length>0&&t.pk,'Missing columns/PK '+t.name)
// Verify local links and fenced-block balancing for the new package.
let links=0,documents=0
function scan(dir){for(const e of readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory()){scan(p);continue}if(!p.endsWith('.md'))continue;documents++;const text=readFileSync(p,'utf8');assert((text.match(/^```/gm)??[]).length%2===0,'Unbalanced fences '+p);for(const m of text.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)){const target=m[1].split('#')[0];if(!target||/^https?:/.test(target))continue;assert(existsSync(path.resolve(path.dirname(p),decodeURIComponent(target))),'Broken link '+p+' -> '+target);links++}}}
scan(apiDir);scan(path.join(root,'docs/design'))
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log(`PASS: ${ids.length} target APIs, ${current.length} current APIs, ${schema.tables.length} DDL tables, ${examples} examples, ${documents} Markdown files, ${links} local links.`)
console.log('Scope: custom schema subset + static source checks. No DB migration, live API, vendor sandbox, browser or Mermaid visual rendering was executed.')
