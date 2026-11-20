// 로컬에 저장하는 글을 검색·태그·멘션 색인에 등록한다. 커뮤니티·챌린지·게시글은 서버로 옮겨 색인하지 않는다(PR-10 3b-2).
import { watch } from 'vue'
import { tasks, events, routines } from './appState'
import { diaries, memos } from './writing'
import { posts, syncPostCollection } from './tagging'
import { ddays } from './ddays'
import { plannerReviews } from './plannerReviews'
import { workRecords } from './workRecords'
import { moneyEntries } from './money'
for (const [source, list, kind, link] of [
  ['dday', ddays, 'D-day', item => '/dday/' + item.id],
  ['planner', plannerReviews, '플래너', item => '/planner/daily?date=' + item.id],
  ['task', tasks, '할 일', item => '/tasks/' + item.id],
  ['event', events, '일정', '/events'],
  ['routine', routines, '루틴', '/routines'],
  ['memo', memos, '메모', '/memos'],
  ['diary', diaries, '다이어리', item => '/diary/entry?id=' + item.id],
  ['work-record', workRecords, '업무 기록', '/work/wbs'],
  ['money', moneyEntries, '머니로그', item => '/money?month=' + item.date.slice(0, 7)],
]) watch(list, items => syncPostCollection(source, items, kind, link), { deep: true, immediate: true })

// 예전에 색인된 커뮤니티·챌린지·게시글 항목은 로컬 시연 자료라 눌러도 열리지 않는다. 브라우저에 남은 것도 지운다(PR-10 3b-2).
const retired = (post) => String(post.link ?? '').startsWith('/community/')
if (posts.value.some(retired)) posts.value = posts.value.filter((post) => !retired(post))
