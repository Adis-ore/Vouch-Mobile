import { useRef, useEffect, useState, useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Animated, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import VouchLogo from '../../components/shared/VouchLogo'
import { SafeAreaView } from 'react-native-safe-area-context'
import { fonts } from '../../constants/fonts'
import { spacing } from '../../constants/spacing'
import { useTheme } from '../../context/ThemeContext'
import { CURRENT_USER, ACTIVE_JOURNEY, NOTIFICATIONS } from '../../data/dummy'
import ActiveJourneyCard from '../../components/home/ActiveJourneyCard'
import StatsRow from '../../components/home/StatsRow'
import ActivityFeed from '../../components/home/ActivityFeed'
import EmptyState from '../../components/shared/EmptyState'
import { JourneyCardSkeleton, StatCardSkeleton } from '../../components/shared/SkeletonLoader'

const CHECKED_IN_TODAY = true
const unreadCount = NOTIFICATIONS.filter(n => !n.read).length

export default function Home() {
  const router = useRouter()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const [loading, setLoading] = useState(true)
  const streakAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
      Animated.timing(streakAnim, { toValue: CURRENT_USER.streak_total, duration: 900, useNativeDriver: false }).start()
    }, 1200)
    return () => clearTimeout(timer)
  }, [])

  const firstName = CURRENT_USER.full_name.split(' ')[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning,' : hour < 17 ? 'Good afternoon,' : 'Good evening,'

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
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
            {unreadCount > 0 && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        </View>

        {loading ? <JourneyCardSkeleton /> : ACTIVE_JOURNEY ? (
          <ActiveJourneyCard journey={ACTIVE_JOURNEY} checkedInToday={CHECKED_IN_TODAY} />
        ) : (
          <EmptyState
            title="No active journey yet"
            body="Start a journey or join one to track your progress here."
            ctaLabel="Create a journey"
            onCta={() => router.push('/journey/create')}
            secondaryLabel="Find one to join"
            onSecondary={() => router.push('/(tabs)/discover')}
          />
        )}

        {!loading && (
          <View style={styles.streakCard}>
            <View style={styles.streakLeft}>
              <Ionicons name="flame" size={28} color={colors.accent} />
              <View>
                <Animated.Text style={styles.streakCount}>{CURRENT_USER.streak_total}</Animated.Text>
                <Text style={styles.streakLabel}>day streak</Text>
              </View>
            </View>
            <Text style={styles.longestStreak}>Longest: {CURRENT_USER.longest_streak} days</Text>
          </View>
        )}

        {loading ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[0, 1, 2].map(i => <StatCardSkeleton key={i} />)}
          </View>
        ) : (
          <StatsRow journeysCompleted={CURRENT_USER.journeys_completed} totalCheckins={CURRENT_USER.streak_total * 3} reputationScore={CURRENT_USER.reputation_score} />
        )}

        {!loading && <ActivityFeed notifications={NOTIFICATIONS} />}
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
    unreadDot: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger, borderWidth: 1.5, borderColor: colors.bg },
    streakCard: { backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    streakLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    streakCount: { fontFamily: fonts.display, fontSize: 28, color: colors.accent, lineHeight: 32 },
    streakLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
    longestStreak: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
  })
}
