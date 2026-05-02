import { useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { fonts } from '../constants/fonts'
import { spacing } from '../constants/spacing'
import { useTheme } from '../context/ThemeContext'

const SECTIONS = [
  { title: '1. Acceptance of terms', body: 'By creating a Vouch account, you agree to these Terms of Service. If you do not agree, do not use the app.' },
  { title: '2. Eligibility', body: 'You must be at least 13 years old to use Vouch. By creating an account, you confirm that you meet this age requirement. Users under 18 are responsible for ensuring they have parental awareness.' },
  { title: '3. Your account', body: 'You are responsible for keeping your login credentials secure and for all activity that occurs under your account. You may not create multiple accounts or share your account with others. Notify us immediately at vouchapp0@gmail.com if you suspect unauthorised access.' },
  { title: '4. Acceptable use', body: 'You agree not to: submit fake check-ins or misrepresent your progress; harass, threaten, or abuse other users; use Vouch for any illegal purpose; attempt to access other users\' private data; reverse engineer, copy, or resell any part of the platform; post content that is offensive, discriminatory, or harmful.' },
  { title: '5. Subscriptions', body: 'Vouch offers Pro (₦1,500/month or ₦12,000/year), Elite (₦3,000/month or ₦24,000/year), and Journey Pass (₦800 one-time). Subscriptions are billed in advance. By subscribing, you authorise Paystack to charge your payment method on a recurring basis until you cancel. All payments are processed securely by Paystack. Vouch does not store your card or bank account details.' },
  { title: '6. Cancellation and refunds', body: 'See our Cancellation Policy (Settings → Cancellation Policy) for full details on cancellations, refunds, and what happens when your subscription ends.' },
  { title: '7. Content you submit', body: 'You retain ownership of content you submit (check-in notes, photos, voice notes). By submitting content, you grant Vouch a limited licence to display that content to members of your journey group. You are responsible for ensuring your content does not violate any third-party rights or applicable laws.' },
  { title: '8. Suspension and termination', body: 'Vouch may suspend or permanently ban any account that repeatedly submits fake check-ins, harasses other users, violates these Terms, or engages in fraudulent activity. If your account is suspended for policy violations, subscription fees already paid are non-refundable.' },
  { title: '9. Reputation and scores', body: 'Reputation scores are calculated automatically based on your activity. We reserve the right to adjust or reset scores if we detect fraudulent check-ins or abuse of the verification system.' },
  { title: '10. Disclaimer', body: 'Vouch is provided "as is." We do not guarantee that the service will be uninterrupted or error-free. Accountability outcomes depend entirely on the effort and commitment of the users involved.' },
  { title: '11. Limitation of liability', body: 'To the maximum extent permitted by law, Vouch shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform, including loss of data, failed goals, or disputes between users.' },
  { title: '12. Governing law', body: 'These Terms are governed by the laws of the Federal Republic of Nigeria. Any disputes shall be resolved under Nigerian jurisdiction.' },
  { title: '13. Changes to terms', body: 'We may update these Terms from time to time. Continued use of Vouch after changes are posted constitutes acceptance. We will notify users of significant changes through the app.' },
  { title: '14. Contact', body: 'For questions about these Terms:\nEmail: vouchapp0@gmail.com\nFor general support: vouchapp0@gmail.com' },
]

export default function Terms() {
  const router = useRouter()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Terms of service</Text>
        <View style={{ width: 30 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.updated}>Last updated: April 2025</Text>
        <Text style={styles.intro}>These terms govern your use of Vouch. Please read them carefully.</Text>
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
