import { useEffect, useState, useMemo, useCallback } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { getItem, setItem } from '../../utils/storage'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useFocusEffect } from 'expo-router'
import { subscribeUnread, setUnreadCount } from '../../utils/notificationStore'
import { apiGetNotifications } from '../../utils/api'
import VouchLogo from '../../components/shared/VouchLogo'
import { SafeAreaView } from 'react-native-safe-area-context'
import { fonts } from '../../constants/fonts'
import { spacing } from '../../constants/spacing'
import { useTheme } from '../../context/ThemeContext'
import { useUser } from '../../context/UserContext'
import { apiGetMyJourneys, apiGetDiscoverJourneys } from '../../utils/api'
import ActiveJourneyCard from '../../components/home/ActiveJourneyCard'
import Avatar from '../../components/shared/Avatar'
import WelcomeTutorial from '../../components/WelcomeTutorial'
import StatsRow from '../../components/home/StatsRow'
import { JourneyCardSkeleton, StatCardSkeleton } from '../../components/shared/SkeletonLoader'
import { useStreakStatus } from '../../hooks/useStreakStatus'

const CATEGORY_ICONS = {
  Fitness: 'barbell-outline',
  Learning: 'book-outline',
  Mindfulness: 'leaf-outline',
  Finance: 'cash-outline',
  Nutrition: 'nutrition-outline',
  Productivity: 'checkmark-done-outline',
  Social: 'people-outline',
  Custom: 'star-outline',
}

const CATEGORY_COLORS = ['#3D5AFE', '#00BFA5', '#E8A838', '#E53935', '#7B1FA2', '#00897B', '#F57C00', '#2979FF']

function categoryColor(category) {
  const idx = Object.keys(CATEGORY_ICONS).indexOf(category)
  return CATEGORY_COLORS[idx >= 0 ? idx : CATEGORY_COLORS.length - 1]
}

function sortByPriority(journeys) {
  const openJourneys = journeys.filter(j => j.status === 'open')
  const activeJourneys = journeys.filter(j => j.status === 'active')
  const needsCheckin = activeJourneys.filter(j => !j.checked_in_today)
  const doneToday = activeJourneys.filter(j => j.checked_in_today)
  return { openJourneys, needsCheckin, doneToday }
}

function EmptyHomeCard({ user, onCreate, onExplore, suggestedJourneys, loadingSuggested, onJoin, colors, styles }) {
  return (
    <>
      {/* Empty state card */}
      <View style={styles.emptyCard}>
        <View style={styles.emptyIconWrap}>
          {user?.avatar_seed || user?.avatar_url
            ? <Avatar name={user.full_name} uri={user.avatar_url} avatarSeed={user.avatar_seed} avatarBg={user.avatar_bg} size={64} />
            : <Ionicons name="people-outline" size={36} color={colors.accent} />
          }
        </View>
        <Text style={styles.emptyTitle}>You haven't started a journey yet</Text>
        <Text style={styles.emptyBody}>
          Create one or find a group to join. Your streak, progress, and partners will live here.
        </Text>
        <TouchableOpacity style={styles.emptyCta} onPress={onCreate} activeOpacity={0.85}>
          <Text style={styles.emptyCtaText}>Create a journey</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.emptyCtaSecondary} onPress={onExplore} activeOpacity={0.85}>
          <Text style={styles.emptyCtaSecondaryText}>Explore journeys</Text>
        </TouchableOpacity>
      </View>

      {/* Suggested for you */}
      <View style={styles.suggestedDivider}>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        <Text style={[styles.dividerText, { color: colors.textMuted }]}>suggested for you</Text>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
      </View>

      {loadingSuggested ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.sm }} />
      ) : suggestedJourneys.length > 0 ? (
        <View style={styles.suggestedSection}>
          <Text style={styles.suggestedLabel}>POPULAR NEAR YOU</Text>
          {suggestedJourneys.map(j => {
            const color = categoryColor(j.category)
            const icon = CATEGORY_ICONS[j.category] || 'star-outline'
            const memberCount = j.journey_members?.[0]?.count ?? j.current_participants ?? 0
            return (
              <TouchableOpacity key={j.id} style={[styles.suggestedCard, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => onJoin(j.id)} activeOpacity={0.88}>
                <View style={[styles.suggestedIconBox, { backgroundColor: color + '22' }]}>
                  <Ionicons name={icon} size={20} color={color} />
                </View>
                <View style={styles.suggestedInfo}>
                  <Text style={[styles.suggestedTitle, { color: colors.textPrimary }]} numberOfLines={1}>{j.title}</Text>
                  <Text style={[styles.suggestedMeta, { color: colors.textMuted }]}>
                    {j.creator?.country || 'Global'} · {memberCount}/{j.max_participants} members · {j.stake_amount > 0 ? `₦${j.stake_amount}` : 'Free'}
                  </Text>
                </View>
                <Text style={[styles.joinBtn, { color: colors.accent }]}>Join →</Text>
              </TouchableOpacity>
            )
          })}
        </View>
      ) : null}
    </>
  )
}

export default function Home() {
  const router = useRouter()
  const { colors } = useTheme()
  const { user, updateUser } = useUser()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const [loading, setLoading] = useState(true)
  const [activeJourneys, setActiveJourneys] = useState([])
  const [suggestedJourneys, setSuggestedJourneys] = useState([])
  const [loadingSuggested, setLoadingSuggested] = useState(false)

  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [showTutorial, setShowTutorial] = useState(false)

  useEffect(() => {
    const unsub = subscribeUnread(setUnreadNotifs)
    apiGetNotifications({ limit: 1 }).then(res => setUnreadCount(res.unread_count ?? 0)).catch(() => {})
    return unsub
  }, [])

  useEffect(() => {
    getItem('tutorial_seen').then(val => {
      if (!val) setShowTutorial(true)
    })
  }, [])

  const handleTutorialDone = () => {
    setShowTutorial(false)
    setItem('tutorial_seen', 'true')
  }

  const firstName = (user?.full_name || 'there').split(' ')[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning,' : hour < 17 ? 'Good afternoon,' : 'Good evening,'

  const loadJourneys = useCallback(async () => {
    try {
      const res = await apiGetMyJourneys()
      const active = res.data.active || []
      setActiveJourneys(active)
      updateUser({ active_journey_count: active.length })
      if (active.length === 0) loadSuggested()
    } catch (err) {
      console.error('[HOME] loadJourneys failed:', err.message)
    } finally { setLoading(false) }
  }, [])

  const loadSuggested = async () => {
    setLoadingSuggested(true)
    try {
      const res = await apiGetDiscoverJourneys({ limit: 3 })
      setSuggestedJourneys(res.journeys || [])
    } catch (_) {}
    finally { setLoadingSuggested(false) }
  }

  useFocusEffect(useCallback(() => { loadJourneys() }, [loadJourneys]))

  const { openJourneys, needsCheckin, doneToday } = sortByPriority(activeJourneys)
  const streakStatus = useStreakStatus(activeJourneys)

  return (
    <SafeAreaView style={styles.safe}>
      <WelcomeTutorial visible={showTutorial} onDone={handleTutorialDone} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <VouchLogo size={32} />
            <View>
              <Text style={styles.greeting}>{greeting}</Text>
              <Text style={styles.name}>{firstName}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.bellWrap}>
            <Ionicons name="notifications-outline" size={20} color={colors.textPrimary} />
            {unreadNotifs > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unreadNotifs > 99 ? '99+' : String(unreadNotifs)}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {loading ? (
          <>
            <JourneyCardSkeleton />
            <JourneyCardSkeleton />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[0, 1, 2].map(i => <StatCardSkeleton key={i} />)}
            </View>
          </>
        ) : activeJourneys.length === 0 ? (
          <EmptyHomeCard
            user={user}
            onCreate={() => router.push('/journey/create')}
            onExplore={() => router.push('/(tabs)/discover')}
            suggestedJourneys={suggestedJourneys}
            loadingSuggested={loadingSuggested}
            onJoin={(id) => router.push(`/journey/${id}`)}
            colors={colors}
            styles={styles}
          />
        ) : (
          <>
            {openJourneys.map(j => (
              <ActiveJourneyCard key={j.id} journey={j} checkedInToday={false} />
            ))}
            {needsCheckin.map(j => (
              <ActiveJourneyCard key={j.id} journey={j} checkedInToday={false} />
            ))}


            <View style={styles.middleGroup}>
              <View style={styles.streakCard}>
                <View style={styles.streakLeft}>
                  <Ionicons
                    name="flame"
                    size={28}
                    color={
                      streakStatus.fireState === 'gold'    ? colors.accent :
                      streakStatus.fireState === 'partial' ? '#F57C00' :
                      colors.textMuted
                    }
                    style={{ opacity: streakStatus.fireState === 'partial' ? 0.7 : 1 }}
                  />
                  <View>
                    <Text style={styles.streakCount}>{user?.current_streak ?? 0}</Text>
                    <Text style={styles.streakLabel}>day streak</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={styles.longestStreak}>Best: {user?.longest_streak ?? 0} days</Text>
                  {streakStatus.label && (
                    <Text style={[styles.streakProgress, {
                      color: streakStatus.isFullyComplete ? colors.success
                           : streakStatus.isPartial       ? '#F57C00'
                           : colors.textMuted
                    }]}>
                      {streakStatus.label}
                    </Text>
                  )}
                  {streakStatus.isPartial && (
                    <Text style={[styles.streakHint, { color: colors.textMuted }]}>
                      Streak won't count until all done
                    </Text>
                  )}
                </View>
              </View>
              <StatsRow
                journeysCompleted={user?.journeys_completed ?? 0}
                totalCheckins={user?.streak_total ?? 0}
                reputationScore={user?.reputation_score ?? 0}
              />
            </View>

            {doneToday.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Done for today</Text>
                {doneToday.map(j => (
                  <ActiveJourneyCard key={j.id} journey={j} checkedInToday={true} />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function makeStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    greeting: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary },
    name: { fontFamily: fonts.display, fontSize: 26, color: colors.textPrimary, lineHeight: 32 },
    bellWrap: { position: 'relative', width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
    notifBadge: { position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 1.5, borderColor: colors.bg },
    notifBadgeText: { color: '#fff', fontSize: 9, fontFamily: fonts.bodyBold, lineHeight: 12 },
    middleGroup: { gap: spacing.sm },
    streakCard: { backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    streakLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    streakCount: { fontFamily: fonts.display, fontSize: 28, color: colors.accent, lineHeight: 32 },
    streakLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
    longestStreak: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
    streakProgress: { fontFamily: fonts.bodyMedium, fontSize: 12 },
    streakHint: { fontFamily: fonts.body, fontSize: 11 },
    sectionLabel: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
    // Empty state
    emptyCard: { backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: spacing.xl, alignItems: 'center', gap: 14 },
    emptyIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.accent + '18', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.accent + '30', overflow: 'hidden' },
    emptyTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.textPrimary, textAlign: 'center', lineHeight: 28 },
    emptyBody: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21 },
    emptyCta: { width: '100%', backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
    emptyCtaText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.bg },
    emptyCtaSecondary: { width: '100%', borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
    emptyCtaSecondaryText: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.textSecondary },
    // Suggested
    suggestedDivider: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    dividerLine: { flex: 1, height: 1 },
    dividerText: { fontFamily: fonts.body, fontSize: 12 },
    suggestedSection: { gap: spacing.sm },
    suggestedLabel: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
    suggestedCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
    suggestedIconBox: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    suggestedInfo: { flex: 1 },
    suggestedTitle: { fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 20 },
    suggestedMeta: { fontFamily: fonts.body, fontSize: 12, marginTop: 2 },
    joinBtn: { fontFamily: fonts.bodyBold, fontSize: 14 },
  })
}
