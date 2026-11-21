// 커리어 활동 원장과 취업·이직 지원 기록 저장소. 로그인하면 계정의 서버 기록을 쓰고, 로그아웃이면 저장하지 않는다.
import { ref } from 'vue'
import { createFeatureStore } from '../features/records/featureStore.mjs'
import { activityKind, applicationKind } from '../features/career/careerModel.mjs'

// 로그아웃 상태에서는 브라우저에도 저장하지 않는다. 화면은 로그인 안내만 보이고 시연 자료를 실제 기록처럼 보이지 않는다
export const activityStore = createFeatureStore({ local: ref([]), ...activityKind })
export const applicationStore = createFeatureStore({ local: ref([]), ...applicationKind })
