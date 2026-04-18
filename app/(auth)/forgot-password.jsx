import { useState, useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { fonts } from '../../constants/fonts'
import { spacing } from '../../constants/spacing'
import { useTheme } from '../../context/ThemeContext'
import { apiRecover } from '../../utils/api'
import Button from '../../components/shared/Button'
import TextInput from '../../components/shared/TextInput'

export default function ForgotPassword() {
  const router = useRouter()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSend = async () => {
    if (!email.trim()) { setError('Enter your email address'); return }
    setError('')
    setLoading(true)
    try {
      await apiRecover({ email: email.trim() })
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.sentContainer}>
          <View style={[styles.sentIcon, { backgroundColor: colors.success + '18' }]}>
            <Ionicons name="mail-outline" size={36} color={colors.success} />
          </View>
          <Text style={styles.sentTitle}>Check your inbox</Text>
          <Text style={styles.sentBody}>
            We sent a reset link to {email}. Tap it to set a new password.
          </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={[styles.backToSignin, { backgroundColor: colors.accent }]} activeOpacity={0.85}>
            <Text style={[styles.backToSigninText, { color: colors.bg }]}>Back to sign in</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
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
            <Text style={styles.title}>Reset password</Text>
            <Text style={styles.subtitle}>Enter your email and we'll send a reset link.</Text>
          </View>

          {error ? (
            <View style={[styles.errorBanner, { borderColor: colors.danger + '40', backgroundColor: colors.danger + '0D' }]}>
              <Text style={{ color: colors.danger, fontFamily: fonts.body, fontSize: 13 }}>{error}</Text>
            </View>
          ) : null}

          <TextInput
            label="Email"
            value={email}
            onChangeText={t => { setEmail(t); setError('') }}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Button label="Send reset link" onPress={handleSend} loading={loading} style={{ marginTop: spacing.md }} />
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
    sentContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg, gap: 16 },
    sentIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
    sentTitle: { fontFamily: fonts.display, fontSize: 26, color: colors.textPrimary, textAlign: 'center' },
    sentBody: { fontFamily: fonts.body, fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
    backToSignin: { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, marginTop: spacing.md },
    backToSigninText: { fontFamily: fonts.bodyBold, fontSize: 16 },
  })
}
