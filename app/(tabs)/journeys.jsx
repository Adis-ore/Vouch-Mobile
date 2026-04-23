import { useState, useMemo, useCallback, useRef } from 'react'
import { View, Text, TouchableOpacity, ScrollView, FlatList, ActivityIndicator, StyleSheet, Dimensions, Linking, Animated, PanResponder } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as WebBrowser from 'expo-web-browser'
import { Ionicons } from '@expo/vector-icons'
import { fonts } from '../../constants/fonts'
import { spacing } from '../../constants/spacing'
import { useTheme } from '../../context/ThemeContext'
import { useUser } from '../../context/UserContext'
import { apiGetMyJourneys, apiGetDrafts, apiDeleteFormDraft, apiRetryPayment, apiPublishDraft, apiDeleteDraft } from '../../utils/api'
import JourneyPassModal from '../../components/shared/JourneyPassModal'
import { wasRecentlyCheckedIn } from '../../utils/checkinSignal'
import { wasAbandoned, clearAbandoned } from '../../utils/abandonSignal'
import { wasCompleted, clearCompleted } from '../../utils/completionSignal'
import { logger } from '../../utils/logger'
import ProgressBar from '../../components/journey/ProgressBar'
import EmptyState from '../../components/shared/EmptyState'
import PlansModal, { getPlanLimit } from '../../components/shared/PlansModal'
import Avatar from '../../components/shared/Avatar'

const TABS = ['Active', 'Past', 'Drafts']
const { width: SCREEN_WIDTH } = Dimensions.get('window')

const SWIPE_THRESHOLD = 80

function SwipeableDraftCard({ draft, onDelete, onPublish, publishing, colors, styles }) {
  const translateX = useRef(new Animated.Value(0)).current

  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
    onPanResponderMove: (_, g) => { if (g.dx > 0) translateX.setValue(g.dx) },
    onPanResponderRelease: (_, g) => {
      if (g.dx > SWIPE_THRESHOLD) {
        Animated.timing(translateX, { toValue: 600, duration: 200, useNativeDriver: true })
          .start(() => onDelete(draft.id))
      } else {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start()
      }
    },
  })).current

  const trashOpacity = translateX.interpolate({ inputRange: [0, SWIPE_THRESHOLD], outputRange: [0, 1], extrapolate: 'clamp' })

  return (
    <View style={{ position: 'relative' }}>
      <Animated.View style={[styles.swipeBgDelete, { opacity: trashOpacity }]}>
        <Ionicons name="trash-outline" size={20} color="#fff" />
        <Text style={styles.swipeBgText}>Delete</Text>
      </Animated.View>
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        <View style={[styles.draftCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.draftCardTop}>
            <Text style={[styles.draftCardTitle, { color: colors.textPrimary }]}>{draft.title || 'Untitled'}</Text>
            {draft.stake_amount > 0 && <Text style={[styles.draftMeta, { color: colors.textMuted }]}>₦{Number(draft.stake_amount).toLocaleString()}</Text>}
          </View>
          {draft.category && (
            <Text style={[styles.draftMeta, { color: colors.textMuted }]}>
              {draft.category}{draft.duration_days ? ` · ${draft.duration_days}d` : ''}
            </Text>
          )}
          <View style={styles.draftActions}>
            <TouchableOpacity
              style={[styles.draftBtn, { borderColor: colors.accent, flex: 1 }]}
              onPress={() => onPublish(draft)}
              disabled={publishing === draft.id}
              activeOpacity={0.85}
            >
              {publishing === draft.id
                ? <ActivityIndicator size="small" color={colors.accent} />
                : <Text style={[styles.draftBtnText, { color: colors.accent }]}>Publish →</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  )
}

export default function MyJourneys() {
  const router = useRouter()
  const { colors } = useTheme()
  const { user, updateUser } = useUser()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const pagerRef = useRef(null)

  const [activeTab, setActiveTab] = useState(0)
  const [plansVisible, setPlansVisible] = useState(false)
  const [activeJourneys, setActiveJourneys] = useState([])
  const [pastJourneys, setPastJourneys] = useState([])
  const [formDrafts, setFormDrafts] = useState([])
  const [journeyDrafts, setJourneyDrafts] = useState([])
  const [savedDrafts, setSavedDrafts] = useState([])
  const [loading, setLoading] = useState(true)
  const [retrying, setRetrying] = useState(null)
  const [publishing, setPublishing] = useState(null)
  const [journeyPassDraft, setJourneyPassDraft] = useState(null)

  const activeCount = activeJourneys.length
  const limit = getPlanLimit(user?.plan ?? 'free')
  const atLimit = activeCount >= limit

  const load = useCallback(async () => {
    try {
      const [journeysRes, draftsRes] = await Promise.all([
        apiGetMyJourneys(),
        apiGetDrafts().catch(() => ({ data: { formDrafts: [], journeyDrafts: [] } })),
      ])
      const active = (journeysRes.data.active || []).filter(j => !wasAbandoned(j.id) && !wasCompleted(j.id))
      const past = journeysRes.data.past || []
      for (const j of past) { clearAbandoned(j.id); clearCompleted(j.id) }
      setActiveJourneys(active)
      setPastJourneys(past)
      const fd = draftsRes.data.formDrafts || []
      setFormDrafts(fd.filter(d => !d.is_ready))
      setSavedDrafts(fd.filter(d => d.is_ready))
      setJourneyDrafts(draftsRes.data.journeyDrafts || [])
      updateUser({ active_journey_count: (journeysRes.data.active || []).length })
    } catch (err) { logger.error('[JOURNEYS]', 'Failed to load', err.message) }
    finally { setLoading(false) }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const goToTab = (index) => {
    setActiveTab(index)
    pagerRef.current?.scrollToIndex({ index, animated: true })
  }

  const onScrollEnd = (e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
    setActiveTab(index)
  }

  const handleCreate = () => {
    if (atLimit) setPlansVisible(true)
    else router.push('/journey/create')
  }

  const retryPayment = async (journeyId) => {
    setRetrying(journeyId)
    try {
      const res = await apiRetryPayment(journeyId)
      if (!res.payment_url) { await load(); return }
      const sub = Linking.addEventListener('url', ({ url: incoming }) => {
        if (incoming.startsWith('vouch://')) { sub.remove(); WebBrowser.dismissBrowser() }
      })
      await WebBrowser.openBrowserAsync(res.payment_url)
      sub.remove()
      await load()
    } catch (err) {
      logger.error('[JOURNEYS]', 'Retry payment failed', err.message)
    } finally { setRetrying(null) }
  }

  const deleteFormDraft = async (id) => {
    try {
      await apiDeleteFormDraft(id)
      setFormDrafts(prev => prev.filter(d => d.id !== id))
    } catch (_) {}
  }

  const handlePublishDraft = async (draft) => {
    setPublishing(draft.id)
    try {
      const res = await apiPublishDraft(draft.id)
      setSavedDrafts(prev => prev.filter(d => d.id !== draft.id))
      if (res.payment_url) {
        const sub = Linking.addEventListener('url', ({ url }) => {
          if (url.startsWith('vouch://')) { sub.remove(); WebBrowser.dismissBrowser() }
        })
        await WebBrowser.openBrowserAsync(res.payment_url)
        sub.remove()
      }
      await load()
    } catch (err) {
      if (err.code === 'JOURNEY_LIMIT_REACHED') {
        setJourneyPassDraft(draft)
      } else {
        logger.error('[DRAFTS]', 'Publish failed', err.message)
      }
    } finally { setPublishing(null) }
  }

  const handleDeleteSavedDraft = async (id) => {
    try {
      await apiDeleteDraft(id)
      setSavedDrafts(prev => prev.filter(d => d.id !== id))
    } catch (_) {}
  }

  const OUTCOME_COLORS = {
    completed: colors.success,
    abandoned: colors.danger,
    auto_removed: colors.danger,
    left: colors.textMuted,
  }
  const OUTCOME_LABELS = {
    completed: 'Completed',
    abandoned: 'Abandoned',
    auto_removed: 'Removed',
    left: 'Left',
  }

  const renderPage = ({ item: tabIndex }) => {
    if (tabIndex === 0) return (
      <ScrollView style={{ width: SCREEN_WIDTH }} contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
        {activeJourneys.length > 0 ? activeJourneys.map(j => (
          <TouchableOpacity key={j.id} style={[styles.activeCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => router.push(`/journey/${j.id}`)} activeOpacity={0.88}>
            <View style={styles.activeTop}>
              <View style={styles.catBadge}><Text style={styles.catText}>{j.category}</Text></View>
              <Text style={[styles.daysLeft, { color: colors.textMuted }]}>
                {j.status === 'open' ? 'Waiting to start' : `${j.duration_days - j.days_elapsed} days left`}
              </Text>
            </View>
            <Text style={[styles.activeTitle, { color: colors.textPrimary }]}>{j.title}</Text>
            {j.status === 'active' && (
              <>
                <ProgressBar percent={j.progress_percent} daysElapsed={j.days_elapsed} durationDays={j.duration_days} />
                {(j.checked_in_today || wasRecentlyCheckedIn(j.id)) ? (
                  <View style={[styles.checkinBtn, { backgroundColor: colors.success + '18', borderColor: colors.success + '40', borderWidth: 1 }]}>
                    <Text style={[styles.checkinBtnText, { color: colors.success }]}>Done for today</Text>
                  </View>
                ) : (
                  <TouchableOpacity style={[styles.checkinBtn, { backgroundColor: colors.accent }]} onPress={() => router.push(`/checkin/${j.id}`)} activeOpacity={0.85}>
                    <Text style={[styles.checkinBtnText, { color: colors.bg }]}>Check in →</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
            {j.status === 'open' && j.my_role === 'creator' && (
              <TouchableOpacity style={[styles.checkinBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.accent }]} onPress={() => router.push(`/journey/${j.id}`)} activeOpacity={0.85}>
                <Text style={[styles.checkinBtnText, { color: colors.accent }]}>Manage journey →</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        )) : (
          <EmptyState title="No active journey" body="You're not in any journey right now." ctaLabel="Create one" onCta={handleCreate} secondaryLabel="Find one to join" onSecondary={() => router.push('/(tabs)/discover')} />
        )}
      </ScrollView>
    )

    if (tabIndex === 1) return (
      <ScrollView style={{ width: SCREEN_WIDTH }} contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
        {pastJourneys.length > 0 ? pastJourneys.map(j => {
          const outcomeColor = OUTCOME_COLORS[j.status] || colors.textMuted
          const outcomeLabel = OUTCOME_LABELS[j.status] || j.status
          const checkinPct = j.duration_days > 0 ? Math.min(100, Math.round((j.total_checkins / j.duration_days) * 100)) : 0
          const endedDate = j.ended_at ? new Date(j.ended_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null
          return (
            <View key={j.history_id || j.id} style={[styles.pastCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.pastTop}>
                <Text style={[styles.pastTitle, { color: colors.textPrimary }]}>{j.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: outcomeColor + '18' }]}>
                  <Text style={[styles.statusText, { color: outcomeColor }]}>{outcomeLabel}</Text>
                </View>
              </View>
              <Text style={[styles.pastMeta, { color: colors.textMuted }]}>
                {j.category} · {j.duration_days} days
                {j.my_role === 'creator' ? ' · Creator' : ''}
              </Text>
              <View style={[styles.pastStats, { borderTopColor: colors.border }]}>
                <View style={styles.pastStat}>
                  <Ionicons name="checkmark-circle-outline" size={13} color={colors.textMuted} />
                  <Text style={[styles.pastStatText, { color: colors.textMuted }]}>{j.total_checkins ?? 0} check-ins ({checkinPct}%)</Text>
                </View>
                {j.stake_amount > 0 && (
                  <View style={styles.pastStat}>
                    <Ionicons
                      name={j.stake_outcome === 'returned' ? 'wallet-outline' : 'warning-outline'}
                      size={13}
                      color={j.stake_outcome === 'returned' ? colors.success : colors.danger}
                    />
                    <Text style={[styles.pastStatText, { color: j.stake_outcome === 'returned' ? colors.success : colors.danger }]}>
                      ₦{Number(j.stake_amount).toLocaleString()} {j.stake_outcome === 'returned' ? 'refunded' : 'forfeited'}
                    </Text>
                  </View>
                )}
                {endedDate && (
                  <View style={styles.pastStat}>
                    <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
                    <Text style={[styles.pastStatText, { color: colors.textMuted }]}>{endedDate}</Text>
                  </View>
                )}
              </View>
            </View>
          )
        }) : (
          <EmptyState title="No past journeys" body="Completed, abandoned, and left journeys will appear here." />
        )}
      </ScrollView>
    )

    if (tabIndex === 2) return (
      <ScrollView style={{ width: SCREEN_WIDTH }} contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
        {journeyDrafts.length === 0 && formDrafts.length === 0 && savedDrafts.length === 0 && (
          <EmptyState title="No drafts" body="Incomplete journeys and failed payments will appear here." />
        )}

        {/* Saved / publishable drafts */}
        {savedDrafts.length > 0 && (
          <>
            <Text style={[styles.draftSectionLabel, { color: colors.textMuted }]}>SAVED DRAFTS</Text>
            {savedDrafts.map(d => (
              <SwipeableDraftCard
                key={d.id}
                draft={d}
                onDelete={handleDeleteSavedDraft}
                onPublish={handlePublishDraft}
                publishing={publishing}
                colors={colors}
                styles={styles}
              />
            ))}
          </>
        )}
        {journeyDrafts.length > 0 && (
          <>
            <Text style={[styles.draftSectionLabel, { color: colors.textMuted }]}>AWAITING PAYMENT</Text>
            {journeyDrafts.map(j => (
              <View key={j.id} style={[styles.draftCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.draftCardTop}>
                  <Text style={[styles.draftCardTitle, { color: colors.textPrimary }]}>{j.title || 'Untitled'}</Text>
                  {j.stake_amount > 0 && <Text style={[styles.draftMeta, { color: colors.textMuted }]}>₦{Number(j.stake_amount).toLocaleString()}</Text>}
                </View>
                {j.category && <Text style={[styles.draftMeta, { color: colors.textMuted }]}>{j.category} · {j.duration_days}d</Text>}
                <View style={styles.draftActions}>
                  <TouchableOpacity
                    style={[styles.draftBtn, { borderColor: colors.accent, flex: 1 }]}
                    onPress={() => retryPayment(j.id)}
                    disabled={retrying === j.id}
                    activeOpacity={0.85}
                  >
                    {retrying === j.id
                      ? <ActivityIndicator size="small" color={colors.accent} />
                      : <Text style={[styles.draftBtnText, { color: colors.accent }]}>
                          {j.stake_amount > 0 ? 'Complete deposit →' : 'Publish →'}
                        </Text>
                    }
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.draftIconBtn, { borderColor: colors.border }]} onPress={() => router.push(`/journey/${j.id}`)} activeOpacity={0.85}>
                    <Ionicons name="eye-outline" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}
        {formDrafts.length > 0 && (
          <>
            <Text style={[styles.draftSectionLabel, { color: colors.textMuted, marginTop: journeyDrafts.length > 0 ? spacing.md : 0 }]}>INCOMPLETE CREATIONS</Text>
            {formDrafts.map(d => {
              const data = d.form_data || {}
              return (
                <View key={d.id} style={[styles.draftCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.draftCardTop}>
                    <Text style={[styles.draftCardTitle, { color: colors.textPrimary }]}>{data.title?.trim() || 'Untitled draft'}</Text>
                    <Text style={[styles.draftMeta, { color: colors.textMuted }]}>Step {d.step}/5</Text>
                  </View>
                  {data.category && <Text style={[styles.draftMeta, { color: colors.textMuted }]}>{data.category}</Text>}
                  <View style={styles.draftActions}>
                    <TouchableOpacity
                      style={[styles.draftBtn, { borderColor: colors.accent, flex: 1 }]}
                      onPress={() => router.push({ pathname: '/journey/create', params: { draft_id: d.id, draft_data: JSON.stringify(d.form_data), draft_step: d.step } })}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.draftBtnText, { color: colors.accent }]}>Continue →</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.draftIconBtn, { borderColor: colors.border }]} onPress={() => deleteFormDraft(d.id)} activeOpacity={0.85}>
                      <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>
              )
            })}
          </>
        )}
      </ScrollView>
    )

    return null
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>My Journeys</Text>
        <TouchableOpacity style={[styles.fab, { backgroundColor: colors.accent }]} onPress={handleCreate} activeOpacity={0.85}>
          <Text style={[styles.fabIcon, { color: colors.bg }]}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Tab strip */}
      <View style={[styles.tabStrip, { borderBottomColor: colors.border }]}>
        {TABS.map((tab, i) => (
          <TouchableOpacity key={tab} style={[styles.tabBtn, activeTab === i && styles.tabBtnActive]} onPress={() => goToTab(i)} activeOpacity={0.75}>
            <Text style={[styles.tabText, { color: activeTab === i ? colors.accent : colors.textMuted }, activeTab === i && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          ref={pagerRef}
          data={[0, 1, 2]}
          keyExtractor={i => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onMomentumScrollEnd={onScrollEnd}
          renderItem={renderPage}
          style={{ flex: 1 }}
          getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
        />
      )}

      <PlansModal visible={plansVisible} onClose={() => setPlansVisible(false)} />
      <JourneyPassModal
        visible={!!journeyPassDraft}
        draftId={journeyPassDraft?.id}
        draftTitle={journeyPassDraft?.title}
        onClose={() => setJourneyPassDraft(null)}
        onSuccess={async () => { setJourneyPassDraft(null); await load() }}
        onUpgrade={() => setPlansVisible(true)}
      />
    </SafeAreaView>
  )
}

function makeStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
    screenTitle: { fontFamily: fonts.display, fontSize: 28 },
    fab: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    fabIcon: { fontFamily: fonts.bodyBold, fontSize: 22, lineHeight: 28 },
    tabStrip: { flexDirection: 'row', borderBottomWidth: 1 },
    tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabBtnActive: { borderBottomColor: colors.accent },
    tabText: { fontFamily: fonts.bodyMedium, fontSize: 14 },
    tabTextActive: { color: colors.accent },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    pageContent: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    activeCard: { borderRadius: 16, borderWidth: 1, padding: 18, gap: 14 },
    activeTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    catBadge: { backgroundColor: 'rgba(232,168,56,0.12)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(232,168,56,0.25)' },
    catText: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.accent },
    daysLeft: { fontFamily: fonts.body, fontSize: 12 },
    activeTitle: { fontFamily: fonts.display, fontSize: 18, lineHeight: 24 },
    checkinBtn: { borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
    checkinBtnText: { fontFamily: fonts.bodyBold, fontSize: 15 },
    pastCard: { borderRadius: 12, borderWidth: 1, padding: 16, gap: 6 },
    pastTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
    pastTitle: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 15, lineHeight: 20 },
    statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    statusText: { fontFamily: fonts.bodyMedium, fontSize: 11 },
    pastMeta: { fontFamily: fonts.body, fontSize: 12 },
    pastStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingTop: 8, marginTop: 4, borderTopWidth: 1 },
    pastStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    pastStatText: { fontFamily: fonts.body, fontSize: 11 },
    // Drafts
    draftSectionLabel: { fontFamily: fonts.bodyMedium, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
    draftCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10 },
    draftCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    draftCardTitle: { flex: 1, fontFamily: fonts.display, fontSize: 16, lineHeight: 22 },
    draftMeta: { fontFamily: fonts.body, fontSize: 12 },
    draftActions: { flexDirection: 'row', gap: 10 },
    draftBtn: { borderWidth: 1, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
    draftBtnText: { fontFamily: fonts.bodyBold, fontSize: 14 },
    draftIconBtn: { width: 44, height: 44, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    swipeBgDelete: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 100, borderRadius: 14, backgroundColor: colors.danger, justifyContent: 'center', alignItems: 'center', gap: 4 },
    swipeBgText: { fontFamily: fonts.bodyMedium, fontSize: 11, color: '#fff' },
  })
}
