// WBS 노드를 로그인하면 계정에, 로그아웃이면 이 브라우저에 저장한다. 시연 노드는 계정으로 옮기지 않는다(PR-10 4단계, UF-51).
import { localCollection } from './localCollection'
import { createFeatureStore } from '../features/records/featureStore.mjs'
import { wbsKind } from '../features/records/featureKinds.mjs'

export const WBS_SEEDS = [
  { id: 1, parentId: null, title: '타임바 리뉴얼', md: 0, progress: 0, owner: '김지수', open: true },
  { id: 2, parentId: 1, title: '요구사항 정리', md: 0, progress: 0, owner: '김지수', open: true },
  { id: 3, parentId: 2, title: '사용자 인터뷰', md: 2, progress: 100, owner: '김지수' },
  { id: 4, parentId: 2, title: '기능 명세 작성', md: 3, progress: 60, owner: '이서연' },
  { id: 5, parentId: 1, title: '화면 개발', md: 0, progress: 0, owner: '박민준', open: true },
  { id: 6, parentId: 5, title: '홈·플래너', md: 8, progress: 45, owner: '박민준' },
  { id: 7, parentId: 5, title: '통계·리포트', md: 6, progress: 20, owner: '최지우' },
]

export const wbsStore = createFeatureStore({ local: localCollection('wbs', WBS_SEEDS.map((node) => ({ ...node }))), ...wbsKind })
export const wbsNodes = wbsStore.list
