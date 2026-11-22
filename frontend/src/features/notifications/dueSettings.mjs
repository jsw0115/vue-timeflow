// 마감 알림 시점 설정(Q-32)을 계정 설정 notifications 구역에 읽고 저장한다. 허용값은 서버 DueReminders와 같다.

export const SETTINGS_PATH = '/api/settings/notifications'
export const LEAD_MINUTES = [
  { value: 0, label: '마감 시각에' }, { value: 10, label: '10분 전' }, { value: 30, label: '30분 전' },
  { value: 60, label: '1시간 전(기본)' }, { value: 180, label: '3시간 전' }, { value: 1440, label: '하루 전' },
]
export const LEAD_DAYS = [{ value: 0, label: '당일' }, { value: 1, label: '하루 전' }, { value: 3, label: '3일 전' }, { value: 7, label: '7일 전' }]

/** 저장값을 화면 값으로. 없거나 허용 밖이면 기본값이고, 지원 알림 시점은 비워 두면 커리어 목표를 따른다(null). */
export function readDueSettings(value) {
  const v = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  return {
    enabled: v.dueReminders !== false,
    leadMinutes: LEAD_MINUTES.some((o) => o.value === v.dueLeadMinutes) ? v.dueLeadMinutes : 60,
    leadDays: LEAD_DAYS.some((o) => o.value === v.applicationLeadDays) ? v.applicationLeadDays : null,
  }
}

/** 같은 구역의 다른 값은 지우지 않고 합쳐서 version과 함께 보낸다. leadDays가 null이면 키를 지워 커리어 목표 기본값을 따르게 한다. */
export function createDueSettings({ request }) {
  return {
    async load() { return readDueSettings((await request(SETTINGS_PATH))?.value) },
    async save(next) {
      const row = await request(SETTINGS_PATH)
      const value = { ...(row?.value && typeof row.value === 'object' && !Array.isArray(row.value) ? row.value : {}), dueReminders: next.enabled, dueLeadMinutes: next.leadMinutes }
      if (next.leadDays == null) delete value.applicationLeadDays
      else value.applicationLeadDays = next.leadDays
      const saved = await request(SETTINGS_PATH, { method: 'POST', body: JSON.stringify(row?.version ? { value, version: row.version } : { value }) })
      return readDueSettings(saved?.value)
    },
  }
}
