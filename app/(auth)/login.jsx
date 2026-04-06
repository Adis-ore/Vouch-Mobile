import { useState, useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { fonts } from '../../constants/fonts'
import { spacing } from '../../constants/spacing'
import { useTheme } from '../../context/ThemeContext'
import Button from '../../components/shared/Button'
import TextInput from '../../components/shared/TextInput'

export default function Login() {
  const router = useRouter()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!phone.trim()) { setError('Please enter your phone number'); return }
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 900))
    setLoading(false)
    router.replace('/(tabs)')
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to continue your journeys</Text>
          </View>

          <View style={styles.form}>
            <TextInput label="Phone number" value={phone} onChangeText={setPhone} placeholder="+234 800 000 0000" keyboardType="phone-pad" error={error} />
            <TextInput label="Password" placeholder="••••••••" secureTextEntry />
          </View>

          <Button label="Sign in" onPress={handleLogin} loading={loading} style={{ marginTop: spacing.md }} />
          <Text style={styles.hint}>Demo: any phone + password works</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function makeStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    container: { padding: spacing.lg, paddingTop: spacing.md, flexGrow: 1 },
    back: { marginBottom: spacing.xl },
    backText: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.textSecondary },
    header: { gap: 6, marginBottom: spacing.xl },
    title: { fontFamily: fonts.display, fontSize: 32, color: colors.textPrimary },
    subtitle: { fontFamily: fonts.body, fontSize: 15, color: colors.textSecondary },
    form: { gap: spacing.md },
    hint: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg },
  })
}
