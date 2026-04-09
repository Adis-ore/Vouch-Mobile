import { useState, useMemo } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import { fonts } from '../../constants/fonts'
import { spacing } from '../../constants/spacing'
import { useTheme } from '../../context/ThemeContext'
import { CATEGORIES } from '../../data/dummy'
import Button from '../../components/shared/Button'
import CategoryChip from '../../components/shared/CategoryChip'

const TOTAL_STEPS = 5
const QUICK_DURATIONS = [7, 14, 21, 30, 60, 90]
const QUICK_PARTICIPANTS = [2, 5, 10, 20]
const QUICK_STAKES = [500, 1000, 2000, 5000]

const CATEGORY_COLORS = {
  Learning: '#5B9CF6', Fitness: '#3ECFAA', Habit: '#E8A838',
  Career: '#9B72CF', Faith: '#F0A500', Finance: '#E85D4A',
}

export default function CreateJourney() {
  const router = useRouter()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const [step, setStep] = useState(1)

  // Step 1
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [customCategoryText, setCustomCategoryText] = useState('')
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false)
  const [description, setDescription] = useState('')
  const [coverUri, setCoverUri] = useState(null)

  // Step 2
  const [duration, setDuration] = useState(30)
  const [customDuration, setCustomDuration] = useState('')
  const [showCustomDuration, setShowCustomDuration] = useState(false)
  const [maxParticipants, setMaxParticipants] = useState(2)
  const [customParticipants, setCustomParticipants] = useState('')
  const [showCustomParticipants, setShowCustomParticipants] = useState(false)

  // Step 3
  const [milestones, setMilestones] = useState([])
  const [milestoneError, setMilestoneError] = useState(false)

  // Step 4
  const [stakeEnabled, setStakeEnabled] = useState(false)
  const [stakeAmount, setStakeAmount] = useState(1000)

  const activeDuration = showCustomDuration ? (parseInt(customDuration) || 0) : duration
  const activeParticipants = showCustomParticipants ? (parseInt(customParticipants) || 0) : maxParticipants
  const weeksCount = Math.ceil(activeDuration / 7)

  const effectiveCategory = category === 'Custom' ? customCategoryText.trim() : category

  const getMilestones = () =>
    Array.from({ length: weeksCount }, (_, i) => ({
      week: i + 1, title: '', description: '', ...(milestones[i] || {}),
    }))

  const updateMilestone = (i, field, val) => {
    setMilestones(prev => {
      const copy = [...prev]
      copy[i] = { ...copy[i], [field]: val }
      return copy
    })
  }

  const pickCoverImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.7,
    })
    if (!result.canceled) setCoverUri(result.assets[0].uri)
  }

  const next = () => {
    if (step === 3) {
      const filled = getMilestones()
      if (!filled.some(m => m.title.trim())) {
        setMilestoneError(true)
        return
      }
      setMilestoneError(false)
    }
    if (step < TOTAL_STEPS) setStep(s => s + 1)
    else publish()
  }
  const back = () => setStep(s => s - 1)
  const publish = () => router.replace('/journey/journey-1')

  const canContinue = [
    title.trim().length > 3 && !!effectiveCategory,
    activeDuration >= 3 && activeDuration <= 180 && activeParticipants >= 2,
    true, // milestone validation happens in next()
    true,
    true,
  ][step - 1]

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.progressRow}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <View key={i} style={[styles.dot, i + 1 === step && styles.dotActive, i + 1 < step && styles.dotDone]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* STEP 1 — BASICS */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.prompt}>The basics</Text>

            {/* Cover image */}
            <TouchableOpacity style={[styles.coverPicker, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]} onPress={pickCoverImage} activeOpacity={0.8}>
              {coverUri ? (
                <Image source={{ uri: coverUri }} style={styles.coverImage} />
              ) : (
                <View style={styles.coverPlaceholder}>
                  <Ionicons name="image-outline" size={28} color={colors.textMuted} />
                  <Text style={[styles.coverHint, { color: colors.textMuted }]}>Add a cover image (optional)</Text>
                </View>
              )}
              {coverUri && (
                <TouchableOpacity style={[styles.removeCover, { backgroundColor: colors.danger }]} onPress={() => setCoverUri(null)} activeOpacity={0.8}>
                  <Ionicons name="close" size={14} color="#fff" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            <TextInput
              style={[styles.bigInput, { color: colors.textPrimary, backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
              value={title}
              onChangeText={setTitle}
              placeholder="Journey title..."
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.sectionLabel}>Category</Text>
            <View style={styles.chipGrid}>
              {CATEGORIES.map(c => (
                <CategoryChip
                  key={c.id}
                  label={c.label}
                  selected={category === c.id}
                  onPress={() => {
                    setCategory(c.id)
                    if (c.id !== 'Custom') setShowCustomCategoryInput(false)
                    else setShowCustomCategoryInput(true)
                  }}
                />
              ))}
            </View>

            {category === 'Custom' && (
              <TextInput
                style={[styles.smallInput, { color: colors.textPrimary, backgroundColor: colors.surfaceAlt, borderColor: colors.accent }]}
                value={customCategoryText}
                onChangeText={t => setCustomCategoryText(t.slice(0, 20))}
                placeholder="Name your category (e.g. Language)"
                placeholderTextColor={colors.textMuted}
                autoFocus
              />
            )}

            <Text style={styles.sectionLabel}>Description</Text>
            <TextInput
              style={[styles.textarea, { color: colors.textPrimary, backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
              value={description}
              onChangeText={setDescription}
              placeholder="What is this journey about? What will members do each day?"
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
            />
          </View>
        )}

        {/* STEP 2 — TIMELINE & SIZE */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.prompt}>Timeline & size</Text>

            <Text style={styles.sectionLabel}>Duration</Text>
            <View style={styles.chipGrid}>
              {QUICK_DURATIONS.map(d => (
                <CategoryChip key={d} label={`${d}d`} selected={!showCustomDuration && duration === d} onPress={() => { setDuration(d); setShowCustomDuration(false) }} />
              ))}
              <CategoryChip label="Custom" selected={showCustomDuration} onPress={() => setShowCustomDuration(v => !v)} />
            </View>
            {showCustomDuration && (
              <View style={styles.customNumWrap}>
                <TextInput
                  style={[styles.numInput, { color: colors.textPrimary, backgroundColor: colors.surfaceAlt, borderColor: colors.accent }]}
                  value={customDuration}
                  onChangeText={setCustomDuration}
                  placeholder="Days (3–180)"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  autoFocus
                />
                <Text style={[styles.numHint, { color: colors.textMuted }]}>min 3 · max 180</Text>
              </View>
            )}

            <Text style={styles.sectionLabel}>Max participants</Text>
            <View style={styles.chipGrid}>
              {QUICK_PARTICIPANTS.map(n => (
                <CategoryChip key={n} label={`${n}`} selected={!showCustomParticipants && maxParticipants === n} onPress={() => { setMaxParticipants(n); setShowCustomParticipants(false) }} />
              ))}
              <CategoryChip label="Custom" selected={showCustomParticipants} onPress={() => setShowCustomParticipants(v => !v)} />
            </View>
            {showCustomParticipants && (
              <View style={styles.customNumWrap}>
                <TextInput
                  style={[styles.numInput, { color: colors.textPrimary, backgroundColor: colors.surfaceAlt, borderColor: colors.accent }]}
                  value={customParticipants}
                  onChangeText={setCustomParticipants}
                  placeholder="People (2–100)"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  autoFocus
                />
                <Text style={[styles.numHint, { color: colors.textMuted }]}>min 2 · max 100</Text>
              </View>
            )}
          </View>
        )}

        {/* STEP 3 — MILESTONES */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.prompt}>Break it into weeks</Text>
            <Text style={styles.stepNote}>Give each week a title. At least one milestone is required.</Text>
            {milestoneError && (
              <View style={[styles.errorBanner, { backgroundColor: colors.danger + '15', borderColor: colors.danger + '40' }]}>
                <Ionicons name="alert-circle-outline" size={15} color={colors.danger} />
                <Text style={[styles.errorText, { color: colors.danger }]}>Add at least one milestone before continuing.</Text>
              </View>
            )}
            {getMilestones().map((m, i) => (
              <View key={i} style={[styles.milestoneSlot, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.weekLabel, { color: colors.accent }]}>Week {m.week}</Text>
                <TextInput
                  style={[styles.slotInput, { color: colors.textPrimary, backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                  value={m.title}
                  onChangeText={v => { updateMilestone(i, 'title', v); setMilestoneError(false) }}
                  placeholder="Milestone title (required)"
                  placeholderTextColor={colors.textMuted}
                />
                <TextInput
                  style={[styles.slotInput, { height: 60, color: colors.textPrimary, backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                  value={m.description}
                  onChangeText={v => updateMilestone(i, 'description', v)}
                  placeholder="What should members accomplish? (optional)"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            ))}
          </View>
        )}

        {/* STEP 4 — DEPOSIT */}
        {step === 4 && (
          <View style={styles.stepContainer}>
            <Text style={styles.prompt}>Security deposit</Text>
            <View style={[styles.toggleRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View>
                <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>Add a deposit?</Text>
                <Text style={[styles.toggleSub, { color: colors.textMuted }]}>Members pay upfront, get it back on completion</Text>
              </View>
              <TouchableOpacity style={[styles.toggle, stakeEnabled && { backgroundColor: colors.accent, borderColor: colors.accent }]} onPress={() => setStakeEnabled(!stakeEnabled)} activeOpacity={0.8}>
                <View style={[styles.toggleThumb, stakeEnabled && { backgroundColor: colors.bg, alignSelf: 'flex-end' }]} />
              </TouchableOpacity>
            </View>
            {stakeEnabled && (
              <>
                <Text style={styles.sectionLabel}>Quick select</Text>
                <View style={styles.chipGrid}>
                  {QUICK_STAKES.map(s => (
                    <CategoryChip key={s} label={`₦${s.toLocaleString()}`} selected={stakeAmount === s} onPress={() => setStakeAmount(s)} />
                  ))}
                </View>
                <TextInput
                  style={[styles.slotInput, { color: colors.textPrimary, backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                  value={String(stakeAmount)}
                  onChangeText={v => setStakeAmount(Number(v.replace(/[^0-9]/g, '')) || 0)}
                  keyboardType="number-pad"
                  placeholder="Custom amount"
                  placeholderTextColor={colors.textMuted}
                />
                <View style={[styles.explainCard, { backgroundColor: 'rgba(232,168,56,0.06)', borderColor: 'rgba(232,168,56,0.2)' }]}>
                  <Text style={[styles.explainText, { color: colors.textSecondary }]}>
                    10% platform fee at join. Complete 100% → full refund. 75–89% → 75% back. 90–99% → 95% back. Below 75% → no refund.
                  </Text>
                </View>
              </>
            )}
            {!stakeEnabled && (
              <View style={[styles.freeCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <Text style={[styles.freeCardText, { color: colors.textMuted }]}>Commitment only — no deposit required</Text>
              </View>
            )}
          </View>
        )}

        {/* STEP 5 — REVIEW */}
        {step === 5 && (
          <View style={styles.stepContainer}>
            <Text style={styles.prompt}>Ready to publish?</Text>
            {coverUri && <Image source={{ uri: coverUri }} style={styles.reviewCover} />}
            <View style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {[
                { label: 'Title', value: title || '—' },
                { label: 'Category', value: effectiveCategory || '—' },
                { label: 'Duration', value: `${activeDuration} days` },
                { label: 'Max members', value: String(activeParticipants) },
                { label: 'Deposit', value: stakeEnabled ? `₦${stakeAmount.toLocaleString()}` : 'Free' },
                { label: 'Milestones', value: `${weeksCount} week${weeksCount !== 1 ? 's' : ''}` },
              ].map(row => (
                <View key={row.label} style={[styles.reviewRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.reviewLabel, { color: colors.textMuted }]}>{row.label}</Text>
                  <Text style={[styles.reviewValue, { color: colors.textPrimary }]}>{row.value}</Text>
                </View>
              ))}
            </View>
            {description.trim() ? (
              <View style={[styles.reviewDesc, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <Text style={[styles.reviewDescText, { color: colors.textSecondary }]}>{description}</Text>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step > 1 && (
          <TouchableOpacity onPress={back} style={styles.backLink}>
            <Text style={[styles.backLinkText, { color: colors.textSecondary }]}>Back</Text>
          </TouchableOpacity>
        )}
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
    // Cover image
    coverPicker: { height: 140, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', overflow: 'hidden', position: 'relative' },
    coverImage: { width: '100%', height: '100%' },
    coverPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
    coverHint: { fontFamily: fonts.body, fontSize: 13 },
    removeCover: { position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    bigInput: { borderWidth: 1, borderRadius: 12, height: 56, paddingHorizontal: 16, fontSize: 18, fontFamily: fonts.body },
    smallInput: { borderWidth: 1, borderRadius: 10, height: 46, paddingHorizontal: 14, fontSize: 14, fontFamily: fonts.body },
    textarea: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15, fontFamily: fonts.body, minHeight: 100 },
    sectionLabel: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textSecondary },
    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    customNumWrap: { gap: 4 },
    numInput: { borderWidth: 1, borderRadius: 10, height: 46, paddingHorizontal: 14, fontSize: 15, fontFamily: fonts.body },
    numHint: { fontFamily: fonts.body, fontSize: 11, paddingHorizontal: 4 },
    // Milestones
    errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 8, padding: 10 },
    errorText: { fontFamily: fonts.bodyMedium, fontSize: 13, flex: 1 },
    milestoneSlot: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
    weekLabel: { fontFamily: fonts.bodyBold, fontSize: 14 },
    slotInput: { borderWidth: 1, borderRadius: 8, height: 44, paddingHorizontal: 12, fontSize: 14, fontFamily: fonts.body },
    // Deposit
    toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12, borderWidth: 1, padding: 16 },
    toggleLabel: { fontFamily: fonts.bodyMedium, fontSize: 15 },
    toggleSub: { fontFamily: fonts.body, fontSize: 12, marginTop: 2 },
    toggle: { width: 44, height: 24, borderRadius: 12, backgroundColor: colors.surfaceAlt, justifyContent: 'center', paddingHorizontal: 3, borderWidth: 1, borderColor: colors.border },
    toggleThumb: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.textMuted, alignSelf: 'flex-start' },
    explainCard: { borderRadius: 10, borderWidth: 1, padding: 14 },
    explainText: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19 },
    freeCard: { borderRadius: 10, borderWidth: 1, padding: 16, alignItems: 'center' },
    freeCardText: { fontFamily: fonts.bodyMedium, fontSize: 14 },
    // Review
    reviewCover: { width: '100%', height: 140, borderRadius: 12 },
    reviewCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
    reviewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1 },
    reviewLabel: { fontFamily: fonts.body, fontSize: 14 },
    reviewValue: { fontFamily: fonts.bodyMedium, fontSize: 14 },
    reviewDesc: { borderRadius: 10, borderWidth: 1, padding: 14 },
    reviewDescText: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
    footer: { flexDirection: 'row', gap: 12, padding: spacing.lg, paddingTop: spacing.sm, alignItems: 'center' },
    backLink: { paddingHorizontal: 4 },
    backLinkText: { fontFamily: fonts.bodyMedium, fontSize: 15 },
  })
}
