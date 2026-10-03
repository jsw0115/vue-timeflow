import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createSSRApp, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createRouter, createMemoryHistory } from 'vue-router'
import { localDate, rangeError, routineError, challengeError, integerBetween, workRecordError } from '../src/utils/postValidation.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const cache = new Map()
const originalStorage = globalThis.localStorage
globalThis.localStorage = { getItem: k => cache.get(k) ?? null, setItem: (k,v) => cache.set(k,String(v)), removeItem: k => cache.delete(k) }
let server
before(async () => {
  server = await createServer({ root, configFile: false, plugins: [vue()], server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error' })
})
after(async () => { await server?.close(); if (originalStorage === undefined) delete globalThis.localStorage; else globalThis.localStorage = originalStorage })
const load = path => server.ssrLoadModule('/src/' + path)
async function render(path, props = {}, url = '/') {
  const component = (await load(path)).default
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:pathMatch(.*)*', component: { render: () => null } }] })
  await router.push(url)
  await router.isReady()
  const app = createSSRApp(component, props).use(router)
  const ctx = {}
  return (await renderToString(app, ctx)) + (ctx.teleports?.body ?? '')
}

test('일정: 당일·자정 넘김 허용, 누락·역전·동일 시각·잘못된 날짜 거부', () => {
  assert.equal(rangeError('2026-09-25','09:00','2026-09-25','10:00'), '')
  assert.equal(rangeError('2026-09-25','23:00','2026-09-26','01:00'), '')
  for (const args of [
    ['', '09:00','2026-09-25','10:00'],
    ['2026-09-25','10:00','2026-09-25','09:00'],
    ['2026-09-25','09:00','2026-09-25','09:00'],
    ['2026-02-29','09:00','2026-03-02','10:00'],
    ['2026-09-25','25:00','2026-09-26','10:00'],
  ]) assert.notEqual(rangeError(...args), '')
  assert.equal(localDate(new Date(2026, 8, 25, 0, 1)), '2026-09-25')
})
test('루틴: 요일·시작 시간·진행 시간·목표·알림 경계 검증', () => {
  const valid = { title:'산책', days:[1,3], time:'08:00', duration:30, goalCount:1, goalUnit:'회', notify:true, reminderMinutes:10 }
  assert.equal(routineError(valid), '')
  for (const invalid of [{days:[]},{days:[7]},{time:'24:90'},{duration:0},{duration:1441},{duration:1.5},{goalCount:0},{goalUnit:''},{reminderMinutes:-1}]) assert.notEqual(routineError({...valid,...invalid}), '')
  assert.equal(integerBetween('', 0, 10), false)
})
test('챌린지: 참여 커뮤니티만 선택, 잘못된 기간·지연 값 거부', () => {
  const communities = [{id:1, joined:true},{id:2, joined:false}]
  const valid = {communityId:1,title:'아침 독서',days:21,startsIn:0}
  assert.equal(challengeError(valid, communities), '')
  for (const invalid of [{communityId:2},{communityId:999},{days:2},{days:101},{days:3.1},{startsIn:-1},{startsIn:31},{title:' '}]) assert.notEqual(challengeError({...valid,...invalid},communities), '')
  assert.notEqual(challengeError(valid, []), '')
})
test('로컬 컬렉션: 수정·삭제 후 재로딩, 손상 JSON 복구, 저장 실패 경고', async () => {
  const { localCollection, storageWarning } = await load('store/localCollection.js')
  const list = localCollection('test', [{id:1,title:'원본'}])
  list.value.push({id:2,title:'추가'})
  list.value[0].title = '수정'
  assert.equal(localCollection('test').value[0].title, '수정')
  list.value = list.value.filter(x=>x.id!==1)
  assert.deepEqual(localCollection('test').value.map(x=>x.id),[2])
  cache.set('timeflow.demo.v1.broken','{invalid')
  assert.equal(localCollection('broken',[{id:1}]).value.length,1)
  const save = globalThis.localStorage.setItem
  globalThis.localStorage.setItem = () => { throw new Error('quota') }
  list.value.push({id:3})
  assert.match(storageWarning.value,/저장에 실패/)
  globalThis.localStorage.setItem = save
})
test('통합 글: 종류 선택, 목록 공유, 수정 인덱스 중복 방지, 삭제 동기화', async () => {
  const state = await load('store/appState.js')
  const writing = await load('store/writing.js')
  const tags = await load('store/tagging.js')
  await load('store/postIndex.js')
  state.openPostComposer('메모','초안')
  assert.equal(state.composer.value,true)
  assert.equal(state.composerKind.value,'메모')
  assert.equal(state.composerSeed.value,'초안')
  const collections = [state.tasks,state.events,state.routines,writing.memos,writing.diaries]
  for (const [i,list] of collections.entries()) {
    list.value.push({id:900+i,title:'테스트 글',body:'#검증전용태그',date:localDate()})
  }
  await nextTick()
  assert.equal(tags.postsByTag('검증전용태그').length,5)
  state.tasks.value.find(x=>x.id===900).body = '#수정검증태그'
  await nextTick()
  assert.equal(tags.postsByTag('검증전용태그').length,4)
  assert.equal(tags.postsByTag('수정검증태그').length,1)
  for(const [i,list] of collections.entries()) list.value = list.value.filter(x=>x.id!==900+i)
  await nextTick()
  assert.equal(tags.postsByTag('검증전용태그').length,0)
  assert.equal(tags.postsByTag('수정검증태그').length,0)
})
test('가입 상태: 가입/탈퇴와 생성된 커뮤니티가 챌린지 선택에 반영', async () => {
  const { communities, joinedCommunities, toggleMembership } = await load('store/communities.js')
  communities.value.push({id:990,title:'새 커뮤니티',joined:true,members:1,owner:true})
  assert.ok(joinedCommunities.value.some(x=>x.id===990))
  const group = {id:991,joined:false,members:3}
  communities.value.push(group)
  const entry = communities.value.find(x=>x.id===991)
  toggleMembership(entry)
  assert.ok(joinedCommunities.value.some(x=>x.id===991))
  toggleMembership(entry)
  assert.ok(!joinedCommunities.value.some(x=>x.id===991))
  const approval = {joined:false,joinPolicy:'approval',members:1}
  toggleMembership(approval)
  assert.equal(approval.pending,true)
  assert.equal(approval.joined,false)
})
test('태그·멘션: 중복 제거, 주소록·차단 규칙, HTML 비실행 렌더링', async () => {
  const tags = await load('store/tagging.js')
  const { contacts, blockedIds } = await load('store/contacts.js')
  assert.deepEqual(tags.parseTags('#업무 #업무 #회고'),['업무','회고'])
  const contact = contacts.value.find(c=>!blockedIds.value.includes(c.id))
  assert.ok(tags.parseMentions('@'+contact.name).includes(contact.name))
  assert.deepEqual(tags.parseMentions('@존재하지않는사람'),[])
  const blocked = contacts.value.find(c=>blockedIds.value.includes(c.id))
  if (blocked) assert.deepEqual(tags.parseMentions('@'+blocked.name),[])
  const markup = '<img src=x onerror=alert(1)> #업무'
  const html = await render('components/RichText.vue',{text:markup})
  assert.ok(!html.includes('<img'))
  assert.ok(html.includes('&lt;img'))
  const input = await render('components/TagMentionInput.vue',{modelValue:markup})
  assert.ok(!input.includes('<img'))
})
test('변경 화면 서버 렌더: 빈 값·계산·템플릿 런타임 오류 없음', async () => {
  const views = [
    'views/home/HomeView.vue','views/events/EventListView.vue','views/tasks/TaskListView.vue',
    'views/routines/RoutineListView.vue','views/diary/DiaryListView.vue','views/diary/DiaryEntryView.vue',
    'views/memo/MemoInboxView.vue','views/work/WbsView.vue','views/community/CommunityFeedView.vue',
    'views/community/CommunityHomeView.vue','views/community/ChallengeView.vue',
    'components/CommunityCreateModal.vue','components/PostComposer.vue',
  ]
  for(const path of views) {
    const html = await render(path)
    assert.ok(html.length > 50, path)
    assert.ok(!html.includes('NaN'), path)
  }
  const fields = await render('components/EventDateFields.vue',{draft:{startDate:localDate(),endDate:localDate(),startTime:'09:00',endTime:'10:00'}})
  assert.equal((fields.match(/type="date"/g)??[]).length,2)
  assert.equal((fields.match(/type="time"/g)??[]).length,2)
})
test('빈 홈: 할 일·루틴·일정이 없어도 NaN 없이 0 표시', async () => {
  const {tasks,routines,events} = await load('store/appState.js')
  const backup=[tasks.value,routines.value,events.value]
  tasks.value=[]; routines.value=[]; events.value=[]
  const html=await render('views/home/HomeView.vue')
  assert.ok(!html.includes('NaN'))
  assert.ok(html.includes('오늘 일정'))
  ;[tasks.value,routines.value,events.value]=backup
})

test('WBS 업무 기록: 연차·반차·외근·출장·이직 유형별 상세 검증', () => {
  const valid = {type:'연차',title:'휴가',owner:'김지수',startDate:'2026-09-25',endDate:'2026-09-25',startTime:'09:00',endTime:'18:00',leaveDays:1,location:'',expense:0,toCompany:'',role:''}
  assert.equal(workRecordError(valid),'')
  assert.notEqual(workRecordError({...valid,leaveDays:0.3}),'')
  assert.equal(workRecordError({...valid,type:'반차',startTime:'09:00',endTime:'13:00'}),'')
  assert.notEqual(workRecordError({...valid,type:'반차',endDate:'2026-09-26'}),'')
  assert.notEqual(workRecordError({...valid,type:'외근'}),'')
  assert.equal(workRecordError({...valid,type:'외근',location:'고객사'}),'')
  assert.notEqual(workRecordError({...valid,type:'출장',location:'부산',expense:-1}),'')
  assert.equal(workRecordError({...valid,type:'출장',location:'부산',expense:200000}),'')
  assert.notEqual(workRecordError({...valid,type:'이직'}),'')
  assert.equal(workRecordError({...valid,type:'이직',toCompany:'테스트회사',role:'개발자'}),'')
})

test('통합 작성: 종류별 검증·저장과 다른 종류 초안의 독립성', async () => {
  const { postKinds, makePostDraft, postDraftError, savePostDraft } = await load('store/postComposer.js')
  const state = await load('store/appState.js'), writing = await load('store/writing.js')
  const { moneyEntries } = await load('store/money.js'), { workRecords } = await load('store/workRecords.js')
  const { communityPosts } = await load('store/communityPosts.js'), { ddays } = await load('store/ddays.js')
  const { plannerReviews } = await load('store/plannerReviews.js'), { wiki } = await load('store/wiki.js')
  const collections = [state.events, state.tasks, state.routines, writing.diaries, writing.memos, moneyEntries, workRecords, communityPosts, ddays, plannerReviews]
  const backup = collections.map(list => [...list.value]), wikiBackup = [...wiki.docs]
  const counts = () => [...collections.map(list => list.value.length), wiki.docs.length]
  try {
    for (const kind of postKinds) {
      const invalid = makePostDraft(kind), before = counts()
      assert.notEqual(postDraftError(kind, invalid), '', kind)
      assert.equal(savePostDraft(kind, invalid), false, kind)
      assert.deepEqual(counts(), before, kind + ' invalid draft must not save')
      const valid = { ...makePostDraft(kind), title: '통합 작성 검증', body: '내용 #통합검증', amount: 12000 }
      assert.equal(postDraftError(kind, valid), '', kind)
      assert.equal(savePostDraft(kind, valid), true, kind)
    }
    assert.equal(moneyEntries.value[0].amount, -12000)
    assert.deepEqual(state.routines.value[0].goal, { count: 1, unit: '회' })
    assert.equal(workRecords.value[0].type, '연차')
    assert.equal(savePostDraft('잘못된 종류', makePostDraft('일정')), false)
    assert.notEqual(postDraftError('머니로그', { ...makePostDraft('머니로그'), title: '금액', amount: NaN }), '')
    assert.notEqual(postDraftError('D-Day', { ...makePostDraft('D-Day'), title: '날짜', date: '2026-02-30' }), '')
    const first = makePostDraft('루틴'), second = makePostDraft('루틴')
    first.days.pop(); first.attendeeIds.push(42)
    assert.equal(second.days.length, 7)
    assert.deepEqual(second.attendeeIds, [])
  } finally { collections.forEach((list, i) => list.value = backup[i]); wiki.docs = wikiBackup }
})

test('플래너: 기본 보기 저장, 유효하지 않은 값 거부, 기본 경로 반환', async () => {
  const { defaultPlannerView, plannerLanding, setDefaultPlannerView } = await load('store/plannerPreferences.js')
  const before = defaultPlannerView.value
  try {
    setDefaultPlannerView('weekly')
    assert.equal(plannerLanding(), '/planner/weekly')
    assert.equal(cache.get('timebar.planner.default-view'), 'weekly')
    setDefaultPlannerView('unknown')
    assert.equal(defaultPlannerView.value, 'weekly')
    setDefaultPlannerView('daily')
    assert.equal(plannerLanding(), '/planner/daily')
  } finally { setDefaultPlannerView(before) }
})

test('통합 작성 모달: 확장 가능한 종류 선택, 입력 스크롤 구역, 외부 폼 제출·취소 버튼 렌더링', async () => {
  const state = await load('store/appState.js')
  state.openPostComposer('루틴')
  const html = await render('components/PostComposer.vue')
  assert.match(html, /modal-toolbar/)
  assert.match(html, /modal-body/)
  assert.match(html, /modal-footer/)
  const { postKinds } = await load('store/postComposer.js')
  const selector = html.slice(html.indexOf('composer-kind-select'), html.indexOf('</select>'))
  assert.equal((selector.match(/<option/g) || []).length, postKinds.length)
  assert.doesNotMatch(html, /role="tab"/)
  assert.ok(html.indexOf('</form>') < html.indexOf('modal-footer'))
  assert.match(html.slice(html.indexOf('modal-footer')), /type="submit" form="[^"]+"/)
  assert.match(html.slice(html.indexOf('modal-footer')), /취소/)
})

test('메신저: 대화 목록과 말풍선·참여자·전송 입력창을 같은 컴포넌트에서 렌더링', async () => {
  const { chat, selectRoom } = await load('features/chat/model/chatStore.js')
  const selected = chat.selectedId
  try {
    await selectRoom('preview-group')
    const html = await render('features/chat/views/ChatWorkspace.vue', { embedded: true, active: true })
    assert.match(html, /chat-messenger/)
    assert.match(html, /chat-message-avatar/)
    assert.match(html, /aria-label="대화 목록으로"/)
    assert.match(html, /aria-label="메시지 보내기"/)
    assert.match(html, /aria-label="메시지 검색"/)
    assert.doesNotMatch(html, /<nav[^>]*class="chat-nav"/)
  } finally { chat.selectedId = selected }
})
