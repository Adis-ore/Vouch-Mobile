import { useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { fonts } from '../constants/fonts'
import { spacing } from '../constants/spacing'
import { useTheme } from '../context/ThemeContext'

const SECTIONS = [
  { title: 'What we collect', body: 'We collect your name, phone number, and country when you sign up. We collect check-in notes, photos you upload as proof, and messages you send within journey groups. We also collect usage data — which screens you visit and how often — to improve the app.' },
  { title: 'How we use your data', body: 'Your check-ins and messages are shared with members of your journey only. Your profile (name, reputation score, bio) is visible to all Vouch users. We use your usage data internally to improve features. We do not sell your data to third parties.' },
  { title: 'Stakes and payments', body: 'Stake deposits are processed via our payment partner (Paystack). We store only the transaction reference — not your card details. If you forfeit your stake, the funds go to Vouch — not to other users. Completed journeys receive their deposit back within 3–5 business days.' },
  { title: 'Photos and proof', body: 'Photos uploaded as check-in proof are stored securely and visible only to your journey group. You can delete a photo within 1 hour of upload. After 90 days, photos are automatically deleted from our servers.' },
  { title: 'Data retention', body: 'Your account data is kept for as long as your account is active. If you delete your account, we delete your personal data within 30 days. Check-in records may be kept in anonymised form for platform analytics.' },
  { title: 'Your rights', body: 'You can request a copy of your data, correct inaccurate information, or delete your account at any time. Contact us at privacy@vouch.app. We will respond within 14 days.' },
  { title: 'Cookies and tracking', body: 'The Vouch mobile app does not use browser cookies. We use a device identifier to keep you signed in. We may use crash reporting tools (e.g. Sentry) that collect anonymised error data to help us fix bugs.' },
  { title: 'Children', body: 'Vouch is not intended for users under the age of 16. If we become aware that a user is under 16, we will delete their account and data.' },
  { title: 'Changes to this policy', body: 'We will notify you in-app if we make significant changes to this privacy policy. Continued use of Vouch after changes are posted means you accept the updated policy.' },
  { title: 'Contact', body: 'For privacy-related questions, email privacy@vouch.app. For general support, email support@vouch.app.' },
]

export default function Privacy() {
  const router = useRouter()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy policy</Text>
        <View style={{ width: 30 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.updated}>Last updated: January 2025</Text>
        <Text style={styles.intro}>Vouch is built on trust. This policy explains what we collect, why, and how we protect it.</Text>
        {SECTIONS.map((s, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}
        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  )
}

function makeStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
    backBtn: { padding: 4 },
    title: { fontFamily: fonts.display, fontSize: 18, color: colors.textPrimary },
    content: { padding: spacing.lg, gap: spacing.md },
    updated: { fontFamily: fonts.body, fontSize: 11, color: colors.textMuted },
    intro: { fontFamily: fonts.body, fontSize: 15, color: colors.textSecondary, lineHeight: 22, fontStyle: 'italic' },
    section: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 8 },
    sectionTitle: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.textPrimary },
    sectionBody: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  })
}
