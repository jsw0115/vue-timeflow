import { createApp } from 'vue'
import RootApp from './RootApp.vue'
import { router } from './router'
// 디자인 토큰을 먼저, DESIGN.md 4장 공통 컴포넌트를 마지막에 불러와 기존 화면 규칙보다 우선하게 한다
import './design-system/tokens.css'
import './styles.css'
import './interaction.css'
import './typography.css'
import './design-system/components.css'
// 저장된 화면 밀도·글자 크기를 첫 렌더 전에 적용한다
import { applyAppearance } from './store/appearance'
import { applyTheme, watchSystemTheme } from './store/theme'
applyAppearance()
applyTheme()
watchSystemTheme()
createApp(RootApp).use(router).mount('#app')

