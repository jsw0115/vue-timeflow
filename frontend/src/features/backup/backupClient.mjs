// 백업 파일 크기와 서버 작업 상태를 확인하고 같은 파일의 미리보기·재시도를 연결한다.
export const MAX_BACKUP_BYTES = 8 * 1024 * 1024
export function backupForm(file) {
  if (!file || file.size === 0 || file.size > MAX_BACKUP_BYTES) throw new Error('백업 JSON 파일은 1바이트~8 MiB입니다.')
  const data = new FormData(); data.append('file', file)
  return data
}
export function createBackupClient(request) {
  return {
    status: () => request('/api/user/data/backup/status'),
    async download() {
      const backup = await request('/api/user/data/backup')
      if (backup?.schemaVersion !== 1 || typeof backup.checksum !== 'string' || !Array.isArray(backup.records) || !Array.isArray(backup.attachments)) throw new Error('백업 파일의 생성 결과를 확인하지 못했습니다.')
      return backup
    },
    preview: file => request('/api/user/data/backup/preview', { method: 'POST', body: backupForm(file) }),
    async restore(file, jobId) {
      if (!/^restore-[a-f0-9]{64}$/.test(jobId || '')) throw new Error('복원 전에 파일 미리보기를 확인해주세요.')
      const result = await request(`/api/user/data/backup/${jobId}/restore`, { method: 'POST', body: backupForm(file) })
      if (result?.state !== 'COMPLETED') throw new Error('복원 완료를 확인하지 못했습니다. 같은 파일로 다시 확인해주세요.')
      return result
    },
  }
}
