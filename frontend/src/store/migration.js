// 로그인 전에 이 브라우저에 남긴 기록을 계정으로 옮기는 안내의 대상 종류를 모은다(PR-07 3단계, UF-86). 4~7단계에서 종류를 더한다.
import { createLocalMigration } from '../features/records/localMigration.mjs'
import { taskStore, TASK_SEEDS } from './appState'

export const localMigration = createLocalMigration({
  entries: [taskStore.migrationEntry({ label: '할 일', seeds: TASK_SEEDS })],
})
