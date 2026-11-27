import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'gov.vijayamangalam.cris',
  appName: 'CRIS',
  webDir: 'dist',
  server: {
    // Demo config: API is plain HTTP on the LAN (self-signed HTTPS is
    // rejected by the Android WebView). Do NOT enable cleartext in a
    // production/hosted build.
    androidScheme: 'https',
    cleartext: true,
  },
}

export default config
