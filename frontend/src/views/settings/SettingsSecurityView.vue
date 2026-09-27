<script setup>
import { computed, ref } from 'vue'

/** 보안/계정 — 소셜 연동·기기 로그아웃·보안 옵션이 실제로 동작한다. */
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
    flash('연동 계정을 최소 1개는 유지해야 해요.')
    return
  }
  if (s.linked && !window.confirm(s.label + ' 연동을 해제할까요?')) return
  s.linked = !s.linked
  s.account = s.linked ? 'jisu@' + s.id + '.com' : ''
}
function logout(d) {
  if (d.current) return
  if (!window.confirm('‘' + d.label + '’ 기기를 로그아웃할까요?')) return
  devices.value = devices.value.filter((x) => x.id !== d.id)
  flash('해당 기기를 로그아웃했어요.')
}
function logoutAll() {
  if (!window.confirm('이 기기를 제외한 모든 기기를 로그아웃할까요?')) return
  devices.value = devices.value.filter((d) => d.current)
  flash('다른 기기를 모두 로그아웃했어요.')
}
function save() {
  saved.value = JSON.stringify(options.value)
  flash('보안 설정을 저장했어요.')
}
</script>

<template>
  <section class="card setting-content">
    <div class="setting-head">
      <div>
        <h2>보안 · 계정</h2>
        <p>로그인 방법과 접속 기기를 관리해요</p>
      </div>
      <span v-if="notice" class="badge ok">{{ notice }}</span>
    </div>

    <div class="section-label">연동된 소셜 계정 · {{ linkedCount }}개</div>
    <div class="trow" v-for="s in socials" :key="s.id">
      <span style="flex: 1">
        <b style="display: block">{{ s.label }}</b>
        <small style="color: var(--color-muted)">{{ s.linked ? s.account : '연동 안 됨' }}</small>
      </span>
      <button class="review" style="margin: 0" @click="toggleSocial(s)">{{ s.linked ? '연동 해제' : '연동하기' }}</button>
    </div>

    <div class="section-label" style="margin-top: 20px">로그인 중인 기기 · {{ devices.length }}대</div>
    <div class="trow" v-for="d in devices" :key="d.id">
      <span style="flex: 1">
        <b style="display: block">{{ d.label }}</b>
        <small style="color: var(--color-muted)">{{ d.at }}</small>
      </span>
      <span v-if="d.current" class="badge ok">현재 기기</span>
      <button v-else class="review" style="margin: 0" @click="logout(d)">로그아웃</button>
    </div>
    <button class="review" style="margin-top: 10px" :disabled="devices.length <= 1" @click="logoutAll">다른 기기 모두 로그아웃</button>

    <div class="section-label" style="margin-top: 22px">보안 옵션</div>
    <label class="task" style="border: 0; display: inline-flex;">
      <input type="checkbox" v-model="options.twoFactor" />
      <span style="flex: 1"><b>2단계 인증</b><small>로그인할 때 인증번호를 한 번 더 확인해요</small></span>
    </label>
    <label class="task" style="border: 0; display: inline-flex;">
      <input type="checkbox" v-model="options.loginAlert" />
      <span style="flex: 1"><b>새 기기 로그인 알림</b><small>처음 보는 기기에서 로그인하면 알려드려요</small></span>
    </label>
    <label class="task" style="border: 0; display: inline-flex;">
      <input type="checkbox" v-model="options.autoLogout" />
      <span style="flex: 1"><b>30분 미사용 시 자동 로그아웃</b><small>공용 기기에서 쓸 때 권장해요</small></span>
    </label>

    <button class="primary" :disabled="!isDirty" @click="save">저장하기</button>
    <p v-if="isDirty" class="form-note">저장하지 않은 변경사항이 있어요.</p>
  </section>
</template>
