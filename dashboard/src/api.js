// Same-origin in production; Vite proxies /api to FastAPI during development.
export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
export async function request(path, options = {}) {
  const res = await fetch(`${API_URL}/api${path}`, {
    credentials: 'include', ...options,
    headers: { 'Content-Type': 'application/json', 'X-CodePulse-Request': '1', ...options.headers },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const message = typeof body.detail === 'string' ? body.detail : Array.isArray(body.detail) ? body.detail.map(item => item.msg.replace(/^Value error, /, '')).join(' ') : `Request failed (${res.status}). Please try again.`
    throw new Error(message)
  }
  return res.status === 204 ? null : res.json()
}
export const getJSON = path => request(path)
export const mutate = (path, body, method = 'POST') => request(path, { method, body: body === undefined ? undefined : JSON.stringify(body) })
