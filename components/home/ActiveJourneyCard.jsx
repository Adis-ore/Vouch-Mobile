import { useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { colors } from '../../constants/colors'
import { fonts } from '../../constants/fonts'
import { spacing } from '../../constants/spacing'
import Avatar from '../shared/Avatar'
import { JOURNEY_MEMBERS } from '../../data/dummy'

export default function ActiveJourneyCard({ journey, checkedInToday }) {
  const router = useRouter()
  const progressAnim = useRef(new Animated.Value(0)).current
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: journey.progress_percent / 100,
      duration: 800,
      useNativeDriver: false,
    }).start()

    if (!checkedInToday) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.04, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      )
      pulse.start()
      return () => pulse.stop()
    }
  }, [])

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  })

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/journey/${journey.id}`)}
      activeOpacity={0.9}
    >
      {/* Category + status row */}
      <View style={styles.topRow}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{journey.category}</Text>
        </View>
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Active</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>{journey.title}</Text>

      {/* Progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressLabels}>
          <Text style={styles.dayLabel}>Day {journey.days_elapsed} of {journey.duration_days}</Text>
          <Text style={styles.pct}>{journey.progress_percent}%</Text>
        </View>
        <View style={styles.track}>
          <Animated.View style={[styles.fill, { width: progressWidth }]} />
        </View>
      </View>

      {/* Members row */}
      <View style={styles.membersRow}>
        <View style={styles.avatarStack}>
          {JOURNEY_MEMBERS.slice(0, 4).map((m, i) => (
            <View key={m.user_id} style={[styles.avatarWrap, { left: i * 20 }]}>
              <Avatar name={m.full_name} size={28} />
            </View>
          ))}
        </View>
        <Text style={styles.membersLabel}>{journey.current_participants} members</Text>
      </View>

      {/* CTA */}
      <View style={styles.ctaRow}>
        {checkedInToday ? (
          <View style={styles.doneRow}>
            <Text style={styles.doneCheck}>✓</Text>
            <Text style={styles.doneText}>Done for today</Text>
          </View>
        ) : (
          <Animated.View style={{ transform: [{ scale: pulseAnim }], flex: 1 }}>
            <TouchableOpacity
              style={styles.checkinBtn}
              onPress={() => router.push(`/checkin/${journey.id}`)}
              activeOpacity={0.85}
            >
              <Text style={styles.checkinBtnText}>Check in now →</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryBadge: {
    backgroundColor: 'rgba(232,168,56,0.12)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(232,168,56,0.25)',
  },
  categoryText: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.accent },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  statusText: { fontFamily: fonts.body, fontSize: 11, color: colors.success },
  title: { fontFamily: fonts.display, fontSize: 20, color: colors.textPrimary, lineHeight: 26 },
  progressSection: { gap: 6 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  dayLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  pct: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.accent },
  track: {
    height: 6, backgroundColor: colors.surfaceAlt, borderRadius: 3, overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: colors.accent, borderRadius: 3 },
  membersRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarStack: { height: 28, width: 80, position: 'relative' },
  avatarWrap: { position: 'absolute', borderWidth: 2, borderColor: colors.surface, borderRadius: 14 },
  membersLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  ctaRow: { flexDirection: 'row' },
  checkinBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  checkinBtnText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.bg },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  doneCheck: { fontSize: 18, color: colors.success },
  doneText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.success },
})
