import { Stack } from 'expo-router'
import { useTheme } from '../../context/ThemeContext'

export default function AuthLayout() {
  const { colors } = useTheme()
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
    </Stack>
  )
}
