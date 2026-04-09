import { useEffect, useState, useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import VouchLogo from '../../components/shared/VouchLogo'
import { SafeAreaView } from 'react-native-safe-area-context'
import { fonts } from '../../constants/fonts'
import { spacing } from '../../constants/spacing'
import { useTheme } from '../../context/ThemeContext'
import { useUser } from '../../context/UserContext'
import { ACTIVE_JOURNEYS, NOTIFICATIONS } from '../../data/dummy'
import ActiveJourneyCard from '../../components/home/ActiveJourneyCard'
import StatsRow from '../../components/home/StatsRow'
import EmptyState from '../../components/shared/EmptyState'
import { JourneyCardSkeleton, StatCardSkeleton } from '../../components/shared/SkeletonLoader'

const unreadCount = NOTIFICATIONS.filter(n => !n.read).length

// Unchecked journeys first, checked-in journeys last
function sortByPriority(journeys) {
  const needsCheckin = journeys.filter(j => !j.checkedInToday)
  const doneToday = journeys.filter(j => j.checkedInToday)
  return { needsCheckin, doneToday }
}

export default function Home() {
  const router = useRouter()
  const { colors } = useTheme()
  const { user } = useUser()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200)
    return () => clearTimeout(timer)
  }, [])

  const firstName = (user?.full_name || 'there').split(' ')[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning,' : hour < 17 ? 'Good afternoon,' : 'Good evening,'

  const { needsCheckin, doneToday } = sortByPriority(ACTIVE_JOURNEYS)

  return (
    <SafeAreaView style={styles.safe}>
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
            {unreadCount > 0 && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        </View>

        {loading ? (
          <>
            <JourneyCardSkeleton />
            <JourneyCardSkeleton />
          </>
        ) : ACTIVE_JOURNEYS.length === 0 ? (
          <EmptyState
            title="No active journey yet"
            body="Start a journey or join one to track your progress here."
            ctaLabel="Create a journey"
            onCta={() => router.push('/journey/create')}
            secondaryLabel="Find one to join"
            onSecondary={() => router.push('/(tabs)/discover')}
          />
        ) : (
          <>
            {/* Unchecked journeys — urgent, top */}
            {needsCheckin.map(j => (
              <ActiveJourneyCard key={j.id} journey={j} checkedInToday={false} />
            ))}

            {/* Streak + stats grouped together, between priority and done */}
            <View style={styles.middleGroup}>
              <View style={styles.streakCard}>
                <View style={styles.streakLeft}>
                  <Ionicons name="flame" size={28} color={colors.accent} />
                  <View>
                    <Text style={styles.streakCount}>{user?.current_streak ?? 0}</Text>
                    <Text style={styles.streakLabel}>day streak</Text>
                  </View>
                </View>
                <Text style={styles.longestStreak}>Best: {user?.longest_streak ?? 0} days</Text>
              </View>
              <StatsRow
                journeysCompleted={user?.journeys_completed ?? 0}
                totalCheckins={(user?.current_streak ?? 0) * 3}
                reputationScore={user?.reputation_score ?? 0}
              />
            </View>

            {/* Checked-in journeys — less urgent, below the grouped block */}
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

        {/* Stats row shown during loading state */}
        {loading && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[0, 1, 2].map(i => <StatCardSkeleton key={i} />)}
          </View>
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
    unreadDot: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger, borderWidth: 1.5, borderColor: colors.bg },
    middleGroup: { gap: spacing.sm },
    streakCard: { backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    streakLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    streakCount: { fontFamily: fonts.display, fontSize: 28, color: colors.accent, lineHeight: 32 },
    streakLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
    longestStreak: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
    sectionLabel: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
  })
}
