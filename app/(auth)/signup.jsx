import { useState, useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { fonts } from '../../constants/fonts'
import { spacing } from '../../constants/spacing'
import { useTheme } from '../../context/ThemeContext'
import { saveSession } from '../_layout'
import Button from '../../components/shared/Button'
import TextInput from '../../components/shared/TextInput'

function GoogleIcon() {
  return (
    <View style={{ width: 18, height: 18 }}>
      <Text style={{ fontSize: 14, lineHeight: 18 }}>
        {/* inline SVG-equivalent via text isn't ideal; use a proper SVG */}
      </Text>
    </View>
  )
}

export default function Signup() {
  const router = useRouter()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!email.trim() || !email.includes('@')) e.email = 'Enter a valid email'
    if (password.length < 6) e.password = 'Password must be at least 6 characters'
    if (password !== confirm) e.confirm = 'Passwords do not match'
    return e
  }

  const handleSignup = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({})
    setLoading(true)
    await new Promise(r => setTimeout(r, 900))
    await saveSession()
    setLoading(false)
    router.replace('/(auth)/onboarding')
  }

  const handleGoogle = async () => {
    setGoogleLoading(true)
    await new Promise(r => setTimeout(r, 1500))
    await saveSession()
    setGoogleLoading(false)
    router.replace('/(auth)/onboarding')
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

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={[styles.googleBtn, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={handleGoogle} activeOpacity={0.85} disabled={googleLoading}>
            {googleLoading ? (
              <ActivityIndicator size="small" color={colors.textSecondary} />
            ) : (
              <>
                <GoogleLogo size={18} />
                <Text style={[styles.googleText, { color: colors.textPrimary }]}>Sign up with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.signinRow}>
            <Text style={styles.signinPrompt}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')} activeOpacity={0.7}>
              <Text style={[styles.signinLink, { color: colors.accent }]}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function GoogleLogo({ size = 18 }) {
  // Official Google G colors
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* G shape via SVG paths would need react-native-svg; approximate with styled text */}
      <Text style={{ fontSize: size - 2, lineHeight: size, fontWeight: '700', color: '#4285F4', fontFamily: 'System' }}>G</Text>
    </View>
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
    form: { gap: spacing.md },
    dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: spacing.md },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },
    googleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 48, borderRadius: 10, borderWidth: 1 },
    googleText: { fontFamily: fonts.bodyMedium, fontSize: 15 },
    signinRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.lg },
    signinPrompt: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary },
    signinLink: { fontFamily: fonts.bodyBold, fontSize: 14 },
  })
}
