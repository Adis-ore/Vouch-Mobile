import { useMemo } from 'react'
import { CHECKINS, CURRENT_USER } from '../data/dummy'

/**
 * Calculates the current user's global streak across all journeys,
 * and their longest streak ever.
 * @returns {{ currentStreak: number, longestStreak: number, lastCheckinDate: string|null }}
 */
export function useStreak() {
  return useMemo(() => {
    const myCheckins = CHECKINS
      .filter(c => c.user_id === CURRENT_USER.id)
      .map(c => c.created_at.split('T')[0])

    // Deduplicate dates and sort descending
    const uniqueDates = [...new Set(myCheckins)].sort((a, b) => b.localeCompare(a))

    if (uniqueDates.length === 0) {
      return { currentStreak: 0, longestStreak: 0, lastCheckinDate: null }
    }

    const lastCheckinDate = uniqueDates[0]

    // Current streak: consecutive days back from today or yesterday
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    let currentStreak = 0
    if (lastCheckinDate === today || lastCheckinDate === yesterday) {
      let cursor = new Date(lastCheckinDate)
      for (const date of uniqueDates) {
        const expected = cursor.toISOString().split('T')[0]
        if (date === expected) {
          currentStreak++
          cursor.setDate(cursor.getDate() - 1)
        } else {
          break
        }
      }
    }

    // Longest streak: scan all dates
    let longestStreak = 0
    let runStreak = 1
    for (let i = 1; i < uniqueDates.length; i++) {
      const prev = new Date(uniqueDates[i - 1])
      const curr = new Date(uniqueDates[i])
      const diffDays = Math.round((prev - curr) / 86400000)
      if (diffDays === 1) {
        runStreak++
        if (runStreak > longestStreak) longestStreak = runStreak
      } else {
        runStreak = 1
      }
    }
    if (uniqueDates.length === 1) longestStreak = 1
    longestStreak = Math.max(longestStreak, currentStreak)

    return { currentStreak, longestStreak, lastCheckinDate }
  }, [])
}
