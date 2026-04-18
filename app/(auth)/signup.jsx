import { useState, useMemo, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { fonts } from '../../constants/fonts'
import { spacing } from '../../constants/spacing'
import { useTheme } from '../../context/ThemeContext'
import { saveSession } from '../_layout'
import { apiSignup } from '../../utils/api'
import { prefetchDiscoverJourneys } from '../../utils/journeyPrefetch'
import { logger } from '../../utils/logger'
import { useUser } from '../../context/UserContext'
import Button from '../../components/shared/Button'
import TextInput from '../../components/shared/TextInput'

export default function Signup() {
  const router = useRouter()
  const { colors } = useTheme()
  const { updateUser } = useUser()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => { prefetchDiscoverJourneys() }, [])

  const validate = () => {
    const e = {}
    if (!email.trim() || !email.includes('@')) e.email = 'Enter a valid email'
    if (password.length < 6) e.password = 'Password must be at least 6 characters'
    if (password !== confirm) e.confirm = 'Passwords do not match'
    return e
  }

  const handleSignup = async () => {
    const e = validate()
    if (Object.keys(e).length) {
      setErrors(e)
      return
    }
    setErrors({})
    setLoading(true)
    logger.action('[SIGNUP]', 'Submit pressed', { email: email.trim() })
    try {
      const res = await apiSignup({
        email: email.trim(),
        password,
        full_name: email.split('@')[0],
      })
      logger.info('[SIGNUP]', 'Account created — saving session')
      await saveSession({
        token: res.data.session.access_token,
        refresh_token: res.data.session.refresh_token,
        expires_at: res.data.session.expires_at,
        expires_in: res.data.session.expires_in,
      })
      if (res.data.user) updateUser(res.data.user)
      router.replace('/(auth)/onboarding')
    } catch (err) {
      logger.error('[SIGNUP]', `Signup failed: ${err.message}`)
      setErrors({ general: err.message })
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
            <Text style={styles.title}>Create your account</Text>
            <Text style={styles.subtitle}>Start your accountability journey today</Text>
          </View>

          {errors.general ? (
            <Text style={[styles.errorBanner, { color: colors.danger, borderColor: colors.danger + '40', backgroundColor: colors.danger + '0D' }]}>
              {errors.general}
            </Text>
          ) : null}

          <View style={styles.form}>
            <TextInput
              label="Email"
              value={email}
              onChangeText={t => { setEmail(t); setErrors(e => ({ ...e, email: '' })) }}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />
            <TextInput
              label="Password"
              value={password}
              onChangeText={t => { setPassword(t); setErrors(e => ({ ...e, password: '' })) }}
              placeholder="At least 6 characters"
              secureTextEntry
              error={errors.password}
            />
            <TextInput
              label="Confirm password"
              value={confirm}
              onChangeText={t => { setConfirm(t); setErrors(e => ({ ...e, confirm: '' })) }}
              placeholder="Repeat your password"
              secureTextEntry
              error={errors.confirm}
            />
          </View>

          <Button label="Create account" onPress={handleSignup} loading={loading} style={{ marginTop: spacing.md }} />

          <View style={styles.signinRow}>
            <Text style={[styles.signinPrompt, { color: colors.textSecondary }]}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')} activeOpacity={0.7}>
              <Text style={[styles.signinLink, { color: colors.accent }]}>Sign in</Text>
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
    errorBanner: { fontFamily: fonts.body, fontSize: 13, padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: spacing.md },
    form: { gap: spacing.md },
    signinRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.lg },
    signinPrompt: { fontFamily: fonts.body, fontSize: 14 },
    signinLink: { fontFamily: fonts.bodyBold, fontSize: 14 },
  })
}
