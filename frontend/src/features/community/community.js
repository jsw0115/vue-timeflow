// 커뮤니티·챌린지 화면들이 함께 쓰는 서버 클라이언트. 로그인 토큰을 붙이는 apiRequest로 부른다(PR-10 3단계, 3b-2).
import { apiRequest } from '../auth/apiRequest.js'
import { createCommunityClient } from './communityClient.mjs'
import { createChallengeClient } from './challengeClient.mjs'

export const communityClient = createCommunityClient({ request: apiRequest })
export const challengeClient = createChallengeClient({ request: apiRequest })
