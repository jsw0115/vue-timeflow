// 업무 기록(연차·반차·외근·출장·이직)을 로그인하면 계정에, 로그아웃이면 이 브라우저에 저장한다(PR-10 4단계, UF-50).
import { localCollection } from './localCollection'
import { createFeatureStore } from '../features/records/featureStore.mjs'
import { workRecordKind } from '../features/records/featureKinds.mjs'

export const workRecordStore = createFeatureStore({ local: localCollection('work-records'), ...workRecordKind })
export const workRecords = workRecordStore.list
