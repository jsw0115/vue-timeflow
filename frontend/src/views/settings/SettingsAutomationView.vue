<script setup>
import { tr } from '../../store/locale'
import { computed, ref } from 'vue'
import { automationsByDomain, isAutomationOn, toggleAutomation, automationParam, setAutomationParam } from '../../store/automations'
import {
  AI_PROVIDERS, AI_FEATURES, AI_SCOPES, aiSettings, isAiReady, isFeatureOn, toggleFeature, setAllowSensitive,
  aiStatusBadge, takeClearedKeyNotice,
} from '../../store/aiSettings'
import { useCapabilityStatus } from '../../features/integrations/useCapabilityStatus.mjs'
import { session } from '../../features/auth/session.js'

const groups = automationsByDomain()
const tab = ref('rules')
const blockedNotice = ref('')
// AI 준비 여부는 서버 제공 상태로만 정한다. 로컬 설정만으로 "연동됨"을 보이지 않는다(BUG-002)
const { state: aiStatus, refresh: refreshAiStatus } = useCapabilityStatus(() => 'ai')
const aiBadge = computed(() => aiStatusBadge(aiStatus))
const aiReady = computed(() => isAiReady(aiStatus.available))
const clearedKeyNotice = takeClearedKeyNotice()

function onToggleFeature(f) {
  if (!toggleFeature(f.id)) {
    blockedNotice.value = tr('{name}은(는) 업무·경력 기록 사용에 동의해야 켤 수 있어요.', { name: tr(f.title) })
    setTimeout(() => (blockedNotice.value = ''), 3000)
  }
}
</script>

<template>
  <section class="card setting-content">
    <div class="setting-head">
      <div>
        <h2>{{ tr('자동화') }}</h2>
        <p>{{ tr('이미 있는 기능들을 트리거→액션으로 묶어서, 켜두기만 하면 알아서 동작하게 해요.') }}</p>
      </div>
      <span class="badge" :class="{ ok: aiBadge.ok }" role="status">{{ tr(aiBadge.text) }}</span>
    </div>
    <p v-if="clearedKeyNotice" role="status">{{ tr('보안을 위해 이 브라우저에 저장된 API 키를 지웠어요. 키를 발급한 서비스에서도 그 키를 폐기해 주세요.') }}</p>
    <p v-if="aiStatus.error" role="alert">{{ tr(aiStatus.error) }}</p>
    <button v-if="aiStatus.error && session.userId" type="button" class="button-secondary" style="align-self: flex-start" @click="refreshAiStatus">{{ tr('제공 상태 다시 확인') }}</button>

    <div class="tabs" style="width: fit-content; margin: 16px 0">
      <button :class="{ selected: tab === 'rules' }" @click="tab = 'rules'">{{ tr('자동화 규칙') }}</button>
      <button :class="{ selected: tab === 'ai' }" @click="tab = 'ai'">{{ tr('AI 연동') }}</button>
    </div>

    <template v-if="tab === 'ai'">
      <div class="callout">
        <b>{{ tr('AI에게 무엇을 보낼지 직접 고릅니다') }}</b>
        <p>
          {{ tr('기본값은 전부 꺼짐이에요. 연동을 켜도 아래에서 고른') }} <b>{{ tr('범위 안의 데이터만') }}</b> {{ tr('전송되고, 업무·경력 기록은 별도로 동의해야 포함됩니다.') }}
        </p>
      </div>

      <div class="section-label">{{ tr('연동 방식') }}</div>
      <div class="ai-providers">
        <button v-for="p in AI_PROVIDERS" :key="p.id" type="button" :class="{ selected: aiSettings.provider === p.id }" :disabled="p.disabled" :aria-disabled="p.disabled ? 'true' : undefined" :aria-pressed="aiSettings.provider === p.id" @click="aiSettings.provider = p.id">
          <b>{{ tr(p.label) }}</b><small>{{ tr(p.note) }}</small>
        </button>
      </div>

      <div class="section-label" style="margin-top: 20px">{{ tr('보낼 데이터 범위') }}</div>
      <div class="filter" style="width: fit-content; margin: 8px 0">
        <button v-for="s in AI_SCOPES" :key="s.id" :class="{ selected: aiSettings.scope === s.id }" @click="aiSettings.scope = s.id">{{ tr(s.label) }}</button>
      </div>
      <p class="form-note">{{ tr(AI_SCOPES.find((s) => s.id === aiSettings.scope).desc) }}</p>

      <label class="task" style="border: 0; display: inline-flex;">
        <input type="checkbox" :checked="aiSettings.allowSensitive" @change="setAllowSensitive($event.target.checked)" />
        <span style="flex: 1"><b>{{ tr('업무·경력 기록 포함 허용') }}</b><small>{{ tr('업무 카테고리와 경력기술서 내용을 AI 입력에 포함해요 (기본 꺼짐)') }}</small></span>
      </label>
      <label class="task" style="border: 0; display: inline-flex;">
        <input type="checkbox" v-model="aiSettings.redactNames" />
        <span style="flex: 1"><b>{{ tr('사람 이름 가리기') }}</b><small>{{ tr('보내기 전에 이름을 익명 기호로 바꿔요') }}</small></span>
      </label>
      <label class="task" style="border: 0; display: inline-flex;">
        <input type="checkbox" v-model="aiSettings.keepHistory" />
        <span style="flex: 1"><b>{{ tr('요청·응답 기록 보관') }}</b><small>{{ tr('무엇을 보냈는지 나중에 확인할 수 있어요') }}</small></span>
      </label>

      <div class="section-label" style="margin-top: 20px">{{ tr('AI가 만들어주는 것') }}</div>
      <p v-if="blockedNotice" class="badge warn" style="display: inline-block">{{ blockedNotice }}</p>
      <div class="trow" v-for="f in AI_FEATURES" :key="f.id">
        <span style="flex: 1; min-width: 0">
          <b style="display: block">{{ tr(f.title) }}<span v-if="f.sensitive" class="badge danger" style="margin-left: 6px">{{ tr('민감') }}</span></b>
          <small>{{ tr(f.desc) }}</small>
          <small style="display: block; margin-top: 4px; color: var(--color-muted)">{{ tr('입력: {list}', { list: f.needs.map((need) => tr(need)).join(' · ') }) }}</small>
        </span>
        <button type="button" role="switch" class="toggle" :aria-label="tr(f.title)" :aria-checked="isFeatureOn(f.id, aiStatus.available)" :class="{ on: isFeatureOn(f.id, aiStatus.available) }" :disabled="!aiReady" aria-describedby="ai-feature-note" style="flex: none" @click="onToggleFeature(f)"><em></em></button>
      </div>
      <p id="ai-feature-note" class="form-note">{{ tr(aiReady ? '켠 산출물만 고른 범위 안의 데이터로 만들어요.' : aiStatus.available === false ? 'AI 기능은 준비 중이라 지금은 켤 수 없어요.' : aiStatus.available === true ? '연동 방식을 ‘기본 제공(서버)’로 고르면 켤 수 있어요.' : '서버의 AI 제공 상태를 확인한 뒤 켤 수 있어요.') }}</p>
    </template>

    <!-- 규칙은 켜짐 여부만 이 브라우저(localStorage)에 남고, 이 값으로 메일·알림을 보내거나 기록을 만드는 코드는 없다(PR-32 12단계 확인) -->
    <p v-if="tab === 'rules'" class="sample-label">{{ tr('자동화 규칙은 켜고 끈 상태만 이 브라우저에 남아요. 아직 이 설정으로 실제 메일·알림을 보내거나 기록을 만들지는 않아요.') }}</p>
    <template v-for="(items, domain) in groups" v-else :key="domain">
      <div class="section-label">{{ tr(domain) }}</div>
      <div class="trow" v-for="a in items" :key="a.id">
        <span style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0">
          <i style="width: 30px; height: 30px; border-radius: 9px; background: var(--color-surface); color: var(--color-foreground); font-style: normal; display: flex; align-items: center; justify-content: center; flex: none">{{ a.icon }}</i>
          <span style="min-width: 0">
            <b style="display: block">{{ tr(a.title) }}</b>
            <small>{{ tr(a.desc) }}</small>
            <div v-if="a.param && isAutomationOn(a.id)" style="display: flex; align-items: center; gap: 8px; margin-top: 8px">
              <small style="color: var(--color-muted)">{{ tr(a.param.label) }}</small>
              <input
                type="number"
                :min="a.param.min"
                :max="a.param.max"
                :value="automationParam(a.id)"
                @input="setAutomationParam(a.id, Number($event.target.value))"
                style="width: 56px; padding: 5px 7px; font-size: 0.8125rem"
              />
              <small style="color: var(--color-muted)">{{ tr('{unit} 이상', { unit: tr(a.param.unit) }) }}</small>
            </div>
          </span>
        </span>
        <button type="button" role="switch" class="toggle" :aria-label="tr(a.title)" :aria-checked="isAutomationOn(a.id)" :class="{ on: isAutomationOn(a.id) }" @click="toggleAutomation(a.id)" style="flex: none"><em></em></button>
      </div>
    </template>

    <p v-if="tab === 'rules'" class="form-note" style="margin-top: 16px">{{ tr('더 세밀한 발송 채널·시간대는 알림 설정에서 조절할 수 있어요.') }}</p>
  </section>
</template>
