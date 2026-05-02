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
    title: '1. Subscription cancellation',
    body: 'You may cancel your Vouch Pro or Elite subscription at any time from Settings → Your Plan → Cancel Subscription.\n\nWhen you cancel:\n• Your subscription remains active until the end of your current billing period\n• You will not be charged again after cancellation\n• You retain access to all Pro/Elite features until the billing period ends\n• After the period ends, your account automatically reverts to the Free plan\n• Your journeys, history, badges, and streak data are preserved\n\nWe do not offer prorated refunds for unused days within a billing period.',
  },
  {
    title: '2. Journey Pass — non-refundable',
    body: 'Journey Pass purchases (₦800 one-time) are non-refundable once purchased. The pass activates immediately and is tied to a specific journey for its full duration.',
  },
  {
    title: '3. Refund eligibility',
    body: 'We offer refunds in the following circumstances only:\n• You were charged twice for the same subscription period (billing error)\n• You were charged after cancelling your subscription (system error)\n• Your account was not activated due to a payment processing error\n\nTo request a refund, email vouchapp0@gmail.com within 7 days of the charge with your account email and transaction reference.\n\nWe do not offer refunds for:\n• Change of mind after subscribing\n• Unused days within a billing period\n• Accounts suspended for Terms of Service violations\n• Journey Pass purchases',
  },
  {
    title: '4. How to cancel',
    body: 'In-app: Settings → Your Plan → Cancel Subscription\n\nIf you are unable to cancel through the app, email vouchapp0@gmail.com with the subject line "Cancel Subscription" and your account email. We will process your cancellation within 24 hours.',
  },
  {
    title: '5. Account deletion',
    body: 'Deleting your account (Settings → Delete Account) automatically cancels any active subscription. No further charges will be made. Account deletion is permanent and cannot be undone.',
  },
  {
    title: '6. Contact',
    body: 'For billing or cancellation queries:\nEmail: vouchapp0@gmail.com\nResponse time: within 24 hours on business days',
  },
]

export default function Cancellation() {
  const router = useRouter()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Cancellation policy</Text>
        <View style={{ width: 30 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.updated}>Last updated: April 2025</Text>
        <Text style={styles.intro}>Our cancellation and refund policy for subscriptions and one-time purchases.</Text>
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
