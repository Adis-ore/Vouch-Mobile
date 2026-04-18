// Lightweight in-memory signal — marks a journey as "just checked in" so
// the journey detail screen reflects immediately without waiting for a network reload.

const recentCheckins = new Map() // journeyId → timestamp

export function markCheckedIn(journeyId) {
  recentCheckins.set(String(journeyId), Date.now())
}

export function wasRecentlyCheckedIn(journeyId) {
  const ts = recentCheckins.get(String(journeyId))
  if (!ts) return false
  // Signal expires after 10 minutes
  if (Date.now() - ts > 10 * 60 * 1000) {
    recentCheckins.delete(String(journeyId))
    return false
  }
  return true
}

export function clearCheckinSignal(journeyId) {
  recentCheckins.delete(String(journeyId))
}
