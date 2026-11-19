// 커뮤니티 화면들이 함께 쓰는 서버 클라이언트. 로그인 토큰을 붙이는 apiRequest로 부른다(PR-10 3단계).
import { apiRequest } from '../auth/apiRequest.js'
import { createCommunityClient } from './communityClient.mjs'

export const communityClient = createCommunityClient({ request: apiRequest })
