// 서버 제공 가능 여부와 실제 연결 결과를 함께 검사해 시연 성공 표시를 차단한다.
export async function loadIntegrationStatus(request) {
  const [capabilities, status] = await Promise.all([request('/api/integrations/capabilities'), request('/api/sync/status')])
  if (!Array.isArray(capabilities) || !status || !Array.isArray(status.providers)) throw new Error('연동 상태 응답을 확인하지 못했습니다.')
  const available = capabilities.some(item => item.feature === 'calendar-sync' && item.available === true) && status.available === true
  return {
    available,
    providers: [['google', 'Google 캘린더'], ['apple', 'Apple 캘린더'], ['outlook', 'Outlook 캘린더']].map(([id, name]) => {
      const actual = available ? status.providers.find(item => item.id === id) : null
      const connected = actual?.connected === true
      return { id, name, connected, label: !available ? '미지원 · 미연결' : actual?.status === 'CONNECTING' ? '연결 중' : actual?.status === 'FAILED' ? '연결 확인 필요' : connected ? '연결됨' : '미연결', lastSync: connected && actual.status === 'SUCCEEDED' ? actual.lastSync : null }
    }),
    logs: available && Array.isArray(status.logs) ? status.logs : [],
    conflicts: available && Array.isArray(status.conflicts) ? status.conflicts : [],
  }
}
