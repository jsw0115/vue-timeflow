// 로그인 전에 이 브라우저에 남긴 기록을 계정으로 옮기는 안내의 대상 종류를 모은다(PR-07 3단계, UF-86). 4~7단계에서 종류를 더한다.
import { createLocalMigration } from '../features/records/localMigration.mjs'
import { taskStore, TASK_SEEDS, eventStore, EVENT_SEEDS, routineStore, ROUTINE_SEEDS } from './appState'
import { diaryStore, memoStore, MEMO_SEEDS } from './writing'
import { ddayStore, DDAY_SEEDS } from './ddays'
import { moneyStore, MONEY_SEEDS } from './money'
import { workRecordStore } from './workRecords'
import { wbsStore, WBS_SEEDS } from './wbs'
import { wikiStore, WIKI_SEEDS } from './wiki'

export const localMigration = createLocalMigration({
  entries: [
    taskStore.migrationEntry({ label: '할 일', seeds: TASK_SEEDS }),
    eventStore.migrationEntry({ label: '일정', seeds: EVENT_SEEDS }),
    routineStore.migrationEntry({ label: '루틴', seeds: ROUTINE_SEEDS }),
    diaryStore.migrationEntry({ label: '다이어리', seeds: [] }),
    memoStore.migrationEntry({ label: '메모', seeds: MEMO_SEEDS }),
    ddayStore.migrationEntry({ label: 'D-Day', seeds: DDAY_SEEDS }),
    moneyStore.migrationEntry({ label: '머니로그', seeds: MONEY_SEEDS }),
    // 업무 기록·WBS·위키(PR-10 4단계). WBS·위키는 부모를 먼저 옮긴다
    workRecordStore.migrationEntry({ label: '업무 기록', seeds: [] }),
    wbsStore.migrationEntry({ label: 'WBS', seeds: WBS_SEEDS }),
    wikiStore.migrationEntry({ label: '업무 위키', seeds: WIKI_SEEDS }),
  ],
})
