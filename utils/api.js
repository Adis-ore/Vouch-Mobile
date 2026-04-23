// Central API client — all calls go through localhost:3000/api/v1
// Swap BASE_URL for your deployed URL when you go live

// const BASE_URL = 'http://10.0.2.2:3000/api/v1' // Android emulator
const BASE_URL = 'http://10.53.119.66:3000/api/v1' // Local WiFi — PC IP
// const BASE_URL = 'http://localhost:3000/api/v1' // iOS simulator
// const BASE_URL = 'https://your-render-url.onrender.com/api/v1' // production

import { getItem, setItem } from './storage'
import { logger } from './logger'

// Fields to mask in logs
const SENSITIVE = new Set(['password', 'confirm_password', 'access_token', 'refresh_token'])

function sanitize(obj) {
  if (!obj || typeof obj !== 'object') return obj
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    out[k] = SENSITIVE.has(k) ? '[REDACTED]' : v
  }
  return out
}

async function getToken() {
  try {
    const raw = await getItem('vouch_session')
    if (!raw) return null
    return JSON.parse(raw).token
  } catch (_) {
    return null
  }
}

async function getRefreshToken() {
  try {
    const raw = await getItem('vouch_session')
    if (!raw) return null
    return JSON.parse(raw).refresh_token
  } catch (_) {
    return null
  }
}

// Silently refresh the access token and persist the new session.
// Returns the new access token on success, null on failure.
async function silentRefresh() {
  try {
    const refresh_token = await getRefreshToken()
    if (!refresh_token) return null

    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token }),
    })
    if (!res.ok) return null

    const data = await res.json()
    const session = data?.data?.session
    if (!session?.access_token) return null

    // Compute expiry — prefer expires_in (seconds from now) over expires_at to avoid clock skew
    const expiresIn = session.expires_in ?? 3600
    const expiry = Date.now() + expiresIn * 1000
    await setItem('vouch_session', JSON.stringify({
      token: session.access_token,
      refresh_token: session.refresh_token,
      expiry,
    }))
    logger.info('[API]', 'Token silently refreshed')
    return session.access_token
  } catch (_) {
    return null
  }
}

async function request(path, { method = 'GET', body, auth = true, _retry = false } = {}) {
  const headers = { 'Content-Type': 'application/json' }

  if (auth) {
    const token = await getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const url = `${BASE_URL}${path}`
  const start = Date.now()

  logger.info('[API]', `→ ${method} ${path}`, body ? sanitize(body) : undefined)

  let res, data
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 20000) // 20s timeout (cold start)

    res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
    clearTimeout(timeout)
    data = await res.json()
  } catch (err) {
    if (err.name === 'AbortError') {
      logger.error('[API]', `✕ ${method} ${path} — timed out after 20s`)
      throw new Error('Request timed out. Make sure the backend is running and accessible.')
    }
    logger.error('[API]', `✕ ${method} ${path} — network error: ${err.message}`)
    throw new Error('Cannot reach server. Make sure the backend is running.')
  }

  const ms = Date.now() - start

  if (!res.ok) {
    // On 401: try a silent token refresh then replay once
    if (res.status === 401 && auth && !_retry) {
      logger.info('[API]', `401 on ${path} — attempting silent refresh`)
      const newToken = await silentRefresh()
      if (newToken) {
        return request(path, { method, body, auth, _retry: true })
      }
    }

    const msg = data?.error?.message || `Request failed (${res.status})`
    const code = data?.error?.code || 'UNKNOWN'
    logger.warn('[API]', `← ${res.status} ${method} ${path} (${ms}ms) [${code}]`, data?.error)
    const err = new Error(msg)
    err.code = code
    err.status = res.status
    throw err
  }

  logger.info('[API]', `← ${res.status} ${method} ${path} (${ms}ms)`)
  return data
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function apiSignup({ email, password, full_name, bio, country, region }) {
  logger.action('[AUTH]', 'Signup', { email, full_name })
  return request('/auth/signup', {
    method: 'POST',
    auth: false,
    body: { email, password, full_name, bio, country, region },
  })
}

export async function apiSignin({ email, password }) {
  logger.action('[AUTH]', 'Signin', { email })
  return request('/auth/signin', {
    method: 'POST',
    auth: false,
    body: { email, password },
  })
}

export async function apiRecover({ email }) {
  logger.action('[AUTH]', 'Password recovery', { email })
  return request('/auth/recover', {
    method: 'POST',
    auth: false,
    body: { email },
  })
}

export async function apiGoogleSignIn({ code, redirect_uri }) {
  logger.action('[AUTH]', 'Google sign-in')
  return request('/auth/google', {
    method: 'POST',
    auth: false,
    body: { code, redirect_uri },
  })
}

export async function apiSignout() {
  return request('/auth/signout', { method: 'POST' })
}

export async function apiRefreshSession({ refresh_token }) {
  logger.action('[AUTH]', 'Refresh session')
  return request('/auth/refresh', {
    method: 'POST',
    auth: false,
    body: { refresh_token },
  })
}

// ─── Journeys ────────────────────────────────────────────────────────────────

export async function apiGetMyJourneys() {
  logger.action('[JOURNEY]', 'Fetch my journeys')
  return request('/journeys/mine')
}

export async function apiGetDiscoverJourneys({ category, country_only, limit = 30, offset = 0 } = {}) {
  const params = new URLSearchParams({ limit, offset })
  if (category && category !== 'All') params.set('category', category)
  if (country_only) params.set('country_only', 'true')
  logger.action('[JOURNEY]', 'Fetch discover journeys', { category, country_only })
  return request(`/journeys/discover?${params}`)
}

export async function apiCreateJourney(data) {
  logger.action('[JOURNEY]', 'Create journey', { title: data.title, category: data.category })
  return request('/journeys', { method: 'POST', body: data })
}

export async function apiGetJourney(id) {
  logger.action('[JOURNEY]', 'Fetch journey', { id })
  return request(`/journeys/${id}`)
}

export async function apiGetJourneyStatus(id) {
  return request(`/journeys/${id}`)
}

export async function apiJoinJourney(id) {
  logger.action('[JOURNEY]', 'Join journey', { id })
  return request(`/journeys/${id}/join`, { method: 'POST' })
}

export async function apiLeaveJourney(id) {
  logger.action('[JOURNEY]', 'Leave journey', { id })
  return request(`/journeys/${id}/leave`, { method: 'POST' })
}

export async function apiAbandonJourney(id) {
  logger.action('[JOURNEY]', 'Abandon journey', { id })
  return request(`/journeys/${id}/abandon`, { method: 'POST' })
}

export async function apiStartJourney(id) {
  logger.action('[JOURNEY]', 'Start journey', { id })
  return request(`/journeys/${id}/start`, { method: 'POST' })
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function apiGetMe() {
  logger.action('[USER]', 'Fetch profile')
  return request('/users/me')
}

export async function apiUpdateMe(fields) {
  logger.action('[USER]', 'Update profile', fields)
  return request('/users/me', { method: 'PATCH', body: fields })
}

export async function apiUploadCoverImage(localUri) {
  const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL
  const token = await getToken()
  if (!token) throw new Error('Not authenticated')
  const filename = `covers/${Date.now()}.jpg`

  const fileRes = await fetch(localUri)
  const blob = await fileRes.blob()

  const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/journey-covers/${filename}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'image/jpeg',
      'x-upsert': 'true',
    },
    body: blob,
  })

  if (!uploadRes.ok) {
    const err = await uploadRes.text()
    throw new Error(`Image upload failed: ${err}`)
  }

  return `${SUPABASE_URL}/storage/v1/object/public/journey-covers/${filename}`
}

export async function apiDeleteAccount() {
  logger.action('[USER]', 'Delete account')
  return request('/users/me', { method: 'DELETE' })
}

export async function apiUploadCheckinImage(localUri) {
  const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL
  const token = await getToken() // user JWT — required for authenticated storage policy
  if (!token) throw new Error('Not authenticated')
  const filename = `proofs/${Date.now()}.jpg`

  const fileRes = await fetch(localUri)
  const blob = await fileRes.blob()

  const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/checkin-proofs/${filename}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'image/jpeg',
      'x-upsert': 'true',
    },
    body: blob,
  })

  if (!uploadRes.ok) {
    const err = await uploadRes.text()
    throw new Error(`Image upload failed: ${err}`)
  }

  return `${SUPABASE_URL}/storage/v1/object/public/checkin-proofs/${filename}`
}

// ─── Drafts ──────────────────────────────────────────────────────────────────

export async function apiGetDrafts() {
  return request('/drafts')
}

export async function apiSaveFormDraft({ draft_id, step, form_data }) {
  return request('/drafts/form', { method: 'POST', body: { draft_id, step, form_data } })
}

export async function apiDeleteFormDraft(id) {
  return request(`/drafts/form/${id}`, { method: 'DELETE' })
}

export async function apiShelveJourneyDraft(journeyId) {
  return request(`/drafts/journey/${journeyId}/shelve`, { method: 'PATCH' })
}

export async function apiRetryPayment(journeyId) {
  return request(`/drafts/journey/${journeyId}/retry-payment`, { method: 'POST' })
}

export async function apiSaveDraft(fields) {
  return request('/drafts/save', { method: 'POST', body: fields })
}

export async function apiPublishDraft(draftId) {
  return request(`/drafts/${draftId}/publish`, { method: 'POST' })
}

export async function apiDeleteDraft(draftId) {
  return request(`/drafts/${draftId}`, { method: 'DELETE' })
}

export async function apiInitJourneyPass(draftId) {
  return request('/payments/journey-pass/initialize', { method: 'POST', body: { draft_id: draftId } })
}

// ─── Checkins ────────────────────────────────────────────────────────────────

export async function apiSubmitCheckin({ journey_id, note, proof_url, proof_type, next_step }) {
  logger.action('[CHECKIN]', 'Submit check-in', { journey_id })
  return request('/checkins', { method: 'POST', body: { journey_id, note, proof_url, proof_type, next_step } })
}

export async function apiGetCheckins(journeyId) {
  logger.action('[CHECKIN]', 'Fetch checkins', { journeyId })
  return request(`/checkins/journey/${journeyId}`)
}

export async function apiGetMyCheckins({ limit = 50, offset = 0 } = {}) {
  return request(`/checkins/me?limit=${limit}&offset=${offset}`)
}

export async function apiVerifyCheckin(checkinId, verdict) {
  logger.action('[CHECKIN]', 'Verify checkin', { checkinId, verdict })
  return request(`/checkins/${checkinId}/verify`, { method: 'POST', body: { verdict } })
}

// ─── Messages ────────────────────────────────────────────────────────────────

export async function apiGetMessages(journeyId) {
  logger.action('[MESSAGES]', 'Fetch messages', { journeyId })
  return request(`/messages/journey/${journeyId}`)
}

export async function apiSendMessage(journeyId, content) {
  logger.action('[MESSAGES]', 'Send message', { journeyId })
  return request(`/messages/journey/${journeyId}`, { method: 'POST', body: { content } })
}

export async function apiEditMessage(messageId, content) {
  return request(`/messages/${messageId}`, { method: 'PATCH', body: { content } })
}

export async function apiDeleteMessage(messageId) {
  return request(`/messages/${messageId}`, { method: 'DELETE' })
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function apiGetNotifications({ limit = 30, offset = 0 } = {}) {
  return request(`/notifications?limit=${limit}&offset=${offset}`)
}

export async function apiMarkNotificationRead(id) {
  return request(`/notifications/${id}/read`, { method: 'PATCH' })
}

export async function apiMarkAllNotificationsRead() {
  return request('/notifications/read-all', { method: 'PATCH' })
}
