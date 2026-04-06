import { useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { fonts } from '../constants/fonts'
import { spacing } from '../constants/spacing'
import { useTheme } from '../context/ThemeContext'

const SECTIONS = [
  { title: '1. Acceptance of terms', body: 'By creating an account or using Vouch, you agree to these Terms of Service. If you do not agree, do not use the app. We may update these terms — continued use after changes are posted means you accept the updated terms.' },
  { title: '2. Eligibility', body: 'You must be at least 16 years old to use Vouch. By registering, you confirm that the information you provide is accurate and that you are legally permitted to enter into this agreement.' },
  { title: '3. Your account', body: 'You are responsible for keeping your account credentials secure. Do not share your account. You are responsible for all activity that occurs under your account. Notify us immediately at support@vouch.app if you suspect unauthorised access.' },
  { title: '4. Journeys and commitments', body: 'Journeys are voluntary commitments made between users. Vouch facilitates accountability but is not responsible for whether individual users complete their goals. Check-ins and milestones are user-generated content.' },
  { title: '5. Stakes and payments', body: 'When you join a journey with a stake, you authorise a deposit via our payment partner (Paystack). If you forfeit your stake under the journey rules, those funds go to Vouch. They are not redistributed to other members. Completed journeys receive their deposit back within 3–5 business days. All payments are final.' },
  { title: '6. User content', body: 'You retain ownership of content you post (check-in notes, photos, messages). By posting, you grant Vouch a non-exclusive, royalty-free licence to store, display, and share that content within the platform. You may not post illegal, harmful, or misleading content.' },
  { title: '7. Prohibited conduct', body: "You may not: impersonate others, submit false check-ins, harass or abuse other users, attempt to circumvent platform rules, use Vouch for any unlawful purpose, or interfere with the platform's technical infrastructure." },
  { title: '8. Reputation and scores', body: 'Reputation scores are calculated automatically based on your activity. We reserve the right to adjust or reset scores if we detect fraudulent check-ins or abuse of the verification system.' },
  { title: '9. Termination', body: 'We may suspend or terminate your account if you violate these terms. You may delete your account at any time. Upon termination, your stake deposits that have not yet been resolved will be handled according to the journey rules in effect at the time.' },
  { title: '10. Disclaimer', body: 'Vouch is provided "as is". We make no guarantees about uptime, data accuracy, or outcomes. We are not liable for any indirect or consequential damages arising from your use of the platform.' },
  { title: '11. Governing law', body: 'These terms are governed by the laws of the Federal Republic of Nigeria. Any disputes will be resolved in the courts of Lagos State, Nigeria.' },
  { title: '12. Contact', body: 'For questions about these terms, email legal@vouch.app. For general support, email support@vouch.app.' },
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
        <Text style={styles.updated}>Last updated: January 2025</Text>
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
