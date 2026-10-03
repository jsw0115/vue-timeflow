import test from 'node:test'
import assert from 'node:assert/strict'
import { SearchIndex } from '../src/utils/searchIndex.mjs'
import { makeRecurrence, occurrenceDates, eventOccurrences, recurrenceError } from '../src/utils/recurrence.mjs'
import { liveEditors } from '../src/utils/editPresence.mjs'
import { createDemoChatApi } from '../src/features/chat/api/demoChatApi.js'

test('색인: 한 글자 한글, 본문, 유니코드 정규화, 범위·페이지·수정·삭제', () => {
  const index = new SearchIndex()
  const entries = [{id:'1',kind:'메모',title:'기획',body:'ＡＢＣ 회의 🐻 준비'}, {id:'2',kind:'일정',title:'회의',body:'준비'}]
  index.sync(entries)
  assert.equal(index.search('획').total,1)
  assert.equal(index.search('abc').total,1)
  assert.equal(index.search('🐻').total,1)
  assert.equal(index.search('회의').counts['전체'],2)
  assert.equal(index.search('회의','일정').items[0].id,'2')
  assert.equal(index.search('회의','전체',1,1).items.length,1)
  index.sync([{...entries[0],body:'수정'},entries[1]])
  assert.equal(index.search('abc').total,0)
  index.sync([entries[1]])
  assert.equal(index.search('기획').total,0)
  assert.equal(index.search('없는 단어').total,0)
  assert.equal(index.search('').total,0)
})
test('색인: 30,000개 문서에서 정확한 결과와 범위별 건수', () => {
  const index = new SearchIndex()
  index.sync(Array.from({length:30000},(_,i)=>({id:String(i),kind:i%2?'메모':'일정',title:`회의 ${i}`,body:`진행 항목 ${i} #검증`})))
  const start=performance.now()
  for(let i=0;i<100;i++) assert.equal(index.search('항목 29999').total,1)
  process.stdout.write(`# 30,000 documents: average query ${((performance.now()-start)/100).toFixed(2)}ms\n`)
  assert.deepEqual(index.search('회의').counts,{'일정':15000,'전체':30000,'메모':15000})
})
test('반복: 간격·요일·종료일·횟수와 달 말일·윤년 처리', () => {
  assert.deepEqual(occurrenceDates('2026-10-01',makeRecurrence({frequency:'daily',interval:2,endMode:'count',count:3}),'2026-10-01','2026-10-20'),['2026-10-01','2026-10-03','2026-10-05'])
  assert.deepEqual(occurrenceDates('2026-10-01',makeRecurrence({frequency:'weekly',interval:2,weekdays:[1,5],endMode:'count',count:3}),'2026-10-01','2026-11-30'),['2026-10-02','2026-10-12','2026-10-16'])
  assert.deepEqual(occurrenceDates('2026-01-31',makeRecurrence({frequency:'monthly',endMode:'until',until:'2026-05-31'}),'2026-01-01','2026-12-31'),['2026-01-31','2026-03-31','2026-05-31'])
  assert.deepEqual(occurrenceDates('2024-02-29',makeRecurrence({frequency:'yearly',endMode:'count',count:2}),'2024-01-01','2030-12-31'),['2024-02-29','2028-02-29'])
  assert.notEqual(recurrenceError(makeRecurrence({frequency:'weekly',weekdays:[]}), '2026-10-01'),'')
  assert.notEqual(recurrenceError(makeRecurrence({frequency:'daily',endMode:'until',until:'2026-02-30'}),'2026-01-01'),'')
  assert.deepEqual(occurrenceDates('2000-01-01',makeRecurrence({frequency:'daily'}),'2099-01-01','2099-01-02'),['2099-01-01','2099-01-02'])
})
test('반복 일정: 자정 넘김·여러 날 일정 포함, 원본 수정 없이 조회', () => {
  const source={id:7,title:'회의',startDate:'2026-10-01',endDate:'2026-10-02',startTime:'23:00',endTime:'01:00',recurrence:makeRecurrence({frequency:'weekly',weekdays:[4]})}
  const results=eventOccurrences([source],'2026-10-09','2026-10-09')
  assert.equal(results.length,1)
  assert.equal(results[0].startDate,'2026-10-08')
  assert.equal(results[0].endDate,'2026-10-09')
  assert.equal(source.startDate,'2026-10-01')
  assert.deepEqual(eventOccurrences([{id:1,startDate:'invalid'}],'2026-10-01','2026-10-31'),[])
})
test('편집 상태: 다른 항목·자신·만료·잘못된 미래 상태 제외', () => {
  const entries=[{resource:'task:1',clientId:'other',name:'지수',expiresAt:11000},{resource:'task:2',clientId:'second',name:'서연',expiresAt:11000},{resource:'task:1',clientId:'own',name:'나',expiresAt:11000},{resource:'task:1',clientId:'expired',name:'이전',expiresAt:9000},{resource:'task:1',clientId:'bad',name:'미래',expiresAt:90000}]
  assert.deepEqual(liveEditors(entries,'task:1',10000,'own').map(entry=>entry.name),['지수'])
})
test('채팅 검색: 전체 기록·대화 범위·유니코드·탈퇴 후 접근 제거', () => {
  const api=createDemoChatApi(new Date('2026-10-01T00:00:00Z'))
  assert.equal(api.search({q:'수고'}).items.length,1)
  assert.equal(api.search({q:'수고',roomId:'preview-minjun-dm'}).items.length,0)
  assert.equal(api.peoplePresence(['preview-seoyeon']).length,0)
  api.transfer('preview-group','preview-seoyeon'); api.leave('preview-group')
  assert.equal(api.search({q:'수고'}).items.length,0)
})
