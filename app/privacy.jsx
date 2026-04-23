import { useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { fonts } from '../constants/fonts'
import { spacing } from '../constants/spacing'
import { useTheme } from '../context/ThemeContext'

const SECTIONS = [
  {
    title: '1. What we collect',
    body: `When you create a Vouch account, we collect:\n• Your name, email address, and profile information\n• Your country and region (used for partner matching)\n• Your check-in notes, proof photos or voice notes you submit\n• Journey data including milestones, streaks, and completion status\n• Device information and push notification tokens\n• Payment information (processed securely by Paystack — we do not store card details)`,
  },
  {
    title: '2. How we use your data',
    body: `We use your information to:\n• Match you with accountability partners in your region\n• Calculate and display your streak and reputation score\n• Send you push notifications about your journeys and partners\n• Process security deposits and refunds via Paystack\n• Improve the app based on how it is used`,
  },
  {
    title: '3. Security deposits',
    body: 'When you pay a security deposit, your payment is processed and held by Paystack. Vouch does not store your card details. Deposits are refunded automatically to your original payment method based on your journey completion percentage. Forfeited deposits are retained by Vouch as platform revenue.',
  },
  {
    title: '4. Data sharing',
    body: 'We do not sell your personal data to third parties. Your check-ins and profile information are visible to members of your active journeys. Your email address is never shared with other users. We use Paystack for payment processing and Supabase for secure data storage.',
  },
  {
    title: '5. Your rights',
    body: `You have the right to:\n• Access your personal data at any time from your profile\n• Update or correct your information in Settings\n• Delete your account (Settings → Delete Account)\n• Request a copy of your data by contacting us at privacy@vouch.app`,
  },
  {
    title: '6. Data retention',
    body: 'Your data is retained while your account is active. Journey chat history is cleared 7 days after a journey ends. When you delete your account, your personal data is removed within 30 days. Transaction records are retained for 7 years for financial compliance purposes.',
  },
  {
    title: '7. Cookies',
    body: 'The Vouch mobile app does not use browser cookies. We use secure local storage on your device to maintain your login session for up to 7 days. This session data is cleared when you log out.',
  },
  {
    title: '8. Children',
    body: 'Vouch is intended for users aged 13 and above. Users under 18 should have parental consent before using the platform, particularly for features involving security deposits.',
  },
  {
    title: '9. Changes to this policy',
    body: 'We may update this policy from time to time. We will notify you of significant changes through the app. Continued use of Vouch after changes constitutes acceptance of the updated policy.',
  },
  {
    title: '10. Contact',
    body: 'For privacy questions or data requests, contact us at:\nprivacy@vouch.app',
  },
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
