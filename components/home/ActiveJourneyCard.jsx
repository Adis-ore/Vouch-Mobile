import { useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useTheme } from '../../context/ThemeContext'
import { fonts } from '../../constants/fonts'
import Avatar from '../shared/Avatar'

export default function ActiveJourneyCard({ journey, checkedInToday }) {
  const members = journey.members ?? []
  const router = useRouter()
  const { colors } = useTheme()
  const progressAnim = useRef(new Animated.Value(0)).current
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.timing(progressAnim, { toValue: journey.progress_percent / 100, duration: 800, useNativeDriver: false }).start()
    if (!checkedInToday) {
      const pulse = Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]))
      pulse.start()
      return () => pulse.stop()
    }
  }, [])

  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => router.push(`/journey/${journey.id}`)} activeOpacity={0.9}>
      <View style={styles.topRow}>
        <View style={styles.categoryBadge}>
          <Text style={[styles.categoryText, { color: colors.accent }]}>{journey.category}</Text>
        </View>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.statusText, { color: colors.success }]}>Active</Text>
        </View>
      </View>

      <Text style={[styles.title, { color: colors.textPrimary }]}>{journey.title}</Text>

      <View style={styles.progressSection}>
        <View style={styles.progressLabels}>
          <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>Day {journey.days_elapsed} of {journey.duration_days}</Text>
          <Text style={[styles.pct, { color: colors.accent }]}>{journey.progress_percent}%</Text>
        </View>
        <View style={[styles.track, { backgroundColor: colors.surfaceAlt }]}>
          <Animated.View style={[styles.fill, { width: progressWidth, backgroundColor: colors.accent }]} />
        </View>
      </View>

      <View style={styles.membersRow}>
        <View style={styles.avatarStack}>
          {members.slice(0, 4).map((m, i) => (
            <View key={m.user_id} style={[styles.avatarWrap, { left: i * 20, borderColor: colors.surface }]}>
              <Avatar name={m.full_name} size={28} />
            </View>
          ))}
        </View>
        <Text style={[styles.membersLabel, { color: colors.textSecondary }]}>{journey.current_participants} members</Text>
      </View>

      <View style={styles.ctaRow}>
        {checkedInToday ? (
          <View style={styles.doneRow}>
            <Text style={[styles.doneCheck, { color: colors.success }]}>✓</Text>
            <Text style={[styles.doneText, { color: colors.success }]}>Done for today</Text>
          </View>
        ) : (
          <Animated.View style={{ transform: [{ scale: pulseAnim }], flex: 1 }}>
            <TouchableOpacity style={[styles.checkinBtn, { backgroundColor: colors.accent }]} onPress={() => router.push(`/checkin/${journey.id}`)} activeOpacity={0.85}>
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
  progressSection: { gap: 6 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  dayLabel: { fontFamily: fonts.body, fontSize: 12 },
  pct: { fontFamily: fonts.bodyMedium, fontSize: 12 },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  membersRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarStack: { height: 28, width: 80, position: 'relative' },
  avatarWrap: { position: 'absolute', borderWidth: 2, borderRadius: 14 },
  membersLabel: { fontFamily: fonts.body, fontSize: 12 },
  ctaRow: { flexDirection: 'row' },
  checkinBtn: { borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  checkinBtnText: { fontFamily: fonts.bodyBold, fontSize: 15 },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  doneCheck: { fontSize: 18 },
  doneText: { fontFamily: fonts.bodyMedium, fontSize: 14 },
})
