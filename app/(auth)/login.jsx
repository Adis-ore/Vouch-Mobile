import { useState, useMemo, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { fonts } from '../../constants/fonts'
import { spacing } from '../../constants/spacing'
import { useTheme } from '../../context/ThemeContext'
import { saveSession } from '../_layout'
import { apiSignin, apiGetMe } from '../../utils/api'
import { prefetchDiscoverJourneys } from '../../utils/journeyPrefetch'
import { logger } from '../../utils/logger'
import { useUser } from '../../context/UserContext'
import Button from '../../components/shared/Button'
import TextInput from '../../components/shared/TextInput'

export default function Login() {
  const router = useRouter()
  const { colors } = useTheme()
  const { updateUser } = useUser()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errorCode, setErrorCode] = useState('')

  useEffect(() => { prefetchDiscoverJourneys() }, [])

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password')
      return
    }
    setError('')
    setErrorCode('')
    setLoading(true)
    logger.action('[LOGIN]', 'Submit pressed', { email: email.trim() })
    try {
      const res = await apiSignin({ email: email.trim(), password })
      logger.info('[LOGIN]', 'Signin successful — saving session')
      await saveSession({
        token: res.data.session.access_token,
        refresh_token: res.data.session.refresh_token,
        expires_at: res.data.session.expires_at,
        expires_in: res.data.session.expires_in,
      })
      try {
        const me = await apiGetMe()
        if (me?.data?.user) updateUser(me.data.user)
      } catch {
        if (res.data.user) updateUser(res.data.user)
      }
      logger.info('[LOGIN]', 'Navigating to tabs')
      router.replace('/(tabs)')
    } catch (err) {
      logger.error('[LOGIN]', `Signin failed: ${err.message}`)
      setError(err.message)
      setErrorCode(err.code || '')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to continue your journeys</Text>
          </View>

          {error ? (
            <View style={[styles.errorBanner, { borderColor: colors.danger + '40', backgroundColor: colors.danger + '0D' }]}>
              <Text style={{ color: colors.danger, fontFamily: fonts.body, fontSize: 13 }}>{error}</Text>
              {errorCode === 'INVALID_CREDENTIALS' && (
                <View style={{ flexDirection: 'row', marginTop: 6 }}>
                  <Text style={{ color: colors.textSecondary, fontFamily: fonts.body, fontSize: 13 }}>No account? </Text>
                  <TouchableOpacity onPress={() => router.replace('/(auth)/signup')} activeOpacity={0.7}>
                    <Text style={{ color: colors.accent, fontFamily: fonts.bodyBold, fontSize: 13 }}>Create one</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : null}

          <View style={styles.form}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={t => { setEmail(t); setError('') }}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View>
              <TextInput
                label="Password"
                value={password}
                onChangeText={t => { setPassword(t); setError('') }}
                placeholder="••••••••"
                secureTextEntry
              />
              <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} style={styles.forgotWrap} activeOpacity={0.7}>
                <Text style={[styles.forgotText, { color: colors.accent }]}>Forgot password?</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Button label="Sign in" onPress={handleLogin} loading={loading} style={{ marginTop: spacing.md }} />

          <View style={styles.signupRow}>
            <Text style={[styles.signupPrompt, { color: colors.textSecondary }]}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')} activeOpacity={0.7}>
              <Text style={[styles.signupLink, { color: colors.accent }]}>Create one</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function makeStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    container: { padding: spacing.lg, paddingTop: spacing.md, flexGrow: 1 },
    back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.xl },
    backText: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.textSecondary },
    header: { gap: 6, marginBottom: spacing.xl },
    title: { fontFamily: fonts.display, fontSize: 32, color: colors.textPrimary },
    subtitle: { fontFamily: fonts.body, fontSize: 15, color: colors.textSecondary },
    errorBanner: { padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: spacing.md },
    form: { gap: spacing.md },
    forgotWrap: { alignSelf: 'flex-end', marginTop: 6 },
    forgotText: { fontFamily: fonts.bodyMedium, fontSize: 13 },
    signupRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.lg },
    signupPrompt: { fontFamily: fonts.body, fontSize: 14 },
    signupLink: { fontFamily: fonts.bodyBold, fontSize: 14 },
  })
}
