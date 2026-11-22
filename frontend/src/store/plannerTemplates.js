// 플래너 템플릿 저장소(Q-29). 로그인하면 계정의 서버 템플릿(/api/planner/templates)을 쓰고, 로그아웃이면 저장하지 않는다(화면은 예시를 보인다).
import { ref } from 'vue'
import { createFeatureStore } from '../features/records/featureStore.mjs'

export const plannerTemplateStore = createFeatureStore({ local: ref([]), path: '/api/planner/templates', kind: 'planner-template', fields: ['title', 'color', 'blocks'], demoFields: ['title'] })
