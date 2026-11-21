// 커리어 목표 상태. 로그인하면 계정의 career 설정을 읽고, 로그아웃이면 이 브라우저 값을 쓴다.
import { reactive, watch } from 'vue'
import { session } from '../features/auth/session.js'
import { apiRequest } from '../features/auth/apiRequest.js'
import { cleanGoal, createCareerGoalAccount, goalErrorText, GOAL_STORAGE_KEY } from '../features/career/careerGoalAccount.mjs'

const account = createCareerGoalAccount({ request: apiRequest })

function readLocal() {
  try { return cleanGoal(localStorage.getItem(GOAL_STORAGE_KEY)) } catch { return null }
}
function writeLocal(goal) {
  try { localStorage.setItem(GOAL_STORAGE_KEY, goal) } catch { /* 저장소를 쓸 수 없으면 이번 화면에서만 유지한다 */ }
}

/** goal이 null이면 아직 고르지 않았다는 뜻이다. 화면은 기본 목표 순서를 쓰고 '목표 고르기'를 안내한다. */
export const careerGoal = reactive({ goal: readLocal(), status: 'idle', message: '', source: 'local' })

watch(() => session.userId, async (id) => {
  if (!id) { Object.assign(careerGoal, { goal: readLocal(), source: 'local', status: 'idle', message: '' }); return }
  careerGoal.status = 'loading'
  try {
    const saved = await account.load()
    if (session.userId !== id) return
    Object.assign(careerGoal, { goal: saved ?? careerGoal.goal, source: 'server', status: 'idle', message: '' })
  } catch {
    if (session.userId === id) Object.assign(careerGoal, { status: 'error', message: '계정의 커리어 목표를 불러오지 못했어요. 이 브라우저 값을 보여 드려요.' })
  }
}, { immediate: true })

/** 저장이 끝난 뒤에만 완료 상태를 보인다. 실패하면 이전 목표를 유지한다. */
export async function chooseCareerGoal(goal) {
  const clean = cleanGoal(goal)
  if (!clean || careerGoal.status === 'saving') return false
  if (!session.userId) {
    writeLocal(clean)
    Object.assign(careerGoal, { goal: clean, source: 'local', status: 'saved', message: '이 브라우저에 저장했어요.' })
    return true
  }
  careerGoal.status = 'saving'
  try {
    const saved = await account.save(clean)
    writeLocal(saved)
    Object.assign(careerGoal, { goal: saved, source: 'server', status: 'saved', message: '계정에 저장했어요.' })
    return true
  } catch (error) {
    Object.assign(careerGoal, { status: 'failed', message: goalErrorText(error) })
    return false
  }
}
