import { watch } from 'vue'
import { tasks, events, routines } from './appState'
import { diaries, memos } from './writing'
import { communities, challenges } from './communities'
import { syncPostCollection } from './tagging'
import { ddays } from './ddays'
import { communityPosts } from './communityPosts'
import { plannerReviews } from './plannerReviews'
for (const [source, list, kind, link] of [
  ['community', communities, '커뮤니티', item => '/community/home?id=' + item.id],
  ['challenge', challenges, '챌린지', item => '/community/challenge?id=' + item.id],
  ['dday', ddays, 'D-day', item => '/dday/' + item.id],
  ['board', communityPosts, '게시글', item => '/community/board#post-' + item.id],
  ['planner', plannerReviews, '플래너', item => '/planner?date=' + item.id],
  ['task', tasks, '할 일', item => '/tasks/' + item.id],
  ['event', events, '일정', '/events'],
  ['routine', routines, '루틴', '/routines'],
  ['memo', memos, '메모', '/memos'],
  ['diary', diaries, '다이어리', item => '/diary/entry?id=' + item.id],
]) watch(list, items => syncPostCollection(source, items, kind, link), { deep: true, immediate: true })
