import { useEffect, useRef } from 'react'
import { View, Text, Animated, ScrollView, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../context/ThemeContext'
import { fonts } from '../../constants/fonts'

// Refund tiers based on PERSONAL completion
const TIERS = [
  { min: 100, max: 100, refund: 100, label: '100%',   color: '#4CAF50' },
  { min: 90,  max: 99,  refund: 95,  label: '90–99%', color: '#8BC34A' },
  { min: 75,  max: 89,  refund: 75,  label: '75–89%', color: '#FF9800' },
  { min: 0,   max: 74,  refund: 0,   label: '0–74%',  color: '#F44336' },
]

function getTier(pct) {
  return TIERS.find(t => pct >= t.min && pct <= t.max) ?? TIERS[TIERS.length - 1]
}

function Bar({ label, pct, color, trackColor, height = 7 }) {
  const anim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(anim, { toValue: Math.min(pct, 100) / 100, duration: 900, useNativeDriver: false }).start()
  }, [pct])
  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
  return (
    <View style={barStyles.row}>
      <Text style={[barStyles.label, { color }]}>{label}</Text>
      <View style={[barStyles.track, { height, backgroundColor: trackColor }]}>
        <Animated.View style={[barStyles.fill, { width, height, backgroundColor: color }]} />
      </View>
      <Text style={[barStyles.pct, { color }]}>{Math.round(pct)}%</Text>
    </View>
  )
}

const barStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 11, width: 50 },
  track: { flex: 1, borderRadius: 99, overflow: 'hidden' },
  fill: { borderRadius: 99 },
  pct: { fontFamily: fonts.bodyBold, fontSize: 12, width: 34, textAlign: 'right' },
})

// Each day dot: checked / missed / today / future
function DayDot({ state, dayNum, colors }) {
  const dotColor =
    state === 'checked' ? '#E8A838' :
    state === 'missed'  ? colors.danger :
    state === 'today'   ? 'transparent' : 'transparent'

  const borderColor =
    state === 'checked' ? '#E8A838' :
    state === 'missed'  ? colors.danger :
    state === 'today'   ? colors.accent :
    colors.border

  return (
    <View style={[dotStyles.wrap]}>
      <View style={[dotStyles.dot, { backgroundColor: dotColor, borderColor, borderWidth: state === 'future' ? 1 : 0 }]}>
        {state === 'missed' && <Ionicons name="close" size={8} color="#fff" />}
        {state === 'checked' && <Ionicons name="checkmark" size={8} color="#fff" />}
      </View>
      {dayNum % 5 === 0 && <Text style={[dotStyles.dayNum, { color: colors.textMuted }]}>{dayNum}</Text>}
    </View>
  )
}

const dotStyles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 2 },
  dot: { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  dayNum: { fontFamily: fonts.body, fontSize: 9 },
})

export default function JourneyProgress({ journey, myCheckins = 0, checkins = [], userId }) {
  const { colors } = useTheme()

  const daysElapsed = journey.days_elapsed ?? 0
  const duration = journey.duration_days ?? 1
  const stake = parseFloat(journey.stake_amount) || 0
  const platformFee = Math.round(stake * 0.10)
  const net = stake - platformFee

  // Personal completion: how many days did I actually check in
  const personalPct = Math.min(100, Math.round((myCheckins / duration) * 100))
  // Journey timeline: how far through the calendar we are
  const journeyPct = Math.min(100, Math.round((daysElapsed / duration) * 100))

  const activeTier = getTier(personalPct)
  const nextTier = TIERS.find(t => t.min > personalPct && t.min > 0)

  // Build day dots
  const today = new Date().toISOString().split('T')[0]
  const checkinDates = new Set(checkins.filter(c => c.user_id === userId).map(c => c.checkin_date))

  const dots = []
  if (journey.start_date) {
    const start = new Date(journey.start_date)
    const showDays = Math.min(duration, 60)
    for (let i = 0; i < showDays; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      let state = 'future'
      if (dateStr === today) state = 'today'
      else if (dateStr < today) state = checkinDates.has(dateStr) ? 'checked' : 'missed'
      dots.push({ state, day: i + 1 })
    }
  }

  const missedDays = dots.filter(d => d.state === 'missed').length
  const daysLeft = Math.max(0, duration - daysElapsed)

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>

      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Progress</Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>Day {daysElapsed} of {duration} · {daysLeft} days left</Text>
        </View>
        <View style={[styles.personalBadge, { backgroundColor: colors.accent + '15', borderColor: colors.accent + '30' }]}>
          <Text style={[styles.personalPct, { color: colors.accent }]}>{personalPct}%</Text>
          <Text style={[styles.personalLabel, { color: colors.accent }]}>yours</Text>
        </View>
      </View>

      {/* Dual bars */}
      <View style={styles.bars}>
        <Bar label="Journey" pct={journeyPct} color={colors.textMuted} trackColor={colors.surfaceAlt} height={5} />
        <Bar label="You" pct={personalPct} color={colors.accent} trackColor={colors.accent + '20'} height={9} />
      </View>

      {/* Day dots */}
      {dots.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dotsRow}>
          {dots.map((d, i) => (
            <DayDot key={i} state={d.state} dayNum={d.day} colors={colors} />
          ))}
        </ScrollView>
      )}

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#E8A838' }]} />
          <Text style={[styles.legendText, { color: colors.textMuted }]}>Checked in</Text>
        </View>
        {missedDays > 0 && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
            <Text style={[styles.legendText, { color: colors.textMuted }]}>{missedDays} missed</Text>
          </View>
        )}
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.border }]} />
          <Text style={[styles.legendText, { color: colors.textMuted }]}>Upcoming</Text>
        </View>
      </View>

      {/* Stake section */}
      {stake > 0 && (
        <View style={[styles.stakeSection, { borderTopColor: colors.border }]}>
          <View style={styles.stakeHeader}>
            <Ionicons name="wallet-outline" size={15} color="#E8A838" />
            <Text style={[styles.stakeTitle, { color: colors.textPrimary }]}>Your deposit: ₦{stake.toLocaleString()}</Text>
          </View>
          <Text style={[styles.stakeNote, { color: colors.textMuted }]}>
            Payout is based on YOUR personal completion, not the group's.
          </Text>

          {/* Tier rows */}
          <View style={[styles.tierTable, { borderColor: colors.border }]}>
            {TIERS.map(t => {
              const isActive = personalPct >= t.min && personalPct <= t.max
              const refundAmount = Math.round(net * t.refund / 100)
              return (
                <View key={t.label} style={[styles.tierRow, isActive && { backgroundColor: t.color + '15', borderRadius: 8 }]}>
                  <View style={[styles.tierIndicator, { backgroundColor: t.color }]} />
                  <Text style={[styles.tierRange, { color: isActive ? t.color : colors.textSecondary }]}>{t.label}</Text>
                  <Text style={[styles.tierArrow, { color: colors.textMuted }]}>→</Text>
                  <Text style={[styles.tierAmount, { color: isActive ? t.color : colors.textMuted }]}>
                    {t.refund === 0 ? 'nothing back' : `₦${refundAmount.toLocaleString()} back`}
                  </Text>
                  {isActive && <Text style={[styles.hereTag, { color: t.color }]}>← you</Text>}
                </View>
              )
            })}
          </View>

          {/* Projection */}
          <View style={[styles.projection, { backgroundColor: activeTier.color + '10', borderColor: activeTier.color + '30' }]}>
            <Text style={[styles.projectionMain, { color: activeTier.color }]}>
              At {personalPct}% → ₦{Math.round(net * activeTier.refund / 100).toLocaleString()} back
            </Text>
            {nextTier && daysLeft > 0 && (
              <Text style={[styles.projectionSub, { color: colors.textMuted }]}>
                Check in every remaining day to reach {nextTier.min}% and get ₦{Math.round(net * nextTier.refund / 100).toLocaleString()} back
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontFamily: fonts.bodyBold, fontSize: 15 },
  sub: { fontFamily: fonts.body, fontSize: 12, marginTop: 2 },
  personalBadge: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center' },
  personalPct: { fontFamily: fonts.display, fontSize: 20 },
  personalLabel: { fontFamily: fonts.body, fontSize: 10, marginTop: -2 },
  bars: { gap: 8 },
  dotsRow: { gap: 4, paddingVertical: 4 },
  legend: { flexDirection: 'row', gap: 14, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontFamily: fonts.body, fontSize: 11 },
  // Stake
  stakeSection: { borderTopWidth: 1, paddingTop: 14, gap: 10 },
  stakeHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stakeTitle: { fontFamily: fonts.bodyMedium, fontSize: 14 },
  stakeNote: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17 },
  tierTable: { borderWidth: 1, borderRadius: 10, padding: 8, gap: 4 },
  tierRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 7 },
  tierIndicator: { width: 6, height: 6, borderRadius: 3 },
  tierRange: { fontFamily: fonts.bodyMedium, fontSize: 13, width: 52 },
  tierArrow: { fontFamily: fonts.body, fontSize: 12 },
  tierAmount: { fontFamily: fonts.body, fontSize: 13, flex: 1 },
  hereTag: { fontFamily: fonts.bodyBold, fontSize: 11 },
  projection: { borderWidth: 1, borderRadius: 10, padding: 12, gap: 4 },
  projectionMain: { fontFamily: fonts.bodyBold, fontSize: 14 },
  projectionSub: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17 },
})
