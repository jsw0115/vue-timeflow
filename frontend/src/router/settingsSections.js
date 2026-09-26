import SettingsProfileView from '../views/settings/SettingsProfileView.vue'
import SettingsEnvView from '../views/settings/SettingsEnvView.vue'
import SettingsFormStyleView from '../views/settings/SettingsFormStyleView.vue'
import SettingsThemeView from '../views/settings/SettingsThemeView.vue'
import SettingsWidgetsView from '../views/settings/SettingsWidgetsView.vue'
import SettingsAutomationView from '../views/settings/SettingsAutomationView.vue'
import SettingsNotificationsView from '../views/settings/SettingsNotificationsView.vue'
import SettingsSecurityView from '../views/settings/SettingsSecurityView.vue'
import SettingsCategoryView from '../views/settings/SettingsCategoryView.vue'
import SettingsDataView from '../views/settings/SettingsDataView.vue'
import SettingsSupportView from '../views/settings/SettingsSupportView.vue'
import SettingsIntegrationsView from '../views/settings/SettingsIntegrationsView.vue'
import SettingsBillingView from '../views/settings/SettingsBillingView.vue'
import TrashView from '../views/trash/TrashView.vue'

/**
 * 환경설정 구역 정의.
 * LNB에는 "환경설정" 버튼 하나만 두고, 실제 항목은 설정 화면 좌측 메뉴에서 고른다.
 * 항목을 고르면 우측 데이터 영역만 바뀐다(관리자 콘솔과 동일한 구조).
 */
export const SETTINGS_GROUPS = [
  {
    label: '내 계정',
    items: [
      { id: 'profile', label: '프로필', icon: '☺', desc: '닉네임·사진·비밀번호', component: SettingsProfileView },
      { id: 'security', label: '보안 · 계정', icon: '⊘', desc: '로그인과 계정 보호', component: SettingsSecurityView },
      { id: 'billing', label: '구독 · 멤버십', icon: '★', desc: '요금제와 결제', component: SettingsBillingView },
    ],
  },
  {
    label: '화면 · 작성',
    items: [
      { id: 'env', label: '환경 설정', icon: '⚙', desc: '기본 모드·화면 밀도·기본값', component: SettingsEnvView },
      { id: 'forms', label: '글양식 · 화면 구성', icon: '✎', desc: '모드별 작성 항목과 포틀릿', component: SettingsFormStyleView },
      { id: 'theme', label: '테마 · 디자인', icon: '◑', desc: '표면 테마와 포인트 컬러', component: SettingsThemeView },
      { id: 'widgets', label: '위젯 설정', icon: '▦', desc: '홈 위젯 표시와 크기', component: SettingsWidgetsView },
    ],
  },
  {
    label: '알림 · 자동화',
    items: [
      { id: 'notifications', label: '알림 설정', icon: '◈', desc: '채널·카테고리·알림톡', component: SettingsNotificationsView },
      { id: 'automation', label: '자동화 · AI', icon: '⚡', desc: '자동 규칙과 AI 연동', component: SettingsAutomationView },
    ],
  },
  {
    label: '데이터',
    items: [
      { id: 'category', label: '카테고리', icon: '▧', desc: '기록 분류 기준', component: SettingsCategoryView },
      { id: 'integrations', label: '연동 설정', icon: '⇄', desc: '외부 캘린더 연결', component: SettingsIntegrationsView },
      { id: 'data', label: '데이터 관리', icon: '⇅', desc: '백업·내보내기·가져오기', component: SettingsDataView },
      { id: 'trash', label: '휴지통', icon: '⊗', desc: '삭제한 항목 복구', component: TrashView },
    ],
  },
  {
    label: '도움',
    items: [{ id: 'support', label: '고객지원', icon: '♧', desc: '문의와 도움말', component: SettingsSupportView }],
  },
]

export const SETTINGS_SECTIONS = SETTINGS_GROUPS.flatMap((g) => g.items)

export function findSection(id) {
  return SETTINGS_SECTIONS.find((s) => s.id === id) ?? null
}
