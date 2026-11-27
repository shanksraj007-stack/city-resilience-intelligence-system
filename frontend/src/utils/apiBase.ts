/**
 * Runtime base URL for API / WebSocket requests.
 *
 * Build with `vite build --mode mobile` + `VITE_API_URL` in `.env.mobile`
 * for the Android APK. The desktop dev server (no `VITE_API_URL`) falls
 * back to same-origin, which is what the Vite proxy expects.
 */
export function getApiBase(): string {
  return import.meta.env.VITE_API_URL ?? ''
}

/** Derive the WebSocket URL from VITE_API_URL, falling back to same-origin. */
export function getWsBase(): string {
  const base = getApiBase()
  if (base) {
    // http://192.168.x.x:8000  →  ws://192.168.x.x:8000
    const url = new URL(base)
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    return url.toString().replace(/\/$/, '')
  }
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}`
}
