import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, StyleSheet, KeyboardAvoidingView, Platform, Switch, Linking, Alert, BackHandler } from 'react-native'
import { useRouter } from 'expo-router'
import { useNavigation } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import * as WebBrowser from 'expo-web-browser'
import { Ionicons } from '@expo/vector-icons'
import { fonts } from '../../constants/fonts'
import { spacing } from '../../constants/spacing'
import { useTheme } from '../../context/ThemeContext'
import { useUser } from '../../context/UserContext'
import { CATEGORIES } from '../../data/dummy'
import { apiCreateJourney, apiUploadCoverImage, apiSaveFormDraft, apiDeleteFormDraft, apiShelveJourneyDraft, apiGetJourney } from '../../utils/api'
import { logger } from '../../utils/logger'
import { cacheJourney } from '../../utils/journeyCache'
import Button from '../../components/shared/Button'
import CategoryChip from '../../components/shared/CategoryChip'
import PlansModal, { getPlanLimit, getPlanMaxParticipants } from '../../components/shared/PlansModal'

const TOTAL_STEPS = 5
const QUICK_DURATIONS = [7, 14, 21, 30, 60, 90]
const QUICK_STAKES = [500, 1000, 2000, 5000]

const CATEGORY_COLORS = {
  Learning: '#5B9CF6', Fitness: '#3ECFAA', Habit: '#E8A838',
  Career: '#9B72CF', Faith: '#F0A500', Finance: '#E85D4A',
}

export default function CreateJourney() {
  const router = useRouter()
  const navigation = useNavigation()
  const { colors } = useTheme()
  const { user } = useUser()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const [step, setStep] = useState(1)
  const [plansVisible, setPlansVisible] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState('')
  const [draftId, setDraftId] = useState(null)
  const draftIdRef = useRef(null)
  const publishedRef = useRef(false)

  const atLimit = (user?.active_journey_count ?? 0) >= getPlanLimit(user?.plan ?? 'free')

  // Safety-net: if they somehow arrived here while at limit, show plans modal
  useEffect(() => {
    if (atLimit) setPlansVisible(true)
  }, [])

  // Keep a ref in sync so the unmount cleanup can read the latest draft id
  useEffect(() => { draftIdRef.current = draftId }, [draftId])

  const saveDraft = useCallback(async (currentStep, formSnapshot) => {
    try {
      const res = await apiSaveFormDraft({ draft_id: draftIdRef.current, step: currentStep, form_data: formSnapshot })
      const id = res?.data?.draft?.id
      if (id && !draftIdRef.current) {
        draftIdRef.current = id
        setDraftId(id)
      }
    } catch (_) {} // silent — draft save should never block the user
  }, [])

  const handleSaveDraft = useCallback(async () => {
    await saveDraft(step, getFormSnapshot())
    Alert.alert('Draft saved', 'You can resume this journey from your Drafts tab.')
  }, [step])

  // Intercept back navigation — prompt to save draft
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (publishedRef.current) return // journey published — allow leave
      e.preventDefault()
      Alert.alert(
        'Save your progress?',
        'You can continue building this journey later from your Drafts.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: async () => {
              if (draftIdRef.current) {
                try { await apiDeleteFormDraft(draftIdRef.current) } catch (_) {}
              }
              navigation.dispatch(e.data.action)
            } },
          {
            text: 'Save draft', onPress: async () => {
              await saveDraft(step, getFormSnapshot())
              navigation.dispatch(e.data.action)
            }
          },
        ]
      )
    })
    return unsubscribe
  }, [navigation, step])

  // Android hardware back button
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (publishedRef.current) return false
      // Trigger beforeRemove by going back one step in stack
      // The navigation listener above will handle the prompt
      navigation.goBack()
      return true
    })
    return () => sub.remove()
  }, [])

  // Step 1
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [customCategoryText, setCustomCategoryText] = useState('')
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false)
  const [description, setDescription] = useState('')
  const [coverUri, setCoverUri] = useState(null)

  // Step 2
  const userPlan = user?.plan ?? 'free'
  const planMax = getPlanMaxParticipants(userPlan)
  // Quick-pick options capped at the user's plan max
  const QUICK_PARTICIPANTS = [10, 20, 50, 100].filter(n => n <= planMax)
  if (QUICK_PARTICIPANTS[QUICK_PARTICIPANTS.length - 1] !== planMax && planMax < 100) {
    QUICK_PARTICIPANTS.push(planMax)
  }

  const [duration, setDuration] = useState(30)
  const [customDuration, setCustomDuration] = useState('')
  const [showCustomDuration, setShowCustomDuration] = useState(false)
  const [maxParticipants, setMaxParticipants] = useState(10)
  const [customParticipants, setCustomParticipants] = useState('')
  const [showCustomParticipants, setShowCustomParticipants] = useState(false)
  const [isPrivate, setIsPrivate] = useState(false)

  // Step 3
  const [milestones, setMilestones] = useState([])

  // Step 4
  const [stakeEnabled, setStakeEnabled] = useState(false)
  const [stakeAmount, setStakeAmount] = useState(1000)

  const activeDuration = showCustomDuration ? (parseInt(customDuration) || 0) : duration
  const activeParticipants = userPlan === 'free' ? 20 : (showCustomParticipants ? (parseInt(customParticipants) || 0) : maxParticipants)
  const isDayBased = activeDuration < 7
  const milestoneCount = isDayBased ? activeDuration : Math.ceil(activeDuration / 7)
  const milestoneUnit = isDayBased ? 'Day' : 'Week'

  const effectiveCategory = category === 'Custom' ? customCategoryText.trim() : category

  const getMilestones = () =>
    Array.from({ length: milestoneCount }, (_, i) => ({
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

  const getFormSnapshot = () => ({
    title, category, customCategoryText, description, coverUri: null, // don't save local URIs
    duration, customDuration, showCustomDuration,
    maxParticipants, customParticipants, showCustomParticipants,
    isPrivate, milestones, stakeEnabled, stakeAmount,
  })

  const next = () => {
    if (step < TOTAL_STEPS) {
      const nextStep = step + 1
      setStep(nextStep)
      saveDraft(nextStep, getFormSnapshot())
    } else publish()
  }
  const back = () => setStep(s => s - 1)

  const publish = async () => {
    setPublishing(true)
    setPublishError('')
    try {
      const milestoneData = getMilestones()
        .filter(m => m.title.trim())
        .map(m => ({ title: m.title.trim(), description: m.description?.trim() || null }))

      // Upload cover image to Supabase Storage so all users can see it
      let uploadedCoverUrl = null
      if (coverUri) {
        try {
          uploadedCoverUrl = await apiUploadCoverImage(coverUri)
          logger.info('[CREATE]', 'Cover image uploaded', { url: uploadedCoverUrl })
        } catch (uploadErr) {
          logger.warn('[CREATE]', `Cover upload failed, continuing without image: ${uploadErr.message}`)
        }
      }

      logger.action('[CREATE]', 'Publishing journey', { title, category: effectiveCategory })
      const res = await apiCreateJourney({
        title: title.trim(),
        description: description.trim() || null,
        category: effectiveCategory,
        cover_image_url: uploadedCoverUrl || null,
        duration_days: activeDuration,
        max_participants: activeParticipants,
        stake_amount: stakeEnabled ? stakeAmount : 0,
        is_private: isPrivate,
        milestones: milestoneData,
      })
      logger.info('[CREATE]', 'Journey created', { id: res.journey?.id, payment_url: !!res.payment_url })
      if (res.journey) cacheJourney(res.journey)
      publishedRef.current = true

      // Delete the form draft now that the journey exists
      if (draftIdRef.current) {
        apiDeleteFormDraft(draftIdRef.current).catch(() => {})
        draftIdRef.current = null
        setDraftId(null)
      }

      if (res.payment_url) {
        logger.action('[CREATE]', 'Opening payment page', { journey_id: res.journey.id })
        const sub = Linking.addEventListener('url', ({ url: incoming }) => {
          if (incoming.startsWith('vouch://')) {
            sub.remove()
            WebBrowser.dismissBrowser()
          }
        })
        await WebBrowser.openBrowserAsync(res.payment_url)
        sub.remove()

        // Check whether the webhook has confirmed payment
        try {
          const statusRes = await apiGetJourney(res.journey.id)
          const journeyStatus = statusRes?.data?.journey?.status
          if (journeyStatus === 'pending_payment') {
            // Payment didn't go through — shelve as draft
            await apiShelveJourneyDraft(res.journey.id)
            logger.warn('[CREATE]', 'Payment not confirmed, shelved as draft', { id: res.journey.id })
            return router.replace('/drafts')
          }
        } catch (_) {}
      }

      router.replace(`/journey/${res.journey.id}`)
    } catch (err) {
      logger.error('[CREATE]', `Publish failed: ${err.message}`)
      setPublishError(err.message)
    } finally {
      setPublishing(false)
    }
  }

  const canContinue = [
    title.trim().length > 3 && !!effectiveCategory,
    activeDuration >= 3 && activeDuration <= 180 && activeParticipants >= 10 && activeParticipants <= planMax,
    true, // milestone validation happens in next()
    true,
    true,
  ][step - 1]

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <View style={styles.progressRow}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <View key={i} style={[styles.dot, i + 1 === step && styles.dotActive, i + 1 < step && styles.dotDone]} />
        ))}
        <TouchableOpacity onPress={handleSaveDraft} style={styles.draftBtn} activeOpacity={0.7}>
          <Ionicons name="bookmark-outline" size={16} color={colors.accent} />
          <Text style={[styles.draftBtnText, { color: colors.accent }]}>Draft</Text>
        </TouchableOpacity>
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
            {userPlan === 'free' ? (
              <View style={[styles.lockedParticipants, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <Text style={[styles.lockedParticipantsText, { color: colors.textPrimary }]}>20 participants</Text>
                <Text style={[styles.lockedParticipantsHint, { color: colors.textMuted }]}>Fixed on Free plan · upgrade to choose</Text>
              </View>
            ) : (
              <>
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
                      placeholder={`People (2–${planMax})`}
                      placeholderTextColor={colors.textMuted}
                      keyboardType="number-pad"
                      autoFocus
                    />
                    <Text style={[styles.numHint, { color: colors.textMuted }]}>min 2 · max {planMax} ({userPlan} plan)</Text>
                  </View>
                )}
              </>
            )}

            {/* Privacy toggle — Pro/Elite only */}
            {userPlan !== 'free' ? (
              <View style={[styles.privacyRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.privacyLabel, { color: colors.textPrimary }]}>Visible on Discover</Text>
                  <Text style={[styles.privacyHint, { color: colors.textMuted }]}>
                    {isPrivate ? 'Private · invite link only' : 'Public · anyone can join'}
                  </Text>
                </View>
                <Switch
                  value={!isPrivate}
                  onValueChange={val => setIsPrivate(!val)}
                  trackColor={{ false: colors.border, true: colors.accent }}
                  thumbColor={colors.surface}
                />
              </View>
            ) : (
              <View style={[styles.privacyRow, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, opacity: 0.6 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.privacyLabel, { color: colors.textSecondary }]}>Visible on Discover</Text>
                  <Text style={[styles.privacyHint, { color: colors.textMuted }]}>Upgrade to Pro to create private journeys</Text>
                </View>
                <Switch value={true} disabled trackColor={{ true: colors.accent }} thumbColor={colors.surface} />
              </View>
            )}
          </View>
        )}

        {/* STEP 3 — MILESTONES */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.prompt}>Break it into {milestoneUnit.toLowerCase()}s</Text>
            <Text style={styles.stepNote}>Give each {milestoneUnit.toLowerCase()} a name. All optional — skip any you don't need.</Text>
            {getMilestones().map((m, i) => (
              <View key={i} style={[styles.milestoneSlot, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.weekLabel, { color: colors.accent }]}>{milestoneUnit} {m.week}</Text>
                <TextInput
                  style={[styles.slotInput, { color: colors.textPrimary, backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                  value={m.title}
                  onChangeText={v => updateMilestone(i, 'title', v)}
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
            {publishError ? (
              <View style={[styles.errorBanner, { backgroundColor: colors.danger + '15', borderColor: colors.danger + '40' }]}>
                <Ionicons name="alert-circle-outline" size={15} color={colors.danger} />
                <Text style={[styles.errorText, { color: colors.danger }]}>{publishError}</Text>
              </View>
            ) : null}
            {coverUri && <Image source={{ uri: coverUri }} style={styles.reviewCover} />}
            <View style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {[
                { label: 'Title', value: title || '—' },
                { label: 'Category', value: effectiveCategory || '—' },
                { label: 'Duration', value: `${activeDuration} days` },
                { label: 'Max members', value: String(activeParticipants) },
                { label: 'Deposit', value: stakeEnabled ? `₦${stakeAmount.toLocaleString()}` : 'Free' },
                { label: 'Milestones', value: `${milestoneCount} ${milestoneUnit.toLowerCase()}${milestoneCount !== 1 ? 's' : ''}` },
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
        <Button label={step === TOTAL_STEPS ? 'Publish Journey' : 'Continue'} onPress={next} disabled={!canContinue || publishing} loading={publishing} style={{ flex: 1 }} />
      </View>
      </KeyboardAvoidingView>

      {/* Limit gate — shown if user is at journey cap */}
      <PlansModal
        visible={plansVisible}
        onClose={() => {
          setPlansVisible(false)
          router.back()
        }}
      />
    </SafeAreaView>
  )
}

function makeStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    progressRow: { flexDirection: 'row', gap: 6, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm, alignItems: 'center' },
    dot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.surfaceAlt },
    dotActive: { backgroundColor: colors.accent },
    dotDone: { backgroundColor: colors.accent + '60' },
    draftBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: colors.accent + '50', backgroundColor: colors.accent + '10' },
    draftBtnText: { fontFamily: fonts.bodyMedium, fontSize: 12 },
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
    privacyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, borderWidth: 1, padding: 14 },
    privacyLabel: { fontFamily: fonts.bodyMedium, fontSize: 15 },
    privacyHint: { fontFamily: fonts.body, fontSize: 12, marginTop: 2 },
    lockedParticipants: { borderRadius: 12, borderWidth: 1, padding: 14 },
    lockedParticipantsText: { fontFamily: fonts.bodyMedium, fontSize: 15 },
    lockedParticipantsHint: { fontFamily: fonts.body, fontSize: 12, marginTop: 2 },
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
