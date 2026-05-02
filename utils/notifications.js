import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import Constants from 'expo-constants'
import { apiUpdateMe } from './api'
import { logger } from './logger'

// ─── Permission + Push Token Registration ────────────────────────────────────

export async function requestNotificationPermissions() {
  try {
    // Android requires an explicit notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Vouch',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#E8A838',
        sound: 'default',
      })
    }

    const { status: existing } = await Notifications.getPermissionsAsync()
    let status = existing

    if (existing !== 'granted') {
      const { status: requested } = await Notifications.requestPermissionsAsync()
      status = requested
    }

    if (status !== 'granted') {
      logger.warn('[NOTIFICATIONS]', 'Permission denied by user')
      return false
    }

    // Get Expo push token and register with backend
    try {
      const projectId =
        Constants.easConfig?.projectId ??
        Constants.expoConfig?.extra?.eas?.projectId

      const { data: token } = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      )

      logger.info('[NOTIFICATIONS]', 'Push token obtained — registering with backend')
      apiUpdateMe({ notification_token: token, notification_enabled: true }).catch(() => {})
    } catch (tokenErr) {
      // Token registration failed (e.g. no EAS project ID in dev) but local
      // notifications still work — don't block the return value.
      logger.warn('[NOTIFICATIONS]', `Push token failed: ${tokenErr.message}`)
    }

    return true
  } catch (err) {
    logger.error('[NOTIFICATIONS]', `Permission error: ${err.message}`)
    return false
  }
}

// ─── Daily check-in reminder (20:00 local time) ──────────────────────────────

export async function scheduleDailyReminder(enabled) {
  const ID = 'daily-checkin-reminder'
  await Notifications.cancelScheduledNotificationAsync(ID).catch(() => {})
  if (!enabled) return

  await Notifications.scheduleNotificationAsync({
    identifier: ID,
    content: {
      title: 'Time to check in',
      body: "Don't let your streak slip. Log what you did today.",
      sound: true,
    },
    trigger: { hour: 20, minute: 0, repeats: true },
  }).catch(err => logger.warn('[NOTIFICATIONS]', `Schedule daily reminder failed: ${err.message}`))
}

// ─── Streak-at-risk alert (22:30 local time) ─────────────────────────────────

export async function scheduleStreakAlert(enabled) {
  const ID = 'streak-at-risk'
  await Notifications.cancelScheduledNotificationAsync(ID).catch(() => {})
  if (!enabled) return

  await Notifications.scheduleNotificationAsync({
    identifier: ID,
    content: {
      title: 'Streak at risk',
      body: '1.5 hours left to check in today.',
      sound: true,
    },
    trigger: { hour: 22, minute: 30, repeats: true },
  }).catch(err => logger.warn('[NOTIFICATIONS]', `Schedule streak alert failed: ${err.message}`))
}

// ─── Milestone unlocked ──────────────────────────────────────────────────────

export async function notifyMilestoneUnlocked(milestoneId, journeyTitle, weekNum) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Week ${weekNum} unlocked`,
      body: `${journeyTitle} — milestone reached. Keep going.`,
      sound: true,
      data: { route: '/notifications' },
    },
    trigger: null, // immediate
  }).catch(() => {})
}

// ─── Journey ending soon ─────────────────────────────────────────────────────

export async function scheduleJourneyEndingReminders(journeyId, journeyTitle, endDateIso) {
  const endDate = new Date(endDateIso)
  const twoDaysBefore = new Date(endDate.getTime() - 2 * 24 * 60 * 60 * 1000)
  if (twoDaysBefore > new Date()) {
    await Notifications.scheduleNotificationAsync({
      identifier: `journey-ending-${journeyId}`,
      content: {
        title: '2 days left',
        body: `${journeyTitle} ends in 2 days. Finish strong.`,
        sound: true,
        data: { route: '/notifications' },
      },
      trigger: { date: twoDaysBefore },
    }).catch(() => {})
  }
}

export async function cancelJourneyReminders(journeyId) {
  await Notifications.cancelScheduledNotificationAsync(`journey-ending-${journeyId}`).catch(() => {})
}

// ─── Partner nudge ───────────────────────────────────────────────────────────

export async function sendPartnerNudge(partnerName, journeyTitle) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${partnerName} nudged you`,
      body: `Check in on ${journeyTitle}.`,
      sound: true,
      data: { route: '/notifications' },
    },
    trigger: null,
  }).catch(() => {})
}

// ─── Cancel all ──────────────────────────────────────────────────────────────

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {})
}
