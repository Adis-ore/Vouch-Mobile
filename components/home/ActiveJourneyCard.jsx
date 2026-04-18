import { useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../context/ThemeContext'
import { fonts } from '../../constants/fonts'
import Avatar from '../shared/Avatar'

export default function ActiveJourneyCard({ journey, checkedInToday }) {
  const members = journey.journey_members ?? journey.members ?? []
  const router = useRouter()
  const { colors } = useTheme()
  const personalAnim = useRef(new Animated.Value(0)).current
  const journeyAnim = useRef(new Animated.Value(0)).current
  const pulseAnim = useRef(new Animated.Value(1)).current

  const isOpen = journey.status === 'open'
  const isPendingPayment = journey.status === 'pending_payment'
  const isCreator = journey.my_role === 'creator'
  const membersNeeded = Math.max(0, 2 - (journey.current_participants ?? 1))

  const myCheckins = journey.my_checkins ?? 0
  const duration = journey.duration_days ?? 1
  const personalPct = Math.min(100, Math.round((myCheckins / duration) * 100))

  useEffect(() => {
    if (!isOpen && !isPendingPayment) {
      Animated.timing(personalAnim, { toValue: personalPct / 100, duration: 900, useNativeDriver: false }).start()
      Animated.timing(journeyAnim, { toValue: (journey.progress_percent ?? 0) / 100, duration: 700, useNativeDriver: false }).start()
    }
    if (!checkedInToday && !isOpen && !isPendingPayment) {
      const pulse = Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]))
      pulse.start()
      return () => pulse.stop()
    }
  }, [])

  const progressWidth = personalAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
  const journeyWidth = journeyAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: isPendingPayment ? (colors.warning ?? '#F59E0B') + '50' : isOpen ? colors.accent + '40' : colors.border }]}
      onPress={() => router.push(`/journey/${journey.id}`)}
      activeOpacity={0.9}
    >
      <View style={styles.topRow}>
        <View style={styles.categoryBadge}>
          <Text style={[styles.categoryText, { color: colors.accent }]}>{journey.category}</Text>
        </View>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, {
            backgroundColor: isPendingPayment ? colors.warning ?? '#F59E0B'
              : isOpen ? colors.accent : colors.success
          }]} />
          <Text style={[styles.statusText, {
            color: isPendingPayment ? colors.warning ?? '#F59E0B'
              : isOpen ? colors.accent : colors.success
          }]}>
            {isPendingPayment ? 'Payment pending' : isOpen ? 'Waiting to start' : 'Active'}
          </Text>
        </View>
      </View>

      <Text style={[styles.title, { color: colors.textPrimary }]}>{journey.title}</Text>

      {isPendingPayment ? (
        <View style={[styles.waitingRow, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <Ionicons name="card-outline" size={16} color={colors.textMuted} />
          <Text style={[styles.waitingText, { color: colors.textMuted }]}>
            Complete your deposit to open the journey to others
          </Text>
        </View>
      ) : isOpen ? (
        <View style={[styles.waitingRow, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <Ionicons name="people-outline" size={16} color={colors.textMuted} />
          <Text style={[styles.waitingText, { color: colors.textMuted }]}>
            {journey.current_participants}/{journey.max_participants} joined
            {membersNeeded > 0
              ? ` · needs ${membersNeeded} more member${membersNeeded !== 1 ? 's' : ''} to start`
              : ' · ready to start'}
          </Text>
        </View>
      ) : (
        <View style={styles.progressSection}>
          <View style={styles.progressLabels}>
            <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>Day {journey.days_elapsed} of {journey.duration_days}</Text>
            <View style={styles.pctPair}>
              <Text style={[styles.pct, { color: colors.accent }]}>{personalPct}%</Text>
              <Text style={[styles.pctSub, { color: colors.textMuted }]}>yours</Text>
            </View>
          </View>
          {/* Journey timeline (thin, muted) */}
          <View style={[styles.track, { backgroundColor: colors.surfaceAlt, height: 4 }]}>
            <Animated.View style={[styles.fill, { width: journeyWidth, height: 4, backgroundColor: colors.textMuted + '60' }]} />
          </View>
          {/* Personal check-in bar (thicker, gold) */}
          <View style={[styles.track, { backgroundColor: colors.accent + '20', height: 8, marginTop: 4 }]}>
            <Animated.View style={[styles.fill, { width: progressWidth, height: 8, backgroundColor: colors.accent }]} />
          </View>
          <View style={styles.progressLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
              <Text style={[styles.legendText, { color: colors.textMuted }]}>You {personalPct}%</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.textMuted + '60' }]} />
              <Text style={[styles.legendText, { color: colors.textMuted }]}>Journey {journey.progress_percent ?? 0}%</Text>
            </View>
          </View>
        </View>
      )}

      {members.length > 0 && (
        <View style={styles.membersRow}>
          <View style={styles.avatarStack}>
            {members.slice(0, 4).map((m, i) => {
              const u = m.user || m
              return (
                <View key={m.user_id || i} style={[styles.avatarWrap, { left: i * 20, borderColor: colors.surface }]}>
                  <Avatar name={u.full_name} uri={u.avatar_url} avatarSeed={u.avatar_seed} avatarBg={u.avatar_bg} size={28} />
                </View>
              )
            })}
          </View>
          <Text style={[styles.membersLabel, { color: colors.textSecondary }]}>{journey.current_participants} members</Text>
        </View>
      )}

      <View style={styles.ctaRow}>
        {isPendingPayment ? (
          <TouchableOpacity
            style={[styles.checkinBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.warning ?? '#F59E0B' }]}
            onPress={() => router.push(`/journey/${journey.id}`)}
            activeOpacity={0.85}
          >
            <Text style={[styles.checkinBtnText, { color: colors.warning ?? '#F59E0B' }]}>
              Complete payment →
            </Text>
          </TouchableOpacity>
        ) : isOpen ? (
          <TouchableOpacity
            style={[styles.checkinBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.accent }]}
            onPress={() => router.push(`/journey/${journey.id}`)}
            activeOpacity={0.85}
          >
            <Text style={[styles.checkinBtnText, { color: colors.accent }]}>
              {isCreator ? 'Manage journey →' : 'View journey →'}
            </Text>
          </TouchableOpacity>
        ) : checkedInToday ? (
          <View style={styles.doneRow}>
            <Text style={[styles.doneCheck, { color: colors.success }]}>✓</Text>
            <Text style={[styles.doneText, { color: colors.success }]}>Done for today</Text>
          </View>
        ) : (
          <Animated.View style={{ transform: [{ scale: pulseAnim }], flex: 1 }}>
            <TouchableOpacity
              style={[styles.checkinBtn, { backgroundColor: colors.accent }]}
              onPress={() => router.push(`/checkin/${journey.id}`)}
              activeOpacity={0.85}
            >
              <Text style={[styles.checkinBtnText, { color: colors.bg }]}>Check in now →</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, padding: 20, borderWidth: 1, gap: 14 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryBadge: { backgroundColor: 'rgba(232,168,56,0.12)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(232,168,56,0.25)' },
  categoryText: { fontFamily: fonts.bodyMedium, fontSize: 11 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontFamily: fonts.body, fontSize: 11 },
  title: { fontFamily: fonts.display, fontSize: 20, lineHeight: 26 },
  waitingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 8, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  waitingText: { fontFamily: fonts.body, fontSize: 13 },
  progressSection: { gap: 5 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayLabel: { fontFamily: fonts.body, fontSize: 12 },
  pctPair: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  pct: { fontFamily: fonts.bodyBold, fontSize: 13 },
  pctSub: { fontFamily: fonts.body, fontSize: 10 },
  track: { borderRadius: 99, overflow: 'hidden' },
  fill: { borderRadius: 99 },
  progressLegend: { flexDirection: 'row', gap: 12, marginTop: 2 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 7, height: 7, borderRadius: 3.5 },
  legendText: { fontFamily: fonts.body, fontSize: 10 },
  membersRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarStack: { height: 28, width: 80, position: 'relative' },
  avatarWrap: { position: 'absolute', borderWidth: 2, borderRadius: 14 },
  membersLabel: { fontFamily: fonts.body, fontSize: 12 },
  ctaRow: { flexDirection: 'row' },
  checkinBtn: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  checkinBtnText: { fontFamily: fonts.bodyBold, fontSize: 15 },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  doneCheck: { fontSize: 18 },
  doneText: { fontFamily: fonts.bodyMedium, fontSize: 14 },
})
