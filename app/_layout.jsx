import { useEffect, useState } from 'react'
import { Stack, useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { getItem, setItem, removeItem } from '../utils/storage'
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
import { UserProvider } from '../context/UserContext'

SplashScreen.preventAutoHideAsync()

export async function saveSession() {
  const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000
  await setItem('vouch_session', JSON.stringify({ token: 'dummy-token', expiry }))
}

export async function clearSession() {
  await removeItem('vouch_session')
}

async function hasValidSession() {
  try {
    const raw = await getItem('vouch_session')
    if (!raw) return false
    const { expiry } = JSON.parse(raw)
    return Date.now() < expiry
  } catch (_) {
    return false
  }
}

function RootStack({ sessionChecked, hasSession }) {
  const { colors, scheme } = useTheme()
  const router = useRouter()
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

  // Notification tap → deep-link (active when using a native dev build, no-op in Expo Go)
  useEffect(() => {
    let sub
    try {
      const N = require('expo-notifications')
      sub = N.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data
        if (data?.route) router.push({ pathname: data.route, params: data.params ?? {} })
      })
    } catch (_) {}
    return () => { try { sub?.remove() } catch (_) {} }
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

  useEffect(() => {
    if (fontsLoaded && sessionChecked) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, sessionChecked])

  if (!fontsLoaded || !sessionChecked) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <UserProvider>
          <RootStack sessionChecked={sessionChecked} hasSession={hasSession} />
        </UserProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}
