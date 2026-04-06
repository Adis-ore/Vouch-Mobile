import { useState, useMemo } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { fonts } from '../../constants/fonts'
import { spacing } from '../../constants/spacing'
import { useTheme } from '../../context/ThemeContext'
import { ACTIVE_JOURNEY, MY_PAST_JOURNEYS } from '../../data/dummy'
import ProgressBar from '../../components/journey/ProgressBar'
import EmptyState from '../../components/shared/EmptyState'

export default function MyJourneys() {
  const router = useRouter()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const [tab, setTab] = useState('Active')

  const STATUS_COLORS = { completed: colors.success, abandoned: colors.danger }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>My Journeys</Text>
        <TouchableOpacity style={styles.fab} onPress={() => router.push('/journey/create')} activeOpacity={0.85}>
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.subTabs}>
        {['Active', 'Past'].map(t => (
          <TouchableOpacity key={t} style={[styles.subTab, tab === t && styles.subTabActive]} onPress={() => setTab(t)} activeOpacity={0.7}>
            <Text style={[styles.subTabText, tab === t && styles.subTabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {tab === 'Active' && (
          ACTIVE_JOURNEY ? (
            <TouchableOpacity style={styles.activeCard} onPress={() => router.push(`/journey/${ACTIVE_JOURNEY.id}`)} activeOpacity={0.88}>
              <View style={styles.activeTop}>
                <View style={styles.catBadge}><Text style={styles.catText}>{ACTIVE_JOURNEY.category}</Text></View>
                <Text style={styles.daysLeft}>{ACTIVE_JOURNEY.duration_days - ACTIVE_JOURNEY.days_elapsed} days left</Text>
              </View>
              <Text style={styles.activeTitle}>{ACTIVE_JOURNEY.title}</Text>
              <ProgressBar percent={ACTIVE_JOURNEY.progress_percent} daysElapsed={ACTIVE_JOURNEY.days_elapsed} durationDays={ACTIVE_JOURNEY.duration_days} />
              <TouchableOpacity style={styles.checkinBtn} onPress={() => router.push(`/checkin/${ACTIVE_JOURNEY.id}`)} activeOpacity={0.85}>
                <Text style={styles.checkinBtnText}>Check in →</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ) : (
            <EmptyState title="No active journey" body="You're not in any journey right now." ctaLabel="Create one" onCta={() => router.push('/journey/create')} secondaryLabel="Find one to join" onSecondary={() => router.push('/(tabs)/discover')} />
          )
        )}

        {tab === 'Past' && (
          MY_PAST_JOURNEYS.length > 0 ? MY_PAST_JOURNEYS.map(j => (
            <View key={j.id} style={styles.pastCard}>
              <View style={styles.pastTop}>
                <Text style={styles.pastTitle}>{j.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[j.status] + '18' }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[j.status] }]}>
                    {j.status.charAt(0).toUpperCase() + j.status.slice(1)}
                  </Text>
                </View>
              </View>
              <Text style={styles.pastMeta}>{j.category} · {j.duration_days} days</Text>
            </View>
          )) : (
            <EmptyState title="No past journeys" body="Your completed journeys will appear here." />
          )
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function makeStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
    screenTitle: { fontFamily: fonts.display, fontSize: 28, color: colors.textPrimary },
    fab: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
    fabIcon: { fontFamily: fonts.bodyBold, fontSize: 22, color: colors.bg, lineHeight: 28 },
    subTabs: { flexDirection: 'row', paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
    subTab: { paddingVertical: 10, paddingHorizontal: 20, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    subTabActive: { borderBottomColor: colors.accent },
    subTabText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textMuted },
    subTabTextActive: { color: colors.accent },
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    activeCard: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 18, gap: 14 },
    activeTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    catBadge: { backgroundColor: 'rgba(232,168,56,0.12)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(232,168,56,0.25)' },
    catText: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.accent },
    daysLeft: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
    activeTitle: { fontFamily: fonts.display, fontSize: 18, color: colors.textPrimary, lineHeight: 24 },
    checkinBtn: { backgroundColor: colors.accent, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
    checkinBtnText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.bg },
    pastCard: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 6 },
    pastTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
    pastTitle: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.textPrimary, lineHeight: 20 },
    statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    statusText: { fontFamily: fonts.bodyMedium, fontSize: 11 },
    pastMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
  })
}
