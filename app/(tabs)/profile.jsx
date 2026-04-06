import { useState, useMemo } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { fonts } from '../../constants/fonts'
import { spacing } from '../../constants/spacing'
import { useTheme } from '../../context/ThemeContext'
import { CURRENT_USER, BADGES, MY_PAST_JOURNEYS } from '../../data/dummy'
import Avatar from '../../components/shared/Avatar'

export default function Profile() {
  const router = useRouter()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const [tab, setTab] = useState('Badges')

  const STATUS_COLORS = { completed: colors.success, abandoned: colors.danger }
  const earnedBadges = BADGES.filter(b => b.earned)
  const lockedBadges = BADGES.filter(b => !b.earned)

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Profile</Text>
          <TouchableOpacity style={styles.settingsBtn} onPress={() => router.push('/settings')} activeOpacity={0.7}>
            <Ionicons name="settings-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.identity}>
          <Avatar name={CURRENT_USER.full_name} size={72} />
          <View style={styles.identityText}>
            <Text style={styles.name}>{CURRENT_USER.full_name}</Text>
            <Text style={styles.handle}>@{CURRENT_USER.username}</Text>
            {CURRENT_USER.location ? <Text style={styles.location}>{CURRENT_USER.location}</Text> : null}
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCell}><Text style={styles.statVal}>{CURRENT_USER.total_journeys}</Text><Text style={styles.statLabel}>Journeys</Text></View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}><Text style={styles.statVal}>{CURRENT_USER.completed_journeys}</Text><Text style={styles.statLabel}>Completed</Text></View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}><Text style={[styles.statVal, { color: colors.accent }]}>{CURRENT_USER.current_streak}d</Text><Text style={styles.statLabel}>Streak</Text></View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}><Text style={styles.statVal}>{CURRENT_USER.longest_streak}d</Text><Text style={styles.statLabel}>Best</Text></View>
        </View>

        <View style={styles.subTabs}>
          {['Badges', 'History'].map(t => (
            <TouchableOpacity key={t} style={[styles.subTab, tab === t && styles.subTabActive]} onPress={() => setTab(t)} activeOpacity={0.7}>
              <Text style={[styles.subTabText, tab === t && styles.subTabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'Badges' && (
          <View style={styles.tabContent}>
            {earnedBadges.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>Earned</Text>
                <View style={styles.badgeGrid}>
                  {earnedBadges.map(b => (
                    <View key={b.key} style={styles.badgeCard}>
                      <View style={styles.badgeIconBox}>
                        <Ionicons name={b.icon} size={22} color={colors.accent} />
                      </View>
                      <Text style={styles.badgeName}>{b.name}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
            {lockedBadges.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>Locked</Text>
                <View style={styles.badgeGrid}>
                  {lockedBadges.map(b => (
                    <View key={b.key} style={[styles.badgeCard, styles.badgeCardLocked]}>
                      <View style={[styles.badgeIconBox, styles.badgeIconBoxLocked]}>
                        <Ionicons name={b.icon} size={22} color={colors.textMuted} />
                      </View>
                      <Text style={[styles.badgeName, { color: colors.textMuted }]}>{b.name}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        {tab === 'History' && (
          <View style={styles.tabContent}>
            {MY_PAST_JOURNEYS.length > 0 ? MY_PAST_JOURNEYS.map(j => (
              <View key={j.id} style={styles.historyCard}>
                <View style={styles.historyTop}>
                  <Text style={styles.historyTitle}>{j.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[j.status] + '18' }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLORS[j.status] }]}>
                      {j.status.charAt(0).toUpperCase() + j.status.slice(1)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.historyMeta}>{j.category} · {j.duration_days} days</Text>
              </View>
            )) : <Text style={styles.emptyText}>No past journeys yet.</Text>}
          </View>
        )}

        <View style={styles.settingsSection}>
          {[
            { label: 'Edit profile', onPress: () => router.push('/edit-profile') },
            { label: 'Notifications', onPress: () => router.push('/notifications') },
            { label: 'Privacy & security', onPress: () => router.push('/privacy') },
            { label: 'Help & support', onPress: () => router.push('/faq') },
            { label: 'Sign out', onPress: () => router.replace('/(auth)/welcome'), danger: true },
          ].map((item, i) => (
            <TouchableOpacity key={i} style={[styles.settingsRow, item.danger && styles.settingsRowDanger]} onPress={item.onPress} activeOpacity={0.7}>
              <Text style={[styles.settingsLabel, item.danger && styles.settingsLabelDanger]}>{item.label}</Text>
              <Text style={styles.settingsChevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function makeStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
    screenTitle: { fontFamily: fonts.display, fontSize: 28, color: colors.textPrimary },
    settingsBtn: { padding: 4 },
    identity: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    identityText: { flex: 1, gap: 3 },
    name: { fontFamily: fonts.display, fontSize: 20, color: colors.textPrimary },
    handle: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },
    location: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
    statsRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingVertical: 14 },
    statCell: { flex: 1, alignItems: 'center', gap: 3 },
    statDivider: { width: 1, height: 30, backgroundColor: colors.border },
    statVal: { fontFamily: fonts.display, fontSize: 20, color: colors.textPrimary },
    statLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.textMuted },
    subTabs: { flexDirection: 'row', paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border, marginTop: spacing.md },
    subTab: { paddingVertical: 10, paddingHorizontal: 20, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    subTabActive: { borderBottomColor: colors.accent },
    subTabText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textMuted },
    subTabTextActive: { color: colors.accent },
    tabContent: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.lg },
    sectionLabel: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
    badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    badgeCard: { width: '47%', backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 14, gap: 6, alignItems: 'center' },
    badgeCardLocked: { opacity: 0.45 },
    badgeIconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(232,168,56,0.12)', alignItems: 'center', justifyContent: 'center' },
    badgeIconBoxLocked: { backgroundColor: colors.surfaceAlt },
    badgeName: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textPrimary, textAlign: 'center' },
    historyCard: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 6 },
    historyTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
    historyTitle: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.textPrimary },
    statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    statusText: { fontFamily: fonts.bodyMedium, fontSize: 11 },
    historyMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
    emptyText: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.lg },
    settingsSection: { marginHorizontal: spacing.lg, marginTop: spacing.sm, marginBottom: spacing.xxl, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
    settingsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.border },
    settingsRowDanger: { borderBottomWidth: 0 },
    settingsLabel: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.textPrimary },
    settingsLabelDanger: { color: colors.danger },
    settingsChevron: { fontSize: 20, color: colors.textMuted, lineHeight: 24 },
  })
}
