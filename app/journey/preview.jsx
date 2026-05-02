import { useState, useEffect, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, Image, StyleSheet,
  ActivityIndicator, Alert
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as WebBrowser from 'expo-web-browser'
import { Ionicons } from '@expo/vector-icons'
import { fonts } from '../../constants/fonts'
import { spacing } from '../../constants/spacing'
import { useTheme } from '../../context/ThemeContext'
import { useUser } from '../../context/UserContext'
import { apiGetJourney, apiJoinJourney } from '../../utils/api'
import { cacheJourney } from '../../utils/journeyCache'
import PlansModal, { getPlanLimit } from '../../components/shared/PlansModal'
import Avatar from '../../components/shared/Avatar'
import { logger } from '../../utils/logger'

export default function JourneyPreview() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const { colors } = useTheme()
  const { user, updateUser } = useUser()
  const styles = makeStyles(colors)

  const [journey, setJourney] = useState(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [plansVisible, setPlansVisible] = useState(false)

  useEffect(() => {
    apiGetJourney(id)
      .then(res => {
        setJourney(res.journey)
        cacheJourney(res.journey)
      })
      .catch(() => setError('Failed to load journey.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleJoin = useCallback(async () => {
    const limit = getPlanLimit(user?.plan ?? 'free')
    if ((user?.active_journey_count ?? 0) >= limit) {
      setPlansVisible(true)
      return
    }

    setJoining(true)
    setError('')
    try {
      const res = await apiJoinJourney(id)
      logger.info('[PREVIEW]', 'Joined journey', { id })
      updateUser({ active_journey_count: (user?.active_journey_count ?? 0) + 1 })
      cacheJourney(journey)

      if (res.payment_url) {
        await WebBrowser.openAuthSessionAsync(res.payment_url, 'vouch://')
      }

      router.replace(`/journey/${id}`)
    } catch (err) {
      logger.error('[PREVIEW]', `Join failed: ${err.message}`)
      if (err.code === 'JOURNEY_LIMIT_REACHED') {
        setPlansVisible(true)
      } else {
        setError(err.message)
      }
    } finally {
      setJoining(false)
    }
  }, [id, user, journey])

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { alignItems: 'center', justifyContent: 'center' }]} edges={['top']}>
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    )
  }

  if (!journey) {
    return (
      <SafeAreaView style={[styles.safe, { alignItems: 'center', justifyContent: 'center', gap: 12 }]} edges={['top']}>
        <Ionicons name="alert-circle-outline" size={40} color={colors.textMuted} />
        <Text style={{ fontFamily: fonts.body, color: colors.textMuted }}>Journey not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontFamily: fonts.bodyMedium, color: colors.accent }}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  const milestones = (journey.milestones || []).sort((a, b) => a.week_number - b.week_number)
  const members = journey.journey_members || []
  const stake = parseFloat(journey.stake_amount) || 0
  const isFull = journey.current_participants >= journey.max_participants

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Hero */}
      <View style={[styles.hero, journey.cover_image_url ? styles.heroTall : null]}>
        {journey.cover_image_url ? (
          <Image source={{ uri: journey.cover_image_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : null}
        {journey.cover_image_url ? <View style={[StyleSheet.absoluteFill, styles.coverScrim]} /> : null}

        <TouchableOpacity onPress={() => router.back()} style={styles.navBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color={journey.cover_image_url ? '#fff' : colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.heroContent}>
          <View style={styles.heroBadges}>
            <View style={styles.catBadge}>
              <Text style={[styles.catText, { color: colors.accent }]}>{journey.category}</Text>
            </View>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: journey.status === 'active' ? colors.success : colors.accent }]} />
              <Text style={[styles.statusText, { color: journey.status === 'active' ? colors.success : colors.accent }]}>
                {journey.status === 'open' ? 'Open' : journey.status}
              </Text>
            </View>
          </View>
          <Text style={[styles.heroTitle, journey.cover_image_url && { color: '#fff' }]}>{journey.title}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Stats row */}
        <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <StatCell icon="people-outline" label="Members" value={`${journey.current_participants}/${journey.max_participants}`} colors={colors} />
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <StatCell icon="calendar-outline" label="Duration" value={`${journey.duration_days} days`} colors={colors} />
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <StatCell
            icon="wallet-outline"
            label="Deposit"
            value={stake > 0 ? `₦${stake.toLocaleString()}` : 'Free'}
            colors={colors}
          />
        </View>

        {/* Creator */}
        {journey.creator && (
          <View style={[styles.creatorCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Avatar
              name={journey.creator.full_name}
              uri={journey.creator.avatar_url}
              avatarSeed={journey.creator.avatar_seed}
              avatarBg={journey.creator.avatar_bg}
              size={40}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.creatorName, { color: colors.textPrimary }]}>{journey.creator.full_name}</Text>
              <Text style={[styles.creatorMeta, { color: colors.textMuted }]}>Creator · {journey.creator.reputation_score ?? 0}% reputation</Text>
            </View>
          </View>
        )}

        {/* Description */}
        {journey.description ? (
          <Text style={[styles.description, { color: colors.textSecondary }]}>{journey.description}</Text>
        ) : null}

        {/* Stake note */}
        {stake > 0 && (
          <View style={[styles.stakeNote, { backgroundColor: colors.accent + '10', borderColor: colors.accent + '30' }]}>
            <Ionicons name="information-circle-outline" size={16} color={colors.accent} />
            <Text style={[styles.stakeNoteText, { color: colors.textSecondary }]}>
              A refundable deposit of <Text style={{ color: colors.accent, fontFamily: fonts.bodyBold }}>₦{stake.toLocaleString()}</Text> is required. Complete the journey and get it back. Abandon and it's forfeited.
            </Text>
          </View>
        )}

        {/* Milestones */}
        {milestones.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Milestones</Text>
            {milestones.map((m, i) => (
              <View key={m.id} style={[styles.milestoneRow, { borderBottomColor: colors.border }, i === milestones.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={[styles.weekBadge, { backgroundColor: colors.accent + '15' }]}>
                  <Text style={[styles.weekBadgeText, { color: colors.accent }]}>{journey.duration_days < 7 ? 'D' : 'W'}{m.week_number}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.milestoneTitle, { color: colors.textPrimary }]}>{m.title}</Text>
                  {m.description ? (
                    <Text style={[styles.milestoneDesc, { color: colors.textMuted }]}>{m.description}</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </>
        )}

        {/* Current members */}
        {members.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Who's in</Text>
            <View style={styles.membersRow}>
              {members.slice(0, 8).map((m, i) => {
                const u = m.user || m
                return (
                  <View key={m.user_id || i} style={styles.memberChip}>
                    <Avatar name={u.full_name} uri={u.avatar_url} avatarSeed={u.avatar_seed} avatarBg={u.avatar_bg} size={38} />
                    <Text style={[styles.memberName, { color: colors.textMuted }]} numberOfLines={1}>
                      {(u.full_name || '').split(' ')[0]}
                    </Text>
                  </View>
                )
              })}
              {members.length > 8 && (
                <View style={[styles.memberChip, { alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={[styles.memberOverflow, { color: colors.textMuted }]}>+{members.length - 8}</Text>
                </View>
              )}
            </View>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Join CTA pinned at bottom */}
      <View style={[styles.joinBar, { backgroundColor: colors.bg, borderTopColor: colors.border }]}>
        {error ? (
          <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
        ) : null}
        {isFull ? (
          <View style={[styles.joinBtn, { backgroundColor: colors.surfaceAlt }]}>
            <Text style={[styles.joinBtnText, { color: colors.textMuted }]}>Journey is full</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.joinBtn, { backgroundColor: colors.accent, opacity: joining ? 0.7 : 1 }]}
            onPress={handleJoin}
            disabled={joining}
            activeOpacity={0.85}
          >
            {joining
              ? <ActivityIndicator size="small" color={colors.bg} />
              : <Text style={[styles.joinBtnText, { color: colors.bg }]}>
                  {stake > 0 ? `Join + Pay ₦${stake.toLocaleString()} deposit` : 'Join journey'}
                </Text>
            }
          </TouchableOpacity>
        )}
      </View>

      <PlansModal visible={plansVisible} onClose={() => setPlansVisible(false)} />
    </SafeAreaView>
  )
}

function StatCell({ icon, label, value, colors }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 4, paddingVertical: 14 }}>
      <Ionicons name={icon} size={18} color={colors.textMuted} />
      <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.textMuted }}>{label}</Text>
      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: colors.textPrimary }}>{value}</Text>
    </View>
  )
}

function makeStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    hero: {
      overflow: 'hidden',
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
      justifyContent: 'space-between',
      gap: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    heroTall: { height: 220 },
    coverScrim: { backgroundColor: 'rgba(0,0,0,0.45)' },
    navBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.30)', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' },
    heroContent: { gap: 6 },
    heroBadges: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    catBadge: { backgroundColor: 'rgba(232,168,56,0.15)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    catText: { fontFamily: fonts.bodyMedium, fontSize: 11 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontFamily: fonts.body, fontSize: 11 },
    heroTitle: { fontFamily: fonts.display, fontSize: 24, color: colors.textPrimary, lineHeight: 30 },
    scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    statsRow: { flexDirection: 'row', borderRadius: 14, borderWidth: 1 },
    statDivider: { width: 1, marginVertical: 10 },
    creatorCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
    creatorName: { fontFamily: fonts.bodyMedium, fontSize: 15 },
    creatorMeta: { fontFamily: fonts.body, fontSize: 12, marginTop: 2 },
    description: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
    stakeNote: { flexDirection: 'row', gap: 8, borderRadius: 12, borderWidth: 1, padding: 14, alignItems: 'flex-start' },
    stakeNoteText: { flex: 1, fontFamily: fonts.body, fontSize: 13, lineHeight: 19 },
    sectionTitle: { fontFamily: fonts.bodyBold, fontSize: 15, marginTop: 4 },
    milestoneRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
    weekBadge: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
    weekBadgeText: { fontFamily: fonts.bodyBold, fontSize: 11 },
    milestoneTitle: { fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 20 },
    milestoneDesc: { fontFamily: fonts.body, fontSize: 12, marginTop: 3, lineHeight: 17 },
    membersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
    memberChip: { alignItems: 'center', gap: 4, width: 52 },
    memberName: { fontFamily: fonts.body, fontSize: 11, textAlign: 'center' },
    memberOverflow: { fontFamily: fonts.bodyBold, fontSize: 15 },
    joinBar: { paddingHorizontal: spacing.lg, paddingTop: 12, paddingBottom: 24, borderTopWidth: 1, gap: 8 },
    joinBtn: { borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center' },
    joinBtnText: { fontFamily: fonts.bodyBold, fontSize: 16 },
    errorText: { fontFamily: fonts.body, fontSize: 13, textAlign: 'center' },
  })
}
