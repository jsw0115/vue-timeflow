<script setup>
import { bodyLocale, tr } from '../../store/locale'
import { computed, ref } from 'vue'
import SignOutSection from '../../components/SignOutSection.vue'

/**
 * 보안/계정 — "이 기기에서 로그아웃"(SignOutSection)만 서버와 동작한다. 소셜 연동·기기 목록·보안 옵션은 서버 경로가 없는 시연이라
 * 화면 안에서만 바뀐다. 예전 문구("다른 기기를 모두 로그아웃했어요" 등)는 실제처럼 보여 사실대로 고쳤다(PR-32 12단계).
 */
const socials = ref([
  { id: 'google', label: 'Google', account: 'jisu@gmail.com', linked: true },
  { id: 'kakao', label: 'Kakao', account: '', linked: false },
  { id: 'apple', label: 'Apple', account: '', linked: false },
])
const devices = ref([
  { id: 1, label: 'Chrome · Windows', current: true, at: '지금 사용 중' },
  { id: 2, label: 'Safari · iPhone 15', current: false, at: '2일 전' },
  { id: 3, label: 'Chrome · macOS', current: false, at: '3주 전' },
])
const options = ref({ twoFactor: false, loginAlert: true, autoLogout: false })
const saved = ref(JSON.stringify(options.value))
const notice = ref('')

const isDirty = computed(() => JSON.stringify(options.value) !== saved.value)
const linkedCount = computed(() => socials.value.filter((s) => s.linked).length)

function flash(text) {
  notice.value = text
  setTimeout(() => (notice.value = ''), 2500)
}
function toggleSocial(s) {
  if (s.linked && linkedCount.value <= 1) {
    flash(tr('연동 계정을 최소 1개는 유지해야 해요.'))
    return
  }
  if (s.linked && !window.confirm(tr('{name} 연동을 해제할까요?', { name: s.label }))) return
  s.linked = !s.linked
  s.account = s.linked ? 'jisu@' + s.id + '.com' : ''
}
function logout(d) {
  if (d.current) return
  if (!window.confirm(tr('‘{name}’ 기기를 로그아웃할까요?', { name: d.label }))) return
  devices.value = devices.value.filter((x) => x.id !== d.id)
  flash(tr('시연 목록에서만 뺐어요. 실제 기기는 로그아웃되지 않았어요.'))
}
function logoutAll() {
  if (!window.confirm(tr('이 기기를 제외한 모든 기기를 로그아웃할까요?'))) return
  devices.value = devices.value.filter((d) => d.current)
  flash(tr('시연 목록에서만 뺐어요. 실제 기기는 로그아웃되지 않았어요.'))
}
function save() {
  saved.value = JSON.stringify(options.value)
  flash(tr('이 화면에서만 바꿨어요. 계정에는 저장되지 않아요.'))
}
</script>

<template>
  <section class="card setting-content">
    <div class="setting-head">
      <div>
        <h2>{{ tr('보안 · 계정') }}</h2>
        <p>{{ tr('로그인 방법과 접속 기기를 관리해요') }}</p>
      </div>
      <span v-if="notice" class="badge ok" role="status">{{ notice }}</span>
    </div>

    <SignOutSection />
    <p class="sample-label">{{ tr('아래 소셜 연동·로그인 기기·보안 옵션은 시연용 예시예요. 계정에 저장되지 않고, 실제 연동이나 기기에 반영되지 않아요.') }}</p>
    <div class="section-label">{{ tr('연동된 소셜 계정') }} · {{ linkedCount }}<template v-if="bodyLocale === 'ko'">개</template></div>
    <div class="trow" v-for="s in socials" :key="s.id">
      <span style="flex: 1">
        <b style="display: block">{{ s.label }}</b>
        <small style="color: var(--color-muted)">{{ s.linked ? s.account : tr('연동 안 됨') }}</small>
      </span>
      <button class="review" style="margin: 0" @click="toggleSocial(s)">{{ s.linked ? tr('연동 해제') : tr('연동하기') }}</button>
    </div>

    <div class="section-label" style="margin-top: 20px">{{ tr('로그인 중인 기기') }} · {{ devices.length }}<template v-if="bodyLocale === 'ko'">대</template></div>
    <div class="trow" v-for="d in devices" :key="d.id">
      <span style="flex: 1">
        <b style="display: block">{{ d.label }}</b>
        <small style="color: var(--color-muted)">{{ tr(d.at) }}</small>
      </span>
      <span v-if="d.current" class="badge ok">{{ tr('현재 기기') }}</span>
      <button v-else class="review" style="margin: 0" @click="logout(d)">{{ tr('로그아웃') }}</button>
    </div>
    <button class="review" style="margin-top: 10px" :disabled="devices.length <= 1" @click="logoutAll">{{ tr('다른 기기 모두 로그아웃') }}</button>

    <div class="section-label" style="margin-top: 22px">{{ tr('보안 옵션') }}</div>
    <label class="task" style="border: 0; display: inline-flex;">
      <input type="checkbox" v-model="options.twoFactor" />
      <span style="flex: 1"><b>{{ tr('2단계 인증') }}</b><small>{{ tr('로그인할 때 인증번호를 한 번 더 확인해요') }}</small></span>
    </label>
    <label class="task" style="border: 0; display: inline-flex;">
      <input type="checkbox" v-model="options.loginAlert" />
      <span style="flex: 1"><b>{{ tr('새 기기 로그인 알림') }}</b><small>{{ tr('처음 보는 기기에서 로그인하면 알려드려요') }}</small></span>
    </label>
    <label class="task" style="border: 0; display: inline-flex;">
      <input type="checkbox" v-model="options.autoLogout" />
      <span style="flex: 1"><b>{{ tr('30분 미사용 시 자동 로그아웃') }}</b><small>{{ tr('공용 기기에서 쓸 때 권장해요') }}</small></span>
    </label>

    <button class="primary" :disabled="!isDirty" @click="save">{{ tr('저장하기') }}</button>
    <p v-if="isDirty" class="form-note">{{ tr('저장하지 않은 변경사항이 있어요.') }}</p>
  </section>
</template>
