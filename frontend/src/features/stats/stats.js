// 통계 화면이 쓰는 서버 클라이언트. 로그인 토큰을 붙이는 apiRequest로 부른다(PR-10 6단계).
import { apiRequest } from '../auth/apiRequest.js'
import { createStatsClient } from './statsClient.mjs'

export const statsClient = createStatsClient({ request: apiRequest })
