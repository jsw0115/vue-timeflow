<script setup>
import { computed, reactive, ref } from 'vue'
import { audit, auditLogs } from '../../store/adminOps'

/**
 * 관리자 설정 — 사용자 설정 화면과 같은 좌측 메뉴 + 우측 폼 구조를 그대로 쓴다.
 * 값을 바꾸면 사용자 설정과 마찬가지로 저장 버튼을 눌러야 반영되고, 감사 로그에 남는다.
 */
const SECTIONS = [
  { id: 'service', label: '서비스 정책' },
  { id: 'members', label: '운영자 권한' },
  { id: 'security', label: '보안' },
  { id: 'retention', label: '보관 정책' },
]
const section = ref('service')

const draft = reactive({
  serviceName: '타임바 다이어리',
  signupOpen: true,
  requireEmailVerify: true,
  defaultMode: 'B',
  maxGroupsPerUser: 10,
  passwordMinLength: 8,
  sessionHours: 24,
  twoFactorForAdmins: true,
  ipAllowlist: '',
  trashRetentionDays: 30,
  auditRetentionDays: 365,
  attachmentRetentionDays: 90,
  inactiveAccountMonths: 12,
})
const saved = ref('')

const admins = ref([
  { id: 1, name: '운영자A', role: '최고 관리자', scopes: ['전체'] },
  { id: 2, name: '운영자B', role: '운영자', scopes: ['CS', '콘텐츠'] },
  { id: 3, name: '운영자C', role: '읽기 전용', scopes: ['통계'] },
])
const ROLES = ['최고 관리자', '운영자', '읽기 전용']

function save() {
  audit('시스템', '관리자 설정 저장', SECTIONS.find((s) => s.id === section.value).label)
  saved.value = '저장했어요'
  setTimeout(() => (saved.value = ''), 2000)
}
function changeRole(a, role) {
  if (a.role === role) return
  const before = a.role
  a.role = role
  audit('권한 변경', '운영자 권한 변경', a.name, before + ' → ' + role)
}
const recentAudits = computed(() => auditLogs.value.slice(0, 3))
</script>

<template>
  <div class="settings">
    <nav class="setting-menu card">
      <button v-for="s in SECTIONS" :key="s.id" :class="{ active: section === s.id }" @click="section = s.id">
        {{ s.label }}<span>›</span>
      </button>
    </nav>

    <section class="card setting-content">
      <div class="setting-head">
        <div>
          <h2>{{ SECTIONS.find((s) => s.id === section).label }}</h2>
          <p>변경하면 감사 로그에 기록돼요</p>
        </div>
        <span v-if="saved" class="badge ok">{{ saved }}</span>
      </div>

      <!-- 서비스 정책 -->
      <template v-if="section === 'service'">
        <label>서비스 이름<input v-model="draft.serviceName" /></label>
        <label>신규 가입 기본 모드
          <select v-model="draft.defaultMode"><option value="J">J형 · 계획형</option><option value="P">P형 · 즉흥형</option><option value="B">밸런스형</option></select>
        </label>
        <label>사용자당 그룹 개수 제한<input type="number" min="1" max="100" v-model.number="draft.maxGroupsPerUser" /></label>
        <label class="task" style="border: 0;display: inline-flex;">
          <input type="checkbox" style="flex-shrink: 0;" v-model="draft.signupOpen" />
          <span style="flex: 1"><b>신규 가입 허용</b><small>끄면 초대받은 사용자만 가입할 수 있어요</small></span>
        </label>
        <label class="task" style="border: 0;display: inline-flex;">
          <input type="checkbox" style="flex-shrink: 0;" v-model="draft.requireEmailVerify" />
          <span style="flex: 1"><b>이메일 인증 필수</b><small>인증 전에는 커뮤니티 활동을 제한해요</small></span>
        </label>
      </template>

      <!-- 운영자 권한 -->
      <template v-else-if="section === 'members'">
        <div class="trow" v-for="a in admins" :key="a.id">
          <span style="flex: 1">
            <b style="display: block">{{ a.name }}</b>
            <small style="color: var(--color-muted)">담당: {{ a.scopes.join(' · ') }}</small>
          </span>
          <select class="mini-select" :value="a.role" @change="changeRole(a, $event.target.value)">
            <option v-for="r in ROLES" :key="r">{{ r }}</option>
          </select>
        </div>
        <p class="form-note">읽기 전용 운영자는 상태를 바꾸는 버튼이 비활성화돼요.</p>
      </template>

      <!-- 보안 -->
      <template v-else-if="section === 'security'">
        <label>비밀번호 최소 길이<input type="number" min="8" max="64" v-model.number="draft.passwordMinLength" /></label>
        <label>세션 유지 시간(시간)<input type="number" min="1" max="720" v-model.number="draft.sessionHours" /></label>
        <label>관리자 IP 허용 목록<input v-model="draft.ipAllowlist" placeholder="쉼표로 구분 · 비우면 제한 없음" /></label>
        <label class="task" style="border: 0;display: inline-flex;">
          <input type="checkbox" style="flex-shrink: 0;" v-model="draft.twoFactorForAdmins" />
          <span style="flex: 1"><b>관리자 2단계 인증 필수</b><small>운영자 계정은 OTP 없이 로그인할 수 없어요</small></span>
        </label>
      </template>

      <!-- 보관 정책 -->
      <template v-else>
        <label>휴지통 보관 기간(일)<input type="number" min="1" max="365" v-model.number="draft.trashRetentionDays" /></label>
        <label>감사 로그 보관 기간(일)<input type="number" min="30" max="3650" v-model.number="draft.auditRetentionDays" /></label>
        <label>공유 첨부파일 보관 기간(일)<input type="number" min="1" max="365" v-model.number="draft.attachmentRetentionDays" /></label>
        <label>휴면 계정 전환(개월)<input type="number" min="3" max="60" v-model.number="draft.inactiveAccountMonths" /></label>
        <p class="form-note">보관 기간이 지난 데이터는 자동으로 정리돼요. 감사 로그는 최소 30일 이상으로만 설정할 수 있어요.</p>
      </template>

      <button class="primary" @click="save">저장하기</button>

      <div class="section-label" style="margin-top: 22px">최근 관리자 활동</div>
      <div class="event" v-for="l in recentAudits" :key="l.id">
        <i></i>
        <span style="flex: 1"><b>{{ l.action }}</b><small>{{ l.admin }} · {{ l.target }}</small></span>
        <small class="figure">{{ l.at }}</small>
      </div>
    </section>
  </div>
</template>
