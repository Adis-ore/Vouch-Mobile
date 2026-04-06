import { useState, useMemo } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { fonts } from '../../constants/fonts'
import { spacing } from '../../constants/spacing'
import { useTheme } from '../../context/ThemeContext'
import { MILESTONES, ACTIVE_JOURNEY } from '../../data/dummy'
import Button from '../../components/shared/Button'

const RATING_QUESTIONS = {
  Learning: ['What was the most important thing you learned this week?', 'Rate your understanding this week (1–5)'],
  Fitness: ['What progress did you make physically this week?', 'Rate your effort this week (1–5)'],
  Habit: ['How consistent were you this week?', 'Rate how the habit is feeling (1–5)'],
  Career: ['What did you ship or complete this week?', 'Rate your momentum this week (1–5)'],
  default: ['What went well this week?', 'Rate your week overall (1–5)'],
}

export default function MilestoneReflection() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const milestone = MILESTONES.find(m => m.id === id) ?? MILESTONES[1]
  const journey = ACTIVE_JOURNEY
  const questions = RATING_QUESTIONS[journey.category] ?? RATING_QUESTIONS.default
  const [answer, setAnswer] = useState('')
  const [rating, setRating] = useState(0)
  const [submitted, setSubmitted] = useState(false)

  const submit = () => { if (!answer.trim() || !rating) return; setSubmitted(true) }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.weekLabel}>Week {milestone.week_number} Reflection</Text>
        <Text style={styles.journeyTitle}>{journey.title}</Text>
        <View style={styles.milestoneCard}>
          <Text style={styles.milestoneTitle}>{milestone.title}</Text>
          <Text style={styles.milestoneDesc}>{milestone.description}</Text>
        </View>
        <Text style={styles.unlockNote}>Tell your group what you actually learned before Week {milestone.week_number + 1} unlocks.</Text>

        {!submitted ? (
          <>
            <View style={styles.question}>
              <Text style={styles.questionText}>{questions[0]}</Text>
              <TextInput style={styles.textarea} value={answer} onChangeText={setAnswer} placeholder="Be honest — what actually happened?" placeholderTextColor={colors.textMuted} multiline textAlignVertical="top" />
            </View>
            <View style={styles.question}>
              <Text style={styles.questionText}>{questions[1]}</Text>
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map(n => (
                  <TouchableOpacity key={n} onPress={() => setRating(n)} activeOpacity={0.7}>
                    <Text style={[styles.star, n <= rating && styles.starFilled]}>★</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <Button label="Submit reflection" onPress={submit} disabled={!answer.trim() || !rating} />
          </>
        ) : (
          <View style={styles.submitted}>
            <Ionicons name="checkmark-circle" size={48} color={colors.success} />
            <Text style={styles.submittedTitle}>Reflection submitted!</Text>
            <Text style={styles.submittedSub}>Week {milestone.week_number + 1} will unlock once your group members submit theirs.</Text>
            <Text style={styles.othersTitle}>Other members' reflections</Text>
            <View style={styles.blurCard}><Text style={styles.blurText}>Waiting for others...</Text></View>
            <Button label="Back to journey" onPress={() => router.back()} variant="outline" style={{ marginTop: spacing.md }} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function makeStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    backBtn: { alignSelf: 'flex-start' },
    backText: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.textSecondary },
    weekLabel: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.accent },
    journeyTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.textPrimary, lineHeight: 28, marginTop: -spacing.xs },
    milestoneCard: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 6 },
    milestoneTitle: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.textPrimary },
    milestoneDesc: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
    unlockNote: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, fontStyle: 'italic', lineHeight: 20 },
    question: { gap: 10 },
    questionText: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.textPrimary, lineHeight: 22 },
    textarea: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, fontSize: 15, fontFamily: fonts.body, color: colors.textPrimary, minHeight: 110 },
    stars: { flexDirection: 'row', gap: 8 },
    star: { fontSize: 32, color: colors.surfaceAlt },
    starFilled: { color: colors.accent },
    submitted: { alignItems: 'center', gap: 12, paddingTop: spacing.lg },
    submittedTitle: { fontFamily: fonts.display, fontSize: 24, color: colors.textPrimary },
    submittedSub: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
    othersTitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.textPrimary, alignSelf: 'flex-start', marginTop: spacing.sm },
    blurCard: { width: '100%', backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 20, alignItems: 'center', opacity: 0.5 },
    blurText: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, fontStyle: 'italic' },
  })
}
