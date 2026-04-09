// expo-notifications requires a native development build — not available in Expo Go.
// All functions here are no-ops so the app runs in Expo Go without errors.
// To activate real notifications: run `npx expo run:android` / `npx expo run:ios`
// and uncomment the expo-notifications import + replace the stubs below.

// ─── Permission ─────────────────────────────────────────────────────────────

export async function requestNotificationPermissions() {
  return false // no-op in Expo Go
}

// ─── Daily check-in reminder (20:00) ────────────────────────────────────────

export async function scheduleDailyReminder(_enabled) {
  // no-op
}

// ─── Streak-at-risk alert (22:30) ───────────────────────────────────────────

export async function scheduleStreakAlert(_enabled) {
  // no-op
}

// ─── Milestone unlocked ──────────────────────────────────────────────────────

export async function notifyMilestoneUnlocked(_milestoneId, _journeyTitle, _weekNum) {
  // no-op
}

// ─── Journey ending soon ─────────────────────────────────────────────────────

export async function scheduleJourneyEndingReminders(_journeyId, _journeyTitle, _endDateIso) {
  // no-op
}

export async function cancelJourneyReminders(_journeyId) {
  // no-op
}

// ─── Partner nudge ───────────────────────────────────────────────────────────

export async function sendPartnerNudge(_partnerName, _journeyTitle) {
  // no-op
}

// ─── Cancel all ──────────────────────────────────────────────────────────────

export async function cancelAllNotifications() {
  // no-op
}
