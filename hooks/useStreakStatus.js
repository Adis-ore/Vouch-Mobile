import { useMemo } from 'react'

/**
 * useStreakStatus — derives today's check-in progress and fire icon state
 * from the active journeys list returned by /journeys/mine.
 *
 * Each journey already has `checked_in_today` (bool) and `status` from the API.
 */
export function useStreakStatus(activeJourneys = []) {
  return useMemo(() => {
    const active = activeJourneys.filter(j => j.status === 'active')
    const total = active.length
    const checkedIn = active.filter(j => j.checked_in_today).length

    const isFullyComplete = total > 0 && checkedIn >= total
    const isPartial       = checkedIn > 0 && checkedIn < total
    const isNotStarted    = checkedIn === 0

    const label = total === 0
      ? null
      : `${checkedIn}/${total} journeys checked in today`

    const streakWillCount = isFullyComplete

    // fire: 'gold' | 'partial' | 'grey'
    const fireState = isFullyComplete ? 'gold' : isPartial ? 'partial' : 'grey'

    return { total, checkedIn, isFullyComplete, isPartial, isNotStarted, label, streakWillCount, fireState }
  }, [activeJourneys])
}
