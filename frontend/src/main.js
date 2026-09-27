import { createApp } from 'vue'
import RootApp from './RootApp.vue'
import { router } from './router'
import './styles.css'
import './interaction.css'
import './typography.css'
// 저장된 화면 밀도·글자 크기를 첫 렌더 전에 적용한다
import { applyAppearance } from './store/appearance'
import { applyTheme, watchSystemTheme } from './store/theme'
applyAppearance()
applyTheme()
watchSystemTheme()
createApp(RootApp).use(router).mount('#app')

