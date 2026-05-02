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
    title: '1. Introduction',
    body: 'Vouch ("we", "our", "us") is committed to protecting your personal information. This policy explains what data we collect, how we use it, and your rights regarding your information.',
  },
  {
    title: '2. Information we collect',
    body: 'Account information: full name, email address, profile avatar, country and region.\n\nUsage information: journeys you create, join, complete, or abandon; daily check-in notes and proof; streak history; milestone progress; check-in approvals and flags; messages in journey group chats.\n\nDevice information: push notification token, device type, OS, and app version.\n\nPayment information: subscription history and Journey Pass purchases. All card and bank details are processed and stored exclusively by Paystack. Vouch does not store, access, or retain your card or bank account information.',
  },
  {
    title: '3. How we use your information',
    body: 'We use your information to:\n• Create and manage your Vouch account\n• Match you with accountability partners in your region\n• Display your streak, reputation, and progress to your journey group\n• Send push notifications about check-in reminders, partner activity, streak milestones, and journey updates\n• Process subscription and Journey Pass payments via Paystack\n• Investigate reports of fake check-ins or policy violations\n• Improve the Vouch platform based on usage patterns',
  },
  {
    title: '4. Information visible to other users',
    body: 'Visible to your journey group:\n• Your display name and avatar\n• Your daily check-in notes and any proof you submit\n• Your streak count and milestone progress\n• Your reputation score\n\nNever visible to other users:\n• Your email address\n• Your payment history\n• Your phone number\n\nIf you enable anonymous mode (Pro feature), your name is hidden in Discover. It remains visible to members of journeys you have already joined.',
  },
  {
    title: '5. Data sharing',
    body: 'We do not sell your personal data to any third party.\n\nWe share limited data with:\n• Paystack — to process subscription and Journey Pass payments\n• Supabase — our secure database and file storage provider\n• Expo — to deliver push notifications to your device\n\nAll providers are bound by data processing agreements.',
  },
  {
    title: '6. Data retention',
    body: 'Active account data is retained while your account exists. Journey chat history is deleted 7 days after a journey ends. When you delete your account, your personal data is removed within 30 days. Transaction records are retained for 7 years to comply with financial regulations in Nigeria.',
  },
  {
    title: '7. Your rights',
    body: 'You have the right to:\n• Access your personal data (view your profile and journey history in the app)\n• Correct inaccurate information (edit your profile in Settings)\n• Delete your account and associated data (Settings → Delete Account)\n• Request a copy of your data by emailing vouchapp0@gmail.com\n• Withdraw consent for push notifications (Settings → Notifications)',
  },
  {
    title: '8. Security',
    body: 'We take reasonable technical and organisational measures to protect your data, including encrypted data transmission, secure cloud storage, and access controls. If you believe your account has been compromised, contact us immediately at vouchapp0@gmail.com.',
  },
  {
    title: '9. Children',
    body: 'Vouch is intended for users aged 13 and above. Users under 18 should have parental awareness before using the platform. We do not knowingly collect data from children under 13.',
  },
  {
    title: '10. Cookies and local storage',
    body: 'The Vouch mobile app does not use browser cookies. We use secure local storage on your device to maintain your login session for up to 7 days. This is cleared when you log out or delete the app.',
  },
  {
    title: '11. Changes to this policy',
    body: 'We may update this Privacy Policy from time to time. We will notify you of significant changes through an in-app notification. Continued use of Vouch after changes are posted constitutes acceptance of the updated policy.',
  },
  {
    title: '12. Contact',
    body: 'For privacy questions, data requests, or concerns:\nEmail: vouchapp0@gmail.com\nResponse time: within 5 business days',
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
        <Text style={styles.updated}>Last updated: April 2025</Text>
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
