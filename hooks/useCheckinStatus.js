import { useMemo } from 'react'
import { CHECKINS, CURRENT_USER } from '../data/dummy'

/**
 * Returns the current user's check-in status for a given journey on today's date.
 * @param {string} journeyId
 * @returns {{ checkedInToday: boolean, todayCheckin: object|null, streak: number }}
 */
export function useCheckinStatus(journeyId) {
  return useMemo(() => {
    const today = new Date().toISOString().split('T')[0]

    const myCheckins = CHECKINS.filter(
      c => c.user_id === CURRENT_USER.id && c.journey_id === journeyId
    ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    const todayCheckin = myCheckins.find(c => c.created_at.startsWith(today)) ?? null
    const checkedInToday = todayCheckin !== null

    // Calculate streak from sorted check-ins
    let streak = 0
    let cursor = new Date(today)
    for (const checkin of myCheckins) {
      const checkinDate = checkin.created_at.split('T')[0]
      const expected = cursor.toISOString().split('T')[0]
      if (checkinDate === expected) {
        streak++
        cursor.setDate(cursor.getDate() - 1)
      } else {
        break
      }
    }

    return { checkedInToday, todayCheckin, streak }
  }, [journeyId])
}
