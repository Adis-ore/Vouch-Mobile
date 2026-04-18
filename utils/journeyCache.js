// In-memory journey cache — instant loads on revisit within the same session.
// Entries expire after 5 minutes so stale data doesn't linger.

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes
const cache = new Map()

export function cacheJourney(journey) {
  if (!journey?.id) return
  cache.set(journey.id, { data: journey, cachedAt: Date.now() })
}

export function getCachedJourney(id) {
  const entry = cache.get(id)
  if (!entry) return null
  if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
    cache.delete(id)
    return null
  }
  return entry.data
}

export function invalidateJourney(id) {
  if (id) cache.delete(id)
}
