import { computed } from 'vue'
import { session } from '../../auth/session'

export const isChatPreview = computed(() => !session.accessToken)
export const chatUserId = computed(() => session.userId || 'preview-jisoo')
