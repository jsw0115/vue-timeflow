// 경력 프로젝트·포트폴리오·이력서 저장소. 로그인하면 계정의 서버 기록을 쓰고, 로그아웃이면 화면 예시만 보인다(PR-07 7단계).
import { ref } from 'vue'
import { createFeatureStore } from '../features/records/featureStore.mjs'
import { careerKind, portfolioKind } from '../features/records/featureKinds.mjs'
import { createResumeStore } from '../features/records/resumeStore.mjs'

// 로그아웃 상태의 경력 화면은 원래 화면 메모리의 예시이고 브라우저에도 저장하지 않는다. 그래서 옮길 로컬 자료가 없다
export const careerStore = createFeatureStore({ local: ref([]), ...careerKind })
export const portfolioStore = createFeatureStore({ local: ref([]), ...portfolioKind })
export const resumeStore = createResumeStore()
