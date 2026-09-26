import { watch } from 'vue'
import { tasks, events, routines } from './appState'
import { diaries, memos } from './writing'
import { communities, challenges } from './communities'
import { syncPostCollection } from './tagging'
for (const [source, list, kind, link] of [
  ['community', communities, '커뮤니티', item => '/community/home?id=' + item.id],
  ['challenge', challenges, '챌린지', '/community/challenge'],
  ['task', tasks, '할 일', item => '/tasks/' + item.id],
  ['event', events, '일정', '/events'],
  ['routine', routines, '루틴', '/routines'],
  ['memo', memos, '메모', '/memos'],
  ['diary', diaries, '다이어리', item => '/diary/entry?id=' + item.id],
]) watch(list, items => syncPostCollection(source, items, kind, link), { deep: true, immediate: true })
