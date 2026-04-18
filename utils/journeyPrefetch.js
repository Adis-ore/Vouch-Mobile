import { apiGetDiscoverJourneys } from './api'
import { logger } from './logger'

const CACHE_TTL = 2 * 60 * 1000 // 2 minutes

const cache = {
  nearby: { data: null, ts: 0 },
  everywhere: { data: null, ts: 0 },
}

export function prefetchDiscoverJourneys() {
  const now = Date.now()

  if (!cache.nearby.data || now - cache.nearby.ts > CACHE_TTL) {
    apiGetDiscoverJourneys({ country_only: true })
      .then(res => {
        cache.nearby.data = res.journeys || []
        cache.nearby.ts = Date.now()
        logger.info('[PREFETCH]', `Nearby cached (${cache.nearby.data.length})`)
      })
      .catch(() => {})
  }

  if (!cache.everywhere.data || now - cache.everywhere.ts > CACHE_TTL) {
    apiGetDiscoverJourneys({ country_only: false })
      .then(res => {
        cache.everywhere.data = res.journeys || []
        cache.everywhere.ts = Date.now()
        logger.info('[PREFETCH]', `Everywhere cached (${cache.everywhere.data.length})`)
      })
      .catch(() => {})
  }
}

export function getPrefetchedJourneys(scope) {
  const key = scope === 'nearby' ? 'nearby' : 'everywhere'
  const entry = cache[key]
  if (!entry.data || Date.now() - entry.ts > CACHE_TTL) return null
  return entry.data
}
