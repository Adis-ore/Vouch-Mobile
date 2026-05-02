import { useState, useMemo } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { fonts } from '../constants/fonts'
import { spacing } from '../constants/spacing'
import { useTheme } from '../context/ThemeContext'

const FAQS = [
  { q: 'What is a journey?', a: 'A journey is a shared goal you commit to with a group. You set a duration, check in daily, and hold each other accountable. Examples: learning Python in 30 days, running 5km daily for 21 days, or building a product in 60 days.' },
  { q: 'How do daily check-ins work?', a: "Each day you write a short note about what you actually did — be specific. You can also attach a photo as proof. Your group can see and verify each other's check-ins." },
  { q: 'What happens if I miss a day?', a: 'In strict mode, missing a day resets your streak to zero. In flexible mode, you get one grace day per week. Either way, you can always check in and continue — the journey keeps going.' },
  { q: 'How do stakes work?', a: 'When you join a journey with a stake, you deposit the amount upfront (e.g. ₦1,000). If you complete the journey, you get it back in full. If you miss 3 consecutive days, your deposit is forfeited to Vouch — it is not given to other users.' },
  { q: 'How is my reputation score calculated?', a: 'Your reputation score reflects your check-in consistency, milestone completion rate, and how often your check-ins are verified by others. It increases when you complete journeys and stays high if you stay consistent.' },
  { q: "Can I leave a journey once I've joined?", a: 'Yes, but leaving forfeits your stake (if any) and removes you from the group. Your reputation score will not be penalised if you leave within the first 24 hours of joining.' },
  { q: 'How do milestones work?', a: "Milestones are weekly checkpoints. When a milestone week ends, each member writes a reflection. Once all members submit, the next week unlocks. It's how the group syncs and makes sure no one is left behind." },
  { q: 'What counts as valid proof?', a: "Any photo that shows evidence of your work that day — a screenshot of code, a photo of a workout, a selfie from a run, notes you took. Your group decides if it's valid when they verify." },
  { q: 'Who can see my check-ins?', a: "Only members of your journey can see your check-ins. They're not public. Your profile and stats are visible to anyone on Vouch." },
  { q: 'How do I find a journey to join?', a: 'Go to the Discover tab. You can filter by category (Fitness, Learning, Habit, etc.) and location. Journeys with open spots show a Join button.' },
  { q: 'Is Vouch free to use?', a: "Vouch is free. Stakes are optional — they're your own money that you get back on completion. We don't charge a platform fee." },
  { q: 'How do I contact support?', a: 'Send an email to vouchapp0@gmail.com. We typically respond within 24 hours.' },
]

export default function FAQ() {
  const router = useRouter()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const [open, setOpen] = useState(null)

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>FAQ</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>Common questions about Vouch.</Text>
        {FAQS.map((item, i) => (
          <TouchableOpacity key={i} style={[styles.item, open === i && styles.itemOpen]} onPress={() => setOpen(open === i ? null : i)} activeOpacity={0.8}>
            <View style={styles.itemHeader}>
              <Text style={[styles.question, open === i && styles.questionOpen]}>{item.q}</Text>
              <Ionicons name={open === i ? 'chevron-up' : 'chevron-down'} size={16} color={open === i ? colors.accent : colors.textMuted} />
            </View>
            {open === i && <Text style={styles.answer}>{item.a}</Text>}
          </TouchableOpacity>
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
    content: { padding: spacing.lg, gap: spacing.sm },
    intro: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, marginBottom: spacing.xs },
    item: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 16 },
    itemOpen: { borderColor: colors.accent + '40' },
    itemHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    question: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
    questionOpen: { color: colors.accent },
    answer: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary, lineHeight: 21, marginTop: 12 },
  })
}
