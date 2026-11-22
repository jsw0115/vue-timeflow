// 로그인 계정의 서버 주소록(Q-21). 로그아웃 상태의 시연 주소록(store/contacts.js)과 따로 둔다: 연락처 기록 ID가 계정 ID처럼 참석자·담당자로 쓰이지 않게 하려는 것이다.
import { computed, ref } from 'vue'
import { apiRequest } from '../features/auth/apiRequest.js'
import { createRecordClient } from '../features/records/recordClient.mjs'
import { createSyncedCollection } from '../features/records/syncedCollection.mjs'
import { CONTACT_PATH, assignablePeople, contactBody, linkAccount, unlinkAccount } from '../features/address/accountContacts.mjs'

export const accountContactStore = createSyncedCollection({ local: ref([]), client: createRecordClient({ request: apiRequest, path: CONTACT_PATH, paged: true }), toBody: contactBody })
export const accountContacts = accountContactStore.list
export const assignableContacts = computed(() => assignablePeople(accountContacts.value))
export async function linkContact(contact) { await linkAccount(apiRequest, contact); await accountContactStore.reload() }
export async function unlinkContact(contact) { await unlinkAccount(apiRequest, contact); await accountContactStore.reload() }
