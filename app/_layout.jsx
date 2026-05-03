import { useEffect, useState } from 'react'
import { View, AppState } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import * as Notifications from 'expo-notifications'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { getItem, setItem, removeItem } from '../utils/storage'
import { logger } from '../utils/logger'
import { apiRefreshSession, apiGetMe } from '../utils/api'
import {
  requestNotificationPermissions,
  scheduleDailyReminder,
  scheduleStreakAlert,
} from '../utils/notifications'
import {
  useFonts,
  Fraunces_400Regular_Italic,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces'
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans'
import { ThemeProvider, useTheme } from '../context/ThemeContext'
import { UserProvider, useUser } from '../context/UserContext'

SplashScreen.preventAutoHideAsync()

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

const INACTIVITY_LIMIT_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

async function touchLastActive() {
  await setItem('vouch_last_active', String(Date.now()))
}

// Save real token + refresh token from backend response.
// expires_in (seconds from now) is preferred over expires_at to avoid server clock skew.
// Falls back to expires_at (Unix seconds) → 1 hour if both are absent.
export async function saveSession({ token, refresh_token, expires_at, expires_in } = {}) {
  let expiry
  if (expires_in != null) {
    expiry = Date.now() + Number(expires_in) * 1000
  } else if (expires_at != null) {
    const ms = Number(expires_at) * 1000
    // Sanity-check: if the result is in the past or less than 60s away, assume the
    // Supabase project has a short JWT TTL — add 1 hour as a fallback buffer.
    expiry = ms > Date.now() + 60_000 ? ms : Date.now() + 60 * 60 * 1000
  } else {
    expiry = Date.now() + 60 * 60 * 1000
  }
  await setItem('vouch_session', JSON.stringify({ token, refresh_token, expiry }))
  await touchLastActive()
  logger.info('[SESSION]', 'Session saved', { expiresAt: new Date(expiry).toISOString() })
}

export async function clearSession() {
  await removeItem('vouch_session')
  await removeItem('vouch_last_active')
  logger.info('[SESSION]', 'Session cleared')
}

async function hasValidSession() {
  try {
    const raw = await getItem('vouch_session')
    if (!raw) {
      logger.info('[SESSION]', 'No session found')
      return false
    }
    const { token, refresh_token, expiry } = JSON.parse(raw)
    if (!token) {
      logger.info('[SESSION]', 'Session missing token')
      return false
    }

    // Enforce 7-day inactivity logout
    const lastActiveRaw = await getItem('vouch_last_active')
    if (lastActiveRaw && Date.now() - Number(lastActiveRaw) > INACTIVITY_LIMIT_MS) {
      logger.info('[SESSION]', 'Inactive for 7+ days — clearing session')
      await clearSession()
      return false
    }

    // Token still valid
    if (Date.now() < expiry) {
      logger.info('[SESSION]', 'Session valid', { expiresAt: new Date(expiry).toISOString() })
      await touchLastActive()
      return true
    }

    // Token expired — try to refresh silently
    logger.info('[SESSION]', 'Token expired — attempting silent refresh')
    if (!refresh_token) return false

    const res = await apiRefreshSession({ refresh_token })
    await saveSession({
      token: res.data.session.access_token,
      refresh_token: res.data.session.refresh_token,
      expires_at: res.data.session.expires_at,
    })
    logger.info('[SESSION]', 'Silent refresh succeeded')
    return true
  } catch (err) {
    logger.warn('[SESSION]', `Session check failed — sending to auth: ${err.message}`)
    return false
  }
}

function RootStack({ sessionChecked, hasSession }) {
  const { colors, scheme } = useTheme()
  const { updateUser } = useUser()
  const router = useRouter()

  // Hydrate user context from the backend whenever a valid session is confirmed.
  // This covers app restarts where the token is valid but UserContext is empty.
  useEffect(() => {
    if (!hasSession) return
    apiGetMe()
      .then(res => { if (res?.data?.user) updateUser(res.data.user) })
      .catch(err => logger.warn('[PROFILE]', `Failed to hydrate profile: ${err.message}`))
  }, [hasSession])

  useEffect(() => {
    if (!sessionChecked) return
    if (hasSession) {
      router.replace('/(tabs)')
      // Request notification permissions + schedule defaults on session start
      requestNotificationPermissions().then(granted => {
        if (!granted) return
        // Schedule defaults; user toggles in settings can cancel/reschedule these
        scheduleDailyReminder(true)
        scheduleStreakAlert(true)
      })
    } else {
      router.replace('/(auth)/welcome')
    }
  }, [sessionChecked, hasSession])

  // Notification tap → deep-link into the app
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data
      if (data?.route) router.push({ pathname: data.route, params: data.params ?? {} })
    })
    return () => sub.remove()
  }, [])

  return (
    <>
      <StatusBar style={scheme === 'light' ? 'dark' : 'light'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="journey/[id]" />
        <Stack.Screen name="journey/create" />
        <Stack.Screen name="checkin/[journeyId]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="milestone/[id]" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="faq" />
        <Stack.Screen name="privacy" />
        <Stack.Screen name="terms" />
        <Stack.Screen name="cancellation" />
      </Stack>
    </>
  )
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_400Regular_Italic,
    Fraunces_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
  })
  const [sessionChecked, setSessionChecked] = useState(false)
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    hasValidSession().then(valid => {
      setHasSession(valid)
      setSessionChecked(true)
    })
  }, [])

  // Stamp last-active + keep backend awake whenever the app is in the foreground
  useEffect(() => {
    const PING_URL = 'https://vouch-backend-0q23.onrender.com/health'
    const INTERVAL_MS = 10 * 60 * 1000 // 10 minutes
    let timer = null

    const ping = () => fetch(PING_URL, { method: 'GET' }).catch(() => {})

    const startPing = () => {
      ping()
      timer = setInterval(ping, INTERVAL_MS)
    }

    const stopPing = () => {
      if (timer) { clearInterval(timer); timer = null }
    }

    // Start immediately (app is active on mount)
    startPing()

    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        touchLastActive()
        startPing()
      } else {
        stopPing()
      }
    })

    return () => {
      stopPing()
      sub.remove()
    }
  }, [])

  useEffect(() => {
    if (fontsLoaded && sessionChecked) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, sessionChecked])

  if (!fontsLoaded || !sessionChecked) return null

  return (
    <View style={{ flex: 1 }}>
      <ThemeProvider>
        <UserProvider>
          <RootStack sessionChecked={sessionChecked} hasSession={hasSession} />
        </UserProvider>
      </ThemeProvider>
    </View>
  )
}
