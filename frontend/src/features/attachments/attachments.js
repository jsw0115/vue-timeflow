// 공유 첨부 화면이 쓰는 서버 클라이언트. 로그인 토큰을 붙이는 apiRequest·authorizedFetch로 부른다(PR-10 5단계).
import { apiRequest } from '../auth/apiRequest.js'
import { authorizedFetch } from '../auth/session.js'
import { createAttachmentClient } from './attachmentClient.mjs'

export const attachmentClient = createAttachmentClient({ request: apiRequest, fetcher: authorizedFetch })
