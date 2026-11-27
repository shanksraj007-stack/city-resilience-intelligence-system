import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// HTTPS dev server is now opt-in: set HTTPS_DEV=1 to serve the Vite dev
// server and proxy to the backend over TLS (requires certs/ + backend
// started with --ssl-*). Default is plain HTTP end-to-end, which the
// Android app / LAN setup expects.
const httpsEnabled = process.env.HTTPS_DEV === '1' && fs.existsSync(path.resolve(__dirname, 'certs/key.pem'))
const backendProto = httpsEnabled ? 'https' : 'http'
const wsProto = httpsEnabled ? 'wss' : 'ws'
const backendTarget = `${backendProto}://localhost:8000`

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    ...(httpsEnabled
      ? {
          https: {
            key: fs.readFileSync(path.resolve(__dirname, 'certs/key.pem')),
            cert: fs.readFileSync(path.resolve(__dirname, 'certs/cert.pem')),
          },
        }
      : {}),
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: `${wsProto}://localhost:8000`,
        ws: true,
        secure: false,
      },
      '/uploads': {
        target: backendTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
