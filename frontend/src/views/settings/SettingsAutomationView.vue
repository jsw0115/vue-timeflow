<script setup>
import { ref } from 'vue'
import { automationsByDomain, isAutomationOn, toggleAutomation, automationParam, setAutomationParam } from '../../store/automations'
import {
  AI_PROVIDERS, AI_FEATURES, AI_SCOPES, aiSettings, isAiReady, isFeatureOn, toggleFeature, setAllowSensitive,
} from '../../store/aiSettings'

const groups = automationsByDomain()
const tab = ref('rules')
const blockedNotice = ref('')

function onToggleFeature(f) {
  if (!toggleFeature(f.id)) {
    blockedNotice.value = f.title + '은(는) 업무·경력 기록 사용에 동의해야 켤 수 있어요.'
    setTimeout(() => (blockedNotice.value = ''), 3000)
  }
}
</script>

<template>
  <section class="card setting-content">
    <div class="setting-head">
      <div>
        <h2>자동화</h2>
        <p>이미 있는 기능들을 트리거→액션으로 묶어서, 켜두기만 하면 알아서 동작하게 해요.</p>
      </div>
      <span class="badge" :class="isAiReady() ? 'ok' : ''">{{ isAiReady() ? 'AI 연동됨' : 'AI 미연동' }}</span>
    </div>

    <div class="tabs" style="width: fit-content; margin: 16px 0">
      <button :class="{ selected: tab === 'rules' }" @click="tab = 'rules'">자동화 규칙</button>
      <button :class="{ selected: tab === 'ai' }" @click="tab = 'ai'">AI 연동</button>
    </div>

    <template v-if="tab === 'ai'">
      <div class="callout">
        <b>AI에게 무엇을 보낼지 직접 고릅니다</b>
        <p>
          기본값은 전부 꺼짐이에요. 연동을 켜도 아래에서 고른 <b>범위 안의 데이터만</b> 전송되고,
          업무·경력 기록은 별도로 동의해야 포함됩니다.
        </p>
      </div>

      <div class="section-label">연동 방식</div>
      <div class="ai-providers">
        <button v-for="p in AI_PROVIDERS" :key="p.id" :class="{ selected: aiSettings.provider === p.id }" @click="aiSettings.provider = p.id">
          <b>{{ p.label }}</b><small>{{ p.note }}</small>
        </button>
      </div>
      <label v-if="aiSettings.provider === 'byok'">API 키
        <input type="password" v-model="aiSettings.apiKey" placeholder="sk-..." autocomplete="off" />
      </label>
      <p v-if="aiSettings.provider === 'byok'" class="form-note">키는 이 브라우저에만 저장되고 서버로 보내지 않아요.</p>

      <div class="section-label" style="margin-top: 20px">보낼 데이터 범위</div>
      <div class="filter" style="width: fit-content; margin: 8px 0">
        <button v-for="s in AI_SCOPES" :key="s.id" :class="{ selected: aiSettings.scope === s.id }" @click="aiSettings.scope = s.id">{{ s.label }}</button>
      </div>
      <p class="form-note">{{ AI_SCOPES.find((s) => s.id === aiSettings.scope).desc }}</p>

      <label class="task" style="border: 0; display: inline-flex;">
        <input type="checkbox" :checked="aiSettings.allowSensitive" @change="setAllowSensitive($event.target.checked)" />
        <span style="flex: 1"><b>업무·경력 기록 포함 허용</b><small>업무 카테고리와 경력기술서 내용을 AI 입력에 포함해요 (기본 꺼짐)</small></span>
      </label>
      <label class="task" style="border: 0; display: inline-flex;">
        <input type="checkbox" v-model="aiSettings.redactNames" />
        <span style="flex: 1"><b>사람 이름 가리기</b><small>보내기 전에 이름을 익명 기호로 바꿔요</small></span>
      </label>
      <label class="task" style="border: 0; display: inline-flex;">
        <input type="checkbox" v-model="aiSettings.keepHistory" />
        <span style="flex: 1"><b>요청·응답 기록 보관</b><small>무엇을 보냈는지 나중에 확인할 수 있어요</small></span>
      </label>

      <div class="section-label" style="margin-top: 20px">AI가 만들어주는 것</div>
      <p v-if="blockedNotice" class="badge warn" style="display: inline-block">{{ blockedNotice }}</p>
      <div class="trow" v-for="f in AI_FEATURES" :key="f.id">
        <span style="flex: 1; min-width: 0">
          <b style="display: block">{{ f.title }}<span v-if="f.sensitive" class="badge danger" style="margin-left: 6px">민감</span></b>
          <small>{{ f.desc }}</small>
          <small style="display: block; margin-top: 4px; color: var(--color-muted)">입력: {{ f.needs.join(' · ') }}</small>
        </span>
        <button type="button" role="switch" class="toggle" :aria-checked="isFeatureOn(f.id)" :class="{ on: isFeatureOn(f.id) }" style="flex: none" @click="onToggleFeature(f)"><em></em></button>
      </div>
      <p class="form-note">연동 방식이 ‘사용 안 함’이거나 키가 없으면 켜도 동작하지 않아요.</p>
    </template>

    <template v-for="(items, domain) in groups" v-else :key="domain">
      <div class="section-label">{{ domain }}</div>
      <div class="trow" v-for="a in items" :key="a.id">
        <span style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0">
          <i style="width: 30px; height: 30px; border-radius: 9px; background: var(--color-surface); color: var(--color-foreground); font-style: normal; display: flex; align-items: center; justify-content: center; flex: none">{{ a.icon }}</i>
          <span style="min-width: 0">
            <b style="display: block">{{ a.title }}</b>
            <small>{{ a.desc }}</small>
            <div v-if="a.param && isAutomationOn(a.id)" style="display: flex; align-items: center; gap: 8px; margin-top: 8px">
              <small style="color: var(--color-muted)">{{ a.param.label }}</small>
              <input
                type="number"
                :min="a.param.min"
                :max="a.param.max"
                :value="automationParam(a.id)"
                @input="setAutomationParam(a.id, Number($event.target.value))"
                style="width: 56px; padding: 5px 7px; font-size: 0.8125rem"
              />
              <small style="color: var(--color-muted)">{{ a.param.unit }} 이상</small>
            </div>
          </span>
        </span>
        <button type="button" role="switch" class="toggle" :aria-checked="isAutomationOn(a.id)" :class="{ on: isAutomationOn(a.id) }" @click="toggleAutomation(a.id)" style="flex: none"><em></em></button>
      </div>
    </template>

    <p v-if="tab === 'rules'" class="form-note" style="margin-top: 16px">더 세밀한 발송 채널·시간대는 알림 설정에서 조절할 수 있어요.</p>
  </section>
</template>
