import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'kr.timeflow.app',
  appName: 'Timeflow',
  webDir: 'dist',
  server: { androidScheme: 'https' }
}

export default config

