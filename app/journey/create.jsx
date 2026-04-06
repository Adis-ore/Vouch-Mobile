import { useState, useMemo } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { fonts } from '../../constants/fonts'
import { spacing } from '../../constants/spacing'
import { useTheme } from '../../context/ThemeContext'
import { CATEGORIES } from '../../data/dummy'
import Button from '../../components/shared/Button'
import CategoryChip from '../../components/shared/CategoryChip'

const TOTAL_STEPS = 5
const DURATIONS = [7, 14, 21, 30, 60, 90]
const MAX_PARTICIPANTS = [2, 5, 10, 20]
const QUICK_STAKES = [500, 1000, 2000, 5000]

export default function CreateJourney() {
  const router = useRouter()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState(30)
  const [maxParticipants, setMaxParticipants] = useState(2)
  const [milestones, setMilestones] = useState([])
  const [stakeEnabled, setStakeEnabled] = useState(false)
  const [stakeAmount, setStakeAmount] = useState(1000)

  const weeksCount = Math.ceil(duration / 7)

  const updateMilestone = (i, field, val) => {
    setMilestones(prev => { const copy = [...prev]; copy[i] = { ...copy[i], [field]: val }; return copy })
  }

  const getMilestones = () => Array.from({ length: weeksCount }, (_, i) => ({ week: i + 1, title: '', description: '', ...(milestones[i] || {}) }))

  const next = () => step < TOTAL_STEPS ? setStep(s => s + 1) : publish()
  const back = () => setStep(s => s - 1)
  const publish = () => router.replace(`/journey/journey-1`)

  const canContinue = [
    step === 1 && title.trim().length > 3 && category,
    step === 2,
    step === 3 && getMilestones().every(m => m.title.trim()),
    step === 4,
    step === 5,
  ][step - 1]

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.progressRow}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <View key={i} style={[styles.dot, i + 1 === step && styles.dotActive, i + 1 < step && styles.dotDone]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.prompt}>The basics</Text>
            <TextInput style={styles.bigInput} value={title} onChangeText={setTitle} placeholder="Journey title..." placeholderTextColor={colors.textMuted} />
            <Text style={styles.sectionLabel}>Category</Text>
            <View style={styles.chipGrid}>
              {CATEGORIES.map(c => <CategoryChip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />)}
            </View>
            <Text style={styles.sectionLabel}>Description</Text>
            <TextInput style={styles.textarea} value={description} onChangeText={setDescription} placeholder="What is this journey about? What will members do each day?" placeholderTextColor={colors.textMuted} multiline textAlignVertical="top" />
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.prompt}>Timeline & size</Text>
            <Text style={styles.sectionLabel}>Duration</Text>
            <View style={styles.chipGrid}>
              {DURATIONS.map(d => <CategoryChip key={d} label={`${d}d`} selected={duration === d} onPress={() => setDuration(d)} />)}
            </View>
            <Text style={styles.sectionLabel}>Max participants</Text>
            <View style={styles.chipGrid}>
              {MAX_PARTICIPANTS.map(n => <CategoryChip key={n} label={`${n} people`} selected={maxParticipants === n} onPress={() => setMaxParticipants(n)} />)}
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.prompt}>Break it into weeks</Text>
            <Text style={styles.stepNote}>Give each week a title and description.</Text>
            {getMilestones().map((m, i) => (
              <View key={i} style={styles.milestoneSlot}>
                <Text style={styles.weekLabel}>Week {m.week}</Text>
                <TextInput style={styles.slotInput} value={m.title} onChangeText={v => updateMilestone(i, 'title', v)} placeholder="Milestone title" placeholderTextColor={colors.textMuted} />
                <TextInput style={[styles.slotInput, { height: 60 }]} value={m.description} onChangeText={v => updateMilestone(i, 'description', v)} placeholder="What should members accomplish?" placeholderTextColor={colors.textMuted} multiline textAlignVertical="top" />
              </View>
            ))}
          </View>
        )}

        {step === 4 && (
          <View style={styles.stepContainer}>
            <Text style={styles.prompt}>Security deposit</Text>
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.toggleLabel}>Add a deposit?</Text>
                <Text style={styles.toggleSub}>Members pay upfront, get it back on completion</Text>
              </View>
              <TouchableOpacity style={[styles.toggle, stakeEnabled && styles.toggleOn]} onPress={() => setStakeEnabled(!stakeEnabled)} activeOpacity={0.8}>
                <View style={[styles.toggleThumb, stakeEnabled && styles.toggleThumbOn]} />
              </TouchableOpacity>
            </View>
            {stakeEnabled && (
              <>
                <Text style={styles.sectionLabel}>Quick select</Text>
                <View style={styles.chipGrid}>
                  {QUICK_STAKES.map(s => <CategoryChip key={s} label={`₦${s.toLocaleString()}`} selected={stakeAmount === s} onPress={() => setStakeAmount(s)} />)}
                </View>
                <TextInput style={styles.slotInput} value={String(stakeAmount)} onChangeText={v => setStakeAmount(Number(v.replace(/[^0-9]/g, '')) || 0)} keyboardType="number-pad" placeholder="Custom amount" placeholderTextColor={colors.textMuted} />
                <View style={styles.explainCard}>
                  <Text style={styles.explainText}>
                    Everyone who joins pays ₦{stakeAmount.toLocaleString()}. Complete the journey and everyone gets it back. Miss 3 days in a row and your deposit is forfeited to Vouch.
                  </Text>
                </View>
              </>
            )}
            {!stakeEnabled && (
              <View style={styles.freeCard}>
                <Text style={styles.freeCardText}>Commitment only — no deposit required</Text>
              </View>
            )}
          </View>
        )}

        {step === 5 && (
          <View style={styles.stepContainer}>
            <Text style={styles.prompt}>Ready to publish?</Text>
            <View style={styles.reviewCard}>
              {[
                { label: 'Title', value: title || '—' },
                { label: 'Category', value: category || '—' },
                { label: 'Duration', value: `${duration} days` },
                { label: 'Max members', value: String(maxParticipants) },
                { label: 'Deposit', value: stakeEnabled ? `₦${stakeAmount.toLocaleString()}` : 'Free' },
                { label: 'Milestones', value: `${weeksCount} week${weeksCount !== 1 ? 's' : ''}` },
              ].map(row => (
                <View key={row.label} style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>{row.label}</Text>
                  <Text style={styles.reviewValue}>{row.value}</Text>
                </View>
              ))}
            </View>
            {description.trim() ? <View style={styles.reviewDesc}><Text style={styles.reviewDescText}>{description}</Text></View> : null}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step > 1 && <TouchableOpacity onPress={back} style={styles.backLink}><Text style={styles.backLinkText}>Back</Text></TouchableOpacity>}
        <Button label={step === TOTAL_STEPS ? 'Publish Journey' : 'Continue'} onPress={next} disabled={!canContinue} style={{ flex: 1 }} />
      </View>
    </SafeAreaView>
  )
}

function makeStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    progressRow: { flexDirection: 'row', gap: 6, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
    dot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.surfaceAlt },
    dotActive: { backgroundColor: colors.accent },
    dotDone: { backgroundColor: colors.accent + '60' },
    content: { padding: spacing.lg, flexGrow: 1 },
    stepContainer: { gap: spacing.md },
    prompt: { fontFamily: fonts.display, fontSize: 28, color: colors.textPrimary, lineHeight: 34, marginBottom: spacing.xs },
    stepNote: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary, marginTop: -spacing.xs },
    bigInput: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border, borderRadius: 12, height: 56, paddingHorizontal: 16, fontSize: 18, fontFamily: fonts.body, color: colors.textPrimary },
    textarea: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, fontSize: 15, fontFamily: fonts.body, color: colors.textPrimary, minHeight: 100 },
    sectionLabel: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textSecondary },
    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    milestoneSlot: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 10 },
    weekLabel: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.accent },
    slotInput: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border, borderRadius: 8, height: 44, paddingHorizontal: 12, fontSize: 14, fontFamily: fonts.body, color: colors.textPrimary },
    toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 16 },
    toggleLabel: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.textPrimary },
    toggleSub: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginTop: 2 },
    toggle: { width: 44, height: 24, borderRadius: 12, backgroundColor: colors.surfaceAlt, justifyContent: 'center', paddingHorizontal: 3, borderWidth: 1, borderColor: colors.border },
    toggleOn: { backgroundColor: colors.accent, borderColor: colors.accent },
    toggleThumb: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.textMuted, alignSelf: 'flex-start' },
    toggleThumbOn: { backgroundColor: colors.bg, alignSelf: 'flex-end' },
    explainCard: { backgroundColor: 'rgba(232,168,56,0.06)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(232,168,56,0.2)', padding: 14 },
    explainText: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
    freeCard: { backgroundColor: colors.surfaceAlt, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 16, alignItems: 'center' },
    freeCardText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textMuted },
    reviewCard: { backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
    reviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
    reviewLabel: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted },
    reviewValue: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textPrimary },
    reviewDesc: { backgroundColor: colors.surfaceAlt, borderRadius: 10, borderWidth: 1, borderColor: colors.border, padding: 14 },
    reviewDescText: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
    footer: { flexDirection: 'row', gap: 12, padding: spacing.lg, paddingTop: spacing.sm, alignItems: 'center' },
    backLink: { paddingHorizontal: 4 },
    backLinkText: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.textSecondary },
  })
}
