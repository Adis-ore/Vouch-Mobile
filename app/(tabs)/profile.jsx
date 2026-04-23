import { useState, useMemo, useCallback } from 'react'
import { View, Text, TouchableOpacity, ScrollView, FlatList, Modal, StyleSheet, ActivityIndicator, Alert, Platform, ActionSheetIOS } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter, useFocusEffect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { fonts } from '../../constants/fonts'
import { spacing } from '../../constants/spacing'
import { useTheme } from '../../context/ThemeContext'
import { useUser } from '../../context/UserContext'
import { apiUpdateMe, apiGetMyJourneys } from '../../utils/api'
import Avatar from '../../components/shared/Avatar'

const BADGE_CATALOG = [
  { key: 'first_checkin',  name: 'First Step',       icon: 'footsteps-outline',       desc: 'You submitted your first check-in!',                      howToEarn: 'Submit your first check-in on any journey.' },
  { key: 'proof_5',        name: 'Proof Poster',      icon: 'camera-outline',          desc: 'You attached proof on 5 check-ins.',                      howToEarn: 'Attach proof (photo/note) to 5 check-ins.' },
  { key: 'proof_20',       name: 'Show Your Work',    icon: 'images-outline',          desc: '20 check-ins with proof. Accountability unlocked.',       howToEarn: 'Submit 20 check-ins with attached proof.' },
  { key: 'streak_3',       name: 'Getting Started',   icon: 'flash-outline',           desc: 'You hit a 3-day streak!',                                 howToEarn: 'Check in for 3 consecutive days.' },
  { key: 'streak_7',       name: 'On Fire',           icon: 'flame-outline',           desc: 'You hit a 7-day streak!',                                 howToEarn: 'Check in for 7 consecutive days.' },
  { key: 'streak_14',      name: 'Two Weeks Strong',  icon: 'trending-up-outline',     desc: '14 days straight. Serious.',                              howToEarn: 'Check in for 14 consecutive days.' },
  { key: 'streak_30',      name: 'Unstoppable',       icon: 'shield-checkmark-outline',desc: '30-day streak achieved!',                                 howToEarn: 'Check in for 30 consecutive days.' },
  { key: 'streak_60',      name: 'Elite',             icon: 'diamond-outline',         desc: '60 consecutive days. Legendary.',                         howToEarn: 'Check in for 60 consecutive days.' },
  { key: 'streak_100',     name: 'Centurion',         icon: 'trophy-outline',          desc: '100 days. You are built different.',                      howToEarn: 'Check in for 100 consecutive days.' },
  { key: 'first_journey',  name: 'Finisher',          icon: 'checkmark-done-outline',  desc: 'You completed your first journey!',                       howToEarn: 'Complete your first journey.' },
  { key: 'journeys_3',     name: 'Triple Crown',      icon: 'medal-outline',           desc: 'Three journeys completed.',                               howToEarn: 'Complete 3 journeys.' },
  { key: 'journeys_5',     name: 'Consistent',        icon: 'star-outline',            desc: 'Five journeys completed.',                                howToEarn: 'Complete 5 journeys.' },
  { key: 'journeys_10',    name: 'Veteran',           icon: 'ribbon-outline',          desc: 'Ten journeys completed.',                                 howToEarn: 'Complete 10 journeys.' },
  { key: 'stake_survivor', name: 'Stake Survivor',    icon: 'wallet-outline',          desc: 'Completed a staked journey and got your money back.',     howToEarn: 'Complete a journey that had a stake.' },
  { key: 'trusted',        name: 'Trusted',           icon: 'person-circle-outline',   desc: 'Your reputation score hit 80+.',                          howToEarn: 'Reach a reputation score of 80.' },
  { key: 'highly_trusted', name: 'Highly Trusted',    icon: 'shield-outline',          desc: 'Your reputation score hit 95+.',                          howToEarn: 'Reach a reputation score of 95.' },
]
import ShareCardButton from '../../components/shared/ShareCard'

export default function Profile() {
  const router = useRouter()
  const { colors } = useTheme()
  const { user, updateUser } = useUser()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const [tab, setTab] = useState('Badges')
  const [selectedBadge, setSelectedBadge] = useState(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [pastJourneys, setPastJourneys] = useState([])
  const [activeCount, setActiveCount] = useState(0)

  useFocusEffect(useCallback(() => {
    apiGetMyJourneys().then(res => {
      setPastJourneys(res.data?.past || [])
      setActiveCount((res.data?.active || []).length)
    }).catch(() => {})
  }, []))

  const OUTCOME_COLORS = { completed: colors.success, abandoned: colors.danger, auto_removed: colors.danger, left: colors.textMuted }
  const OUTCOME_LABELS = { completed: 'Completed', abandoned: 'Abandoned', auto_removed: 'Removed', left: 'Left' }

  const uploadAvatarPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    })
    if (result.canceled) return
    const uri = result.assets[0].uri
    updateUser({ avatar_url: uri, avatar_seed: null, avatar_bg: null })
    setUploadingAvatar(true)
    try {
      await apiUpdateMe({ avatar_url: uri, avatar_seed: null, avatar_bg: null })
    } catch (_) {}
    finally { setUploadingAvatar(false) }
  }

  const pickAvatar = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Change avatar (presets)', 'Upload photo', 'Cancel'], cancelButtonIndex: 2 },
        (i) => { if (i === 0) router.push('/edit-profile'); if (i === 1) uploadAvatarPhoto() }
      )
    } else {
      Alert.alert('Change avatar', '', [
        { text: 'Choose preset avatar', onPress: () => router.push('/edit-profile') },
        { text: 'Upload photo', onPress: uploadAvatarPhoto },
        { text: 'Cancel', style: 'cancel' },
      ])
    }
  }

  const streakType = (user?.current_streak ?? 0) >= 30 ? 'streak_30' : 'streak_7'

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
          <TouchableOpacity onPress={pickAvatar} activeOpacity={0.8} style={styles.avatarWrap} disabled={uploadingAvatar}>
            <Avatar
              name={user?.full_name ?? 'You'}
              uri={user?.avatar_url}
              avatarSeed={user?.avatar_seed}
              avatarBg={user?.avatar_bg}
              size={72}
            />
            {uploadingAvatar
              ? <View style={[styles.avatarEditBadge, { backgroundColor: colors.surfaceAlt, borderColor: colors.bg }]}>
                  <ActivityIndicator size={10} color={colors.accent} />
                </View>
              : <View style={[styles.avatarEditBadge, { backgroundColor: colors.accent, borderColor: colors.bg }]}>
                  <Ionicons name="camera-outline" size={11} color={colors.bg} />
                </View>
            }
          </TouchableOpacity>
          <View style={styles.identityText}>
            <Text style={styles.name}>{user?.full_name ?? 'Your Name'}</Text>
            {user?.username || user?.email
              ? <Text style={styles.handle}>@{user?.username ?? user.email.split('@')[0]}</Text>
              : null}
            {user?.location ? <Text style={styles.location}>{user.location}</Text> : null}
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCell}><Text style={styles.statVal}>{activeCount}</Text><Text style={styles.statLabel}>Active</Text></View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}><Text style={styles.statVal}>{user?.journeys_completed ?? 0}</Text><Text style={styles.statLabel}>Completed</Text></View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}><Text style={[styles.statVal, { color: colors.accent }]}>{user?.current_streak ?? 0}d</Text><Text style={styles.statLabel}>Streak</Text></View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}><Text style={styles.statVal}>{user?.longest_streak ?? 0}d</Text><Text style={styles.statLabel}>Best</Text></View>
        </View>

        {/* Share buttons — side by side */}
        {((user?.current_streak ?? 0) >= 7 || (user?.completed_journeys ?? 0) > 0) && (
          <View style={styles.shareRow}>
            {(user?.completed_journeys ?? 0) > 0 && (
              <View style={{ flex: 1 }}>
                <ShareCardButton type="journey_complete" userName={user?.full_name ?? 'You'} label="Share journey win" />
              </View>
            )}
            {(user?.current_streak ?? 0) >= 7 && (
              <View style={{ flex: 1 }}>
                <ShareCardButton type={streakType} userName={user?.full_name ?? 'You'} streakCount={user?.current_streak} label="Share streak" />
              </View>
            )}
          </View>
        )}

        <View style={styles.subTabs}>
          {['Badges', 'History'].map(t => (
            <TouchableOpacity key={t} style={[styles.subTab, tab === t && styles.subTabActive]} onPress={() => setTab(t)} activeOpacity={0.7}>
              <Text style={[styles.subTabText, tab === t && styles.subTabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'Badges' && (() => {
          const earnedMap = {}
          for (const b of (user?.badges || [])) earnedMap[b.key] = b.earned_at
          const allBadges = BADGE_CATALOG.map(b => ({ ...b, earned: !!earnedMap[b.key], earnedDate: earnedMap[b.key] || null }))
          const earnedBadges = allBadges.filter(b => b.earned)
          const lockedBadges = allBadges.filter(b => !b.earned)
          return (
            <View style={styles.tabContent}>
              <Text style={styles.sectionLabel}>Earned · {earnedBadges.length}</Text>
              {earnedBadges.length === 0
                ? <Text style={[styles.emptyText, { color: colors.textMuted }]}>No badges earned yet. Start checking in!</Text>
                : <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={earnedBadges}
                    keyExtractor={b => b.key}
                    contentContainerStyle={{ gap: 12, paddingVertical: 4 }}
                    snapToInterval={76}
                    decelerationRate="fast"
                    renderItem={({ item: b }) => (
                      <TouchableOpacity style={styles.badgeItem} onPress={() => setSelectedBadge(b)} activeOpacity={0.8}>
                        <View style={styles.badgeCircle}>
                          <Ionicons name={b.icon} size={24} color={colors.accent} />
                        </View>
                        <Text style={[styles.badgeName, { color: colors.textSecondary }]} numberOfLines={2}>{b.name}</Text>
                      </TouchableOpacity>
                    )}
                  />
              }

              <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>Locked · {lockedBadges.length}</Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={lockedBadges}
                keyExtractor={b => b.key}
                contentContainerStyle={{ gap: 12, paddingVertical: 4 }}
                snapToInterval={76}
                decelerationRate="fast"
                renderItem={({ item: b }) => (
                  <TouchableOpacity style={[styles.badgeItem, { opacity: 0.35 }]} onPress={() => setSelectedBadge(b)} activeOpacity={0.8}>
                    <View style={[styles.badgeCircle, { backgroundColor: colors.surfaceAlt }]}>
                      <Ionicons name={b.icon} size={24} color={colors.textMuted} />
                      <View style={styles.lockOverlay}>
                        <Ionicons name="lock-closed" size={10} color={colors.textMuted} />
                      </View>
                    </View>
                    <Text style={[styles.badgeName, { color: colors.textMuted }]} numberOfLines={2}>{b.name}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )
        })()}

        {tab === 'History' && (
          <View style={styles.tabContent}>
            {pastJourneys.length > 0 ? pastJourneys.map(j => {
              const outcomeColor = OUTCOME_COLORS[j.status] || colors.textMuted
              const outcomeLabel = OUTCOME_LABELS[j.status] || j.status
              const checkinPct = j.duration_days > 0 ? Math.min(100, Math.round(((j.total_checkins || 0) / j.duration_days) * 100)) : 0
              const endedDate = j.ended_at ? new Date(j.ended_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null
              return (
                <View key={j.history_id || j.id} style={[styles.historyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.historyTop}>
                    <Text style={[styles.historyTitle, { color: colors.textPrimary }]} numberOfLines={1}>{j.title}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: outcomeColor + '18' }]}>
                      <Text style={[styles.statusText, { color: outcomeColor }]}>{outcomeLabel}</Text>
                    </View>
                  </View>
                  <Text style={[styles.historyMeta, { color: colors.textMuted }]}>
                    {j.category} · {j.duration_days}d · {checkinPct}% completed
                    {j.my_role === 'creator' ? ' · Creator' : ''}
                  </Text>
                  {endedDate && (
                    <Text style={[styles.historyMeta, { color: colors.textMuted, marginTop: 2 }]}>{endedDate}</Text>
                  )}
                </View>
              )
            }) : <Text style={[styles.emptyText, { color: colors.textMuted }]}>No past journeys yet.</Text>}
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
              {!item.danger && <Text style={styles.settingsChevron}>›</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Badge info modal */}
      <Modal visible={!!selectedBadge} transparent animationType="fade" onRequestClose={() => setSelectedBadge(null)}>
        <TouchableOpacity style={styles.badgeModalOverlay} activeOpacity={1} onPress={() => setSelectedBadge(null)}>
          <View style={[styles.badgeModalBox, { backgroundColor: colors.surface, borderColor: colors.border }]} onStartShouldSetResponder={() => true}>
            {selectedBadge && (
              <>
                <View style={[styles.badgeModalCircle, selectedBadge.earned ? {} : { opacity: 0.4 }]}>
                  <Ionicons name={selectedBadge.icon} size={40} color={selectedBadge.earned ? colors.accent : colors.textMuted} />
                </View>
                <Text style={[styles.badgeModalName, { color: colors.textPrimary }]}>{selectedBadge.name}</Text>
                <Text style={[styles.badgeModalDesc, { color: colors.textSecondary }]}>{selectedBadge.desc}</Text>
                {selectedBadge.earned ? (
                  <View style={[styles.badgeEarnedRow, { backgroundColor: colors.success + '15' }]}>
                    <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                    <Text style={[styles.badgeEarnedText, { color: colors.success }]}>
                      Earned{selectedBadge.earnedDate ? ` on ${new Date(selectedBadge.earnedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.badgeHowWrap, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                    <Text style={[styles.badgeHowLabel, { color: colors.textMuted }]}>How to earn this:</Text>
                    <Text style={[styles.badgeHowText, { color: colors.textSecondary }]}>{selectedBadge.howToEarn}</Text>
                  </View>
                )}
                <TouchableOpacity onPress={() => setSelectedBadge(null)} style={styles.badgeModalClose}>
                  <Text style={[styles.badgeModalCloseText, { color: colors.textMuted }]}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
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
    avatarWrap: { position: 'relative' },
    avatarEditBadge: { position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
    identityText: { flex: 1, gap: 3 },
    name: { fontFamily: fonts.display, fontSize: 20, color: colors.textPrimary },
    handle: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },
    location: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
    statsRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.lg, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingVertical: 14 },
    statCell: { flex: 1, alignItems: 'center', gap: 3 },
    statDivider: { width: 1, height: 30, backgroundColor: colors.border },
    statVal: { fontFamily: fonts.display, fontSize: 20, color: colors.textPrimary },
    statLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.textMuted },
    shareRow: { flexDirection: 'row', gap: 8, paddingHorizontal: spacing.lg, marginTop: spacing.sm },
    subTabs: { flexDirection: 'row', paddingHorizontal: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border, marginTop: spacing.md },
    subTab: { paddingVertical: 10, paddingHorizontal: 20, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    subTabActive: { borderBottomColor: colors.accent },
    subTabText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textMuted },
    subTabTextActive: { color: colors.accent },
    tabContent: { padding: spacing.lg, gap: spacing.sm, paddingBottom: spacing.lg },
    sectionLabel: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6 },
    // Badge horizontal list
    badgeItem: { width: 64, alignItems: 'center', gap: 6 },
    badgeCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(232,168,56,0.12)', alignItems: 'center', justifyContent: 'center', position: 'relative' },
    lockOverlay: { position: 'absolute', bottom: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 8, padding: 2 },
    badgeName: { fontFamily: fonts.bodyMedium, fontSize: 10, textAlign: 'center', lineHeight: 13 },
    // History
    historyCard: { backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 6 },
    historyTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
    historyTitle: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.textPrimary },
    statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    statusText: { fontFamily: fonts.bodyMedium, fontSize: 11 },
    historyMeta: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
    emptyText: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.lg },
    // Settings rows
    settingsSection: { marginHorizontal: spacing.lg, marginTop: spacing.sm, marginBottom: spacing.xxl, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
    settingsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.border },
    settingsRowDanger: { borderBottomWidth: 0 },
    settingsLabel: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.textPrimary },
    settingsLabelDanger: { color: colors.danger },
    settingsChevron: { fontSize: 20, color: colors.textMuted, lineHeight: 24 },
    // Badge modal
    badgeModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
    badgeModalBox: { width: '100%', borderRadius: 20, borderWidth: 1, padding: spacing.lg, gap: spacing.md, alignItems: 'center' },
    badgeModalCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(232,168,56,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(232,168,56,0.25)' },
    badgeModalName: { fontFamily: fonts.display, fontSize: 22 },
    badgeModalDesc: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, textAlign: 'center' },
    badgeEarnedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
    badgeEarnedText: { fontFamily: fonts.bodyMedium, fontSize: 13 },
    badgeHowWrap: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 4, width: '100%' },
    badgeHowLabel: { fontFamily: fonts.bodyMedium, fontSize: 12 },
    badgeHowText: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
    badgeModalClose: { paddingVertical: 8 },
    badgeModalCloseText: { fontFamily: fonts.body, fontSize: 14 },
  })
}
