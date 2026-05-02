import { useState, useRef, useMemo, useCallback, useEffect } from 'react'
import { View, Text, TouchableOpacity, ScrollView, FlatList, TextInput, KeyboardAvoidingView, Platform, Dimensions, StyleSheet, Share, Modal, Alert, ActivityIndicator, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { fonts } from '../../constants/fonts'
import { spacing } from '../../constants/spacing'
import { FEATURES } from '../../constants/features'
import { useTheme } from '../../context/ThemeContext'
import { useUser } from '../../context/UserContext'
import { apiGetJourney, apiGetCheckins, apiGetMessages, apiSendMessage, apiVerifyCheckin, apiLeaveJourney, apiAbandonJourney, apiStartJourney, apiEditMessage, apiDeleteMessage } from '../../utils/api'
import { cacheJourney, getCachedJourney } from '../../utils/journeyCache'
import { wasRecentlyCheckedIn } from '../../utils/checkinSignal'
import { markAbandoned } from '../../utils/abandonSignal'
import JourneyProgress from '../../components/journey/JourneyProgress'
import MemberRow from '../../components/journey/MemberRow'
import CheckinCard from '../../components/journey/CheckinCard'
import CheckinHeatmap from '../../components/journey/CheckinHeatmap'
import ChatBubble from '../../components/journey/ChatBubble'
import Avatar from '../../components/shared/Avatar'
import ShareCardButton from '../../components/shared/ShareCard'

const TABS = ['Overview', 'Check-ins', 'Chat', 'Members']
const { width: SCREEN_WIDTH } = Dimensions.get('window')

function buildHeatmap(startDate, durationDays, checkins, userId) {
  if (!startDate || !durationDays) return []
  const start = new Date(startDate)
  const todayDate = new Date()
  const todayStr = todayDate.toISOString().split('T')[0]
  const daysToShow = Math.min(durationDays, Math.ceil((todayDate - start) / 86400000) + 1)
  const byDate = {}
  for (const c of checkins) {
    if (!byDate[c.checkin_date]) byDate[c.checkin_date] = { own: false, total: 0 }
    byDate[c.checkin_date].total++
    if (c.user_id === userId) byDate[c.checkin_date].own = true
  }
  const result = []
  for (let i = 0; i < daysToShow; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    const day = byDate[dateStr]
    const isPast = dateStr < todayStr
    let state = 'future'
    if (day?.own) state = 'own'
    else if (day?.total > 0) state = 'others'
    else if (isPast) state = 'missed'
    result.push({ state })
  }
  return result
}

export default function JourneyDetail() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const { colors } = useTheme()
  const { user } = useUser()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const [journey, setJourney] = useState(null)
  const [checkins, setCheckins] = useState([])
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(0)
  const [chatInput, setChatInput] = useState('')
  const [sending, setSending] = useState(false)
  const [abandonModalVisible, setAbandonModalVisible] = useState(false)
  const [starting, setStarting] = useState(false)

  const pagerRef = useRef(null)
  const chatListRef = useRef(null)

  const load = useCallback(async (background = false) => {
    // Show cached data immediately so the screen feels instant
    if (!background) {
      const cached = getCachedJourney(id)
      if (cached) {
        setJourney(cached)
        setLoading(false)
      }
    }
    try {
      const [journeyRes, checkinsRes, messagesRes] = await Promise.all([
        apiGetJourney(id),
        apiGetCheckins(id).catch(() => ({ checkins: [] })),
        apiGetMessages(id).catch(() => ({ messages: [] })),
      ])
      cacheJourney(journeyRes.journey)
      setJourney(journeyRes.journey)
      setCheckins(checkinsRes.checkins || [])
      setMessages(([...(messagesRes.messages || [])]).reverse())
    } catch (_) {}
    finally { setLoading(false) }
  }, [id])

  // Initial load
  useEffect(() => { load() }, [load])

  // Background refresh when returning to this screen (e.g. after submitting a check-in)
  useFocusEffect(useCallback(() => { load(true) }, [load]))

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => chatListRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }, [messages.length])

  const goToTab = (index) => {
    setActiveTab(index)
    pagerRef.current?.scrollToIndex({ index, animated: true })
  }

  const onScrollEnd = (e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
    setActiveTab(index)
  }

  const sendMessage = async () => {
    if (!chatInput.trim() || isChatEnded) return
    const content = chatInput.trim()
    setChatInput('')
    const tempId = `temp-${Date.now()}`
    setMessages(prev => [...prev, {
      id: tempId,
      sender_id: user?.id,
      content,
      type: 'text',
      created_at: new Date().toISOString(),
      sender: { id: user?.id, full_name: user?.full_name },
    }])
    setSending(true)
    try {
      const res = await apiSendMessage(id, content)
      setMessages(prev => prev.map(m => m.id === tempId ? res.message : m))
    } catch (_) {
      setMessages(prev => prev.filter(m => m.id !== tempId))
    } finally {
      setSending(false)
      setTimeout(() => chatListRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }

  const handleVerify = async (checkinId) => {
    try { await apiVerifyCheckin(checkinId, 'approve') } catch (_) {}
  }

  const handleFlag = async (checkinId) => {
    try { await apiVerifyCheckin(checkinId, 'flag') } catch (_) {}
  }

  const handleEditMessage = async (messageId, content) => {
    try {
      const res = await apiEditMessage(messageId, content)
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, ...res.message } : m))
    } catch (_) {}
  }

  const handleDeleteMessage = async (messageId) => {
    setMessages(prev => prev.filter(m => m.id !== messageId))
    try { await apiDeleteMessage(messageId) } catch (_) {
      load(true)
    }
  }

  const handleLeave = () => {
    setAbandonModalVisible(false)
    markAbandoned(id)
    router.replace('/(tabs)/journeys')
    const apiCall = isCreator ? apiAbandonJourney(id) : apiLeaveJourney(id)
    apiCall.catch(() => {})
  }

  const handleStart = async () => {
    setStarting(true)
    try {
      await apiStartJourney(id)
      await load()
    } catch (err) {
      Alert.alert('Cannot start', err.message)
    } finally {
      setStarting(false)
    }
  }

  const inviteFriend = async () => {
    if (!journey) return
    try {
      await Share.share({
        message: `Join me on Vouch! I'm working on "${journey.title}". Join here: https://vouch.app/journey/${journey.id}`,
        title: 'Join my journey on Vouch',
      })
    } catch (_) {}
  }

  if (loading || !journey) {
    return (
      <SafeAreaView style={[{ flex: 1, backgroundColor: loading ? undefined : '#000' }, !loading && { backgroundColor: colors?.bg }]}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors?.accent} />
        </View>
      </SafeAreaView>
    )
  }

  const members = journey.journey_members || []
  const milestones = (journey.milestones || []).sort((a, b) => a.week_number - b.week_number)
  const isCreator = journey.creator_id === user?.id
  const myMember = members.find(m => m.user_id === user?.id)
  const isChatEnded = !['open', 'active'].includes(journey.status)

  const flatMembers = members.map(m => ({
    ...m,
    full_name: m.user?.full_name || 'Unknown',
    avatar_url: m.user?.avatar_url,
    avatar_seed: m.user?.avatar_seed,
    avatar_bg: m.user?.avatar_bg,
  }))

  const today = new Date().toISOString().split('T')[0]
  const checkedInToday = checkins.some(c => c.user_id === user?.id && c.checkin_date === today) || wasRecentlyCheckedIn(id)
  const myJoinDate = myMember?.joined_at?.split('T')[0]
  const canVerifyToday = myJoinDate !== today

  const myCheckins = checkins.filter(c => c.user_id === user?.id)
  const otherCheckins = checkins.filter(c => c.user_id !== user?.id)

  const missedDays = (() => {
    if (!journey.start_date || journey.status !== 'active') return []
    const today = new Date()
    const start = new Date(journey.start_date)
    const checkedInDates = new Set(myCheckins.map(c => c.checkin_date))
    const missed = []
    let curr = new Date(start)
    while (curr < today) {
      const ds = curr.toISOString().split('T')[0]
      if (!checkedInDates.has(ds)) missed.push({ id: `missed-${ds}`, date: ds })
      curr.setDate(curr.getDate() + 1)
    }
    return missed.reverse()
  })()

  const heatmapData = buildHeatmap(journey.start_date, journey.duration_days, checkins, user?.id)

  const completionPercent = myMember
    ? Math.round(((myMember.total_checkins ?? journey.days_elapsed ?? 0) / journey.duration_days) * 100)
    : journey.progress_percent ?? 0
  const stake = parseFloat(journey.stake_amount) || 0

  let refundPercent = 0
  if (completionPercent >= 100) refundPercent = 100
  else if (completionPercent >= 90) refundPercent = 95
  else if (completionPercent >= 75) refundPercent = 75
  const refundAmount = Math.round((refundPercent / 100) * stake)
  const lossAmount = stake - refundAmount

  let encouragement = ''
  if (FEATURES.STAKE_DEPOSITS) {
    if (completionPercent >= 85 && completionPercent < 90) encouragement = `You're ${90 - completionPercent}% away from getting 95% back (₦${Math.round(stake * 0.95).toLocaleString()}).`
    else if (completionPercent >= 70 && completionPercent < 75) encouragement = `Just ${75 - completionPercent}% more and you'll recover ₦${Math.round(stake * 0.75).toLocaleString()}.`
  }

  const confirmLabel = isCreator
    ? 'Yes, abandon journey for everyone'
    : 'Yes, leave journey'

  const renderTab = ({ item: tabIndex }) => {
    if (tabIndex === 0) return (
      <ScrollView style={{ width: SCREEN_WIDTH }} contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
        {journey.description ? <Text style={styles.description}>{journey.description}</Text> : null}
        <JourneyProgress
          journey={journey}
          myCheckins={myMember?.total_checkins ?? 0}
          checkins={checkins}
          userId={user?.id}
        />

        {journey.status === 'open' && isCreator && (
          <TouchableOpacity
            style={[styles.startBtn, { opacity: starting ? 0.7 : 1 }]}
            onPress={handleStart}
            disabled={starting}
            activeOpacity={0.85}
          >
            {starting
              ? <ActivityIndicator size="small" color={colors.bg} />
              : <Text style={styles.startBtnText}>Start journey now →</Text>
            }
          </TouchableOpacity>
        )}

        <Text style={styles.sectionTitle}>Milestones</Text>
        {milestones.map(m => (
          <View key={m.id} style={[styles.milestoneRow, !m.is_unlocked && styles.milestoneLocked]}>
            <View style={[styles.milestoneIcon, m.is_unlocked && styles.milestoneIconUnlocked]}>
              <Ionicons name={m.is_unlocked ? 'diamond' : 'diamond-outline'} size={12} color={m.is_unlocked ? colors.accent : colors.textMuted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.milestoneTitle, !m.is_unlocked && { color: colors.textMuted }]}>{journey.duration_days < 7 ? 'Day' : 'Week'} {m.week_number}: {m.title}</Text>
              {m.description ? <Text style={styles.milestoneDesc} numberOfLines={1}>{m.description}</Text> : null}
            </View>
            {m.is_unlocked && !m.both_reflected && (
              <TouchableOpacity style={styles.reflectBtn} onPress={() => router.push(`/milestone/${m.id}`)}>
                <Text style={styles.reflectText}>Reflect</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        <Text style={styles.sectionTitle}>Members</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {flatMembers.map(m => (
            <View key={m.user_id} style={styles.memberChip}>
              <Avatar name={m.full_name} uri={m.avatar_url} avatarSeed={m.avatar_seed} avatarBg={m.avatar_bg} size={36} />
              <Text style={styles.memberChipName}>{m.full_name.split(' ')[0]}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Ionicons name="flame" size={11} color={colors.accent} />
                <Text style={styles.memberChipStreak}>{m.current_streak ?? 0}d</Text>
              </View>
            </View>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.inviteBtn} onPress={inviteFriend}>
          <Text style={styles.inviteBtnText}>Invite a friend →</Text>
        </TouchableOpacity>

        {journey.status === 'completed' && (
          <View style={styles.shareRow}>
            <Text style={[styles.sectionTitle, { marginTop: 0 }]}>Share your achievement</Text>
            <ShareCardButton
              type="journey_complete"
              userName={user?.full_name}
              journeyTitle={journey.title}
              label="Share completion card"
            />
          </View>
        )}

        {['open', 'active'].includes(journey.status) && myMember && (
          <TouchableOpacity style={styles.leaveBtn} onPress={() => setAbandonModalVisible(true)} activeOpacity={0.8}>
            <View style={styles.leaveBtnInner}>
              <Ionicons name="exit-outline" size={16} color={colors.danger} />
              <Text style={styles.leaveBtnText}>{isCreator ? 'Abandon this journey' : 'Leave this journey'}</Text>
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>
    )

    if (tabIndex === 1) return (
      <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
        <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
          {heatmapData.length > 0 && <CheckinHeatmap data={heatmapData} />}

          {/* You */}
          {myCheckins.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionHeaderText, { color: colors.textMuted }]}>You</Text>
                <Text style={[styles.sectionHeaderCount, { color: colors.textMuted }]}>{myCheckins.length}</Text>
              </View>
              {myCheckins.map(c => (
                <View key={c.id}>
                  <CheckinCard item={c} currentUserId={user?.id} onVerify={handleVerify} onFlag={handleFlag} canVerify={canVerifyToday} />
                  {c.flag_count >= 3 && (
                    <View style={[styles.flagWarning, { backgroundColor: colors.accent + '15', borderColor: colors.accent + '40' }]}>
                      <Ionicons name="warning-outline" size={14} color={colors.accent} />
                      <Text style={[styles.flagWarningText, { color: colors.accent }]}>Flagged by majority</Text>
                    </View>
                  )}
                </View>
              ))}
            </>
          )}

          {/* Others */}
          {otherCheckins.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionHeaderText, { color: colors.textMuted }]}>Others</Text>
                <Text style={[styles.sectionHeaderCount, { color: colors.textMuted }]}>{otherCheckins.length}</Text>
              </View>
              {otherCheckins.map(c => (
                <View key={c.id}>
                  <CheckinCard item={c} currentUserId={user?.id} onVerify={handleVerify} onFlag={handleFlag} canVerify={canVerifyToday} />
                  {c.flag_count >= 3 && (
                    <View style={[styles.flagWarning, { backgroundColor: colors.accent + '15', borderColor: colors.accent + '40' }]}>
                      <Ionicons name="warning-outline" size={14} color={colors.accent} />
                      <Text style={[styles.flagWarningText, { color: colors.accent }]}>Flagged by majority</Text>
                    </View>
                  )}
                </View>
              ))}
            </>
          )}

          {/* Missed */}
          {missedDays.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionHeaderText, { color: colors.danger }]}>Missed</Text>
                <Text style={[styles.sectionHeaderCount, { color: colors.danger }]}>{missedDays.length}</Text>
              </View>
              {missedDays.map(({ id, date }) => {
                const d = new Date(date + 'T12:00:00')
                const label = d.toLocaleDateString('en-GB', { weekday: 'long', month: 'short', day: 'numeric' })
                return (
                  <View key={id} style={[styles.missedCard, { backgroundColor: colors.danger + '0D', borderColor: colors.danger + '25' }]}>
                    <View style={[styles.missedIcon, { backgroundColor: colors.danger + '1A' }]}>
                      <Ionicons name="close" size={14} color={colors.danger} />
                    </View>
                    <View>
                      <Text style={[styles.missedDate, { color: colors.textPrimary }]}>{label}</Text>
                      <Text style={[styles.missedLabel, { color: colors.danger }]}>No check-in</Text>
                    </View>
                  </View>
                )
              })}
            </>
          )}

          {myCheckins.length === 0 && otherCheckins.length === 0 && (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>No check-ins yet.</Text>
          )}
          <View style={{ height: 80 }} />
        </ScrollView>
        {journey.status === 'active' && (
          checkedInToday ? (
            <View style={[styles.checkinFab, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.success, flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={[styles.checkinFabText, { color: colors.success }]}>Checked in today</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.checkinFab} onPress={() => router.push(`/checkin/${journey.id}`)} activeOpacity={0.85}>
              <Text style={styles.checkinFabText}>+ Check in</Text>
            </TouchableOpacity>
          )
        )}
      </View>
    )

    if (tabIndex === 2) return (
      <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
        {isChatEnded && (
          <View style={[styles.chatEndedBanner, { backgroundColor: colors.surfaceAlt, borderBottomColor: colors.border }]}>
            <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
            <Text style={[styles.chatEndedText, { color: colors.textMuted }]}>This journey has ended. The chat will be cleared in 7 days.</Text>
          </View>
        )}
        <FlatList
          ref={chatListRef}
          data={messages}
          keyExtractor={m => m.id}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingVertical: 12 }}
          onLayout={() => chatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={() => (
            <View style={styles.chatEmpty}>
              <Text style={[styles.chatEmptyText, { color: colors.textMuted }]}>No messages yet. Say hello to your group.</Text>
            </View>
          )}
          renderItem={({ item, index }) => {
            const isOwn = item.sender_id === user?.id
            const prevSender = index > 0 ? messages[index - 1].sender_id : null
            const prevTime = index > 0 ? new Date(messages[index - 1].created_at).getTime() : 0
            const thisTime = new Date(item.created_at).getTime()
            const showTimestamp = index === 0 || (thisTime - prevTime) > 10 * 60 * 1000
            return <ChatBubble message={item} isOwn={isOwn} showAvatar={!isOwn && prevSender !== item.sender_id} showTimestamp={showTimestamp} onEdit={handleEditMessage} onDelete={handleDeleteMessage} />
          }}
        />
        <View style={[styles.chatInputWrap, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.chatTextInput, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.textPrimary }]}
            value={chatInput}
            onChangeText={setChatInput}
            placeholder={isChatEnded ? 'Chat is closed' : 'Say something...'}
            placeholderTextColor={colors.textMuted}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
            editable={!isChatEnded}
          />
          <TouchableOpacity style={[styles.sendBtn, { backgroundColor: isChatEnded ? colors.border : colors.accent, opacity: sending ? 0.6 : 1 }]} onPress={sendMessage} activeOpacity={0.8} disabled={isChatEnded || sending}>
            <Ionicons name="send" size={16} color={isChatEnded ? colors.textMuted : colors.bg} />
          </TouchableOpacity>
        </View>
      </View>
    )

    if (tabIndex === 3) return (
      <ScrollView style={{ width: SCREEN_WIDTH }} contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
        {flatMembers.map(m => <MemberRow key={m.user_id} member={m} daysElapsed={journey.days_elapsed ?? 0} />)}
        <TouchableOpacity style={styles.inviteBtn} onPress={inviteFriend}>
          <Text style={styles.inviteBtnText}>Invite a friend →</Text>
        </TouchableOpacity>
      </ScrollView>
    )

    return null
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      {/* Hero: cover image fills background; back/more float at top; title pinned to bottom */}
      <View style={[styles.hero, journey.cover_image_url ? styles.heroTall : null]}>
        {journey.cover_image_url ? (
          <Image source={{ uri: journey.cover_image_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : null}
        {journey.cover_image_url ? <View style={[StyleSheet.absoluteFill, styles.coverScrim]} /> : null}

        <View style={styles.heroTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.navBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color={journey.cover_image_url ? '#fff' : colors.textSecondary} />
          </TouchableOpacity>
          {['open', 'active'].includes(journey.status) ? (
            <TouchableOpacity onPress={() => setAbandonModalVisible(true)} style={styles.navBtn} activeOpacity={0.7}>
              <Ionicons name="ellipsis-horizontal" size={18} color={journey.cover_image_url ? '#fff' : colors.textSecondary} />
            </TouchableOpacity>
          ) : <View style={{ width: 36 }} />}
        </View>

        <View style={styles.heroContent}>
          <View style={styles.heroBadges}>
            <View style={styles.catBadge}><Text style={styles.catText}>{journey.category}</Text></View>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: journey.status === 'active' ? colors.success : colors.accent }]} />
              <Text style={[styles.statusText, { color: journey.status === 'active' ? colors.success : colors.accent }]}>{journey.status}</Text>
            </View>
          </View>
          <Text style={[styles.heroTitle, journey.cover_image_url && { color: '#fff' }]}>{journey.title}</Text>
        </View>
      </View>

      <View style={styles.tabStrip}>
        {TABS.map((tab, i) => (
          <TouchableOpacity key={tab} style={[styles.tabBtn, activeTab === i && styles.tabBtnActive]} onPress={() => goToTab(i)} activeOpacity={0.75}>
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Modal visible={abandonModalVisible} transparent animationType="fade" onRequestClose={() => setAbandonModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalPercent, { color: colors.accent }]}>{completionPercent}%</Text>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              You've done {completionPercent}% of this journey
            </Text>
            {FEATURES.STAKE_DEPOSITS && encouragement ? (
              <Text style={[styles.modalEncouragement, { color: colors.success }]}>{encouragement}</Text>
            ) : null}
            {FEATURES.STAKE_DEPOSITS && stake > 0 ? (
              <>
                <Text style={[styles.modalRefundLine, { color: colors.textSecondary }]}>
                  {refundPercent > 0
                    ? `You'll receive ₦${refundAmount.toLocaleString()} back (${refundPercent}% refund).`
                    : `You will lose your full ₦${stake.toLocaleString()} deposit.`}
                </Text>
                {lossAmount > 0 && <Text style={[styles.modalLossLine, { color: colors.danger }]}>₦{lossAmount.toLocaleString()} will be forfeited to Vouch.</Text>}
              </>
            ) : (
              <Text style={[styles.modalBody, { color: colors.textSecondary }]}>
                Are you sure you want to leave? Your progress and streak will end.
              </Text>
            )}
            <Text style={[styles.modalBodySmall, { color: colors.textMuted }]}>Your partner and group are counting on you.</Text>
            <TouchableOpacity style={[styles.keepGoingBtn, { backgroundColor: colors.accent }]} onPress={() => setAbandonModalVisible(false)} activeOpacity={0.85}>
              <Text style={[styles.keepGoingBtnText, { color: colors.bg }]}>Keep going</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLeave} style={{ paddingVertical: 10, alignItems: 'center' }} activeOpacity={0.7}>
              <Text style={[styles.modalCancelText, { color: colors.textMuted }]}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <FlatList
        ref={pagerRef}
        data={[0, 1, 2, 3]}
        keyExtractor={i => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onScrollEnd}
        renderItem={renderTab}
        style={{ flex: 1 }}
        getItemLayout={(_, index) => ({ length: SCREEN_WIDTH, offset: SCREEN_WIDTH * index, index })}
      />
      </KeyboardAvoidingView>
    </SafeAreaView>
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
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      justifyContent: 'space-between',
      gap: 8,
    },
    heroTall: { height: 220 },
    coverScrim: { backgroundColor: 'rgba(0,0,0,0.45)' },
    heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    navBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.30)', alignItems: 'center', justifyContent: 'center' },
    heroContent: { gap: 6 },
    heroBadges: { flexDirection: 'row', gap: 8 },
    catBadge: { backgroundColor: 'rgba(232,168,56,0.12)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    catText: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.accent },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontFamily: fonts.body, fontSize: 11 },
    heroTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.textPrimary, lineHeight: 28 },
    tabStrip: { flexDirection: 'row', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabBtnActive: { borderBottomColor: colors.accent },
    tabText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted },
    tabTextActive: { color: colors.accent },
    tabContent: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    description: { fontFamily: fonts.body, fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
    sectionTitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.textPrimary, marginTop: 4 },
    startBtn: { backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    startBtnText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.bg },
    milestoneRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    milestoneLocked: { opacity: 0.45 },
    milestoneIcon: { width: 30, height: 30, borderRadius: 8, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
    milestoneIconUnlocked: { backgroundColor: 'rgba(232,168,56,0.15)' },
    milestoneTitle: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textPrimary },
    milestoneDesc: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginTop: 2 },
    reflectBtn: { backgroundColor: colors.accent, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
    reflectText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.bg },
    memberChip: { alignItems: 'center', gap: 6, width: 70 },
    memberChipName: { fontFamily: fonts.body, fontSize: 11, color: colors.textSecondary },
    memberChipStreak: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.accent },
    inviteBtn: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingVertical: 12, alignItems: 'center', borderStyle: 'dashed' },
    inviteBtnText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textSecondary },
    emptyText: { fontFamily: fonts.body, fontSize: 14, textAlign: 'center', paddingVertical: spacing.md },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, marginTop: 4 },
    sectionHeaderText: { fontFamily: fonts.bodyMedium, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6 },
    sectionHeaderCount: { fontFamily: fonts.bodyMedium, fontSize: 11 },
    missedCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
    missedIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    missedDate: { fontFamily: fonts.bodyMedium, fontSize: 13 },
    missedLabel: { fontFamily: fonts.body, fontSize: 11, marginTop: 1 },
    flagWarning: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, marginTop: 4, marginBottom: 8 },
    flagWarningText: { fontFamily: fonts.bodyMedium, fontSize: 12 },
    checkinFab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: colors.accent, borderRadius: 24, paddingHorizontal: 20, paddingVertical: 12, shadowColor: colors.accent, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
    checkinFabText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.bg },
    chatEndedBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderBottomWidth: 1 },
    chatEndedText: { flex: 1, fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
    chatInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderTopWidth: 1 },
    chatTextInput: { flex: 1, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, fontFamily: fonts.body, borderWidth: 1 },
    sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    shareRow: { gap: 10 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
    modalBox: { width: '100%', borderRadius: 20, borderWidth: 1, padding: spacing.lg, gap: 12 },
    modalPercent: { fontFamily: fonts.display, fontSize: 52, textAlign: 'center', lineHeight: 58 },
    modalTitle: { fontFamily: fonts.display, fontSize: 20, textAlign: 'center', lineHeight: 26 },
    modalEncouragement: { fontFamily: fonts.bodyMedium, fontSize: 13, textAlign: 'center', lineHeight: 18 },
    modalRefundLine: { fontFamily: fonts.body, fontSize: 14, textAlign: 'center', lineHeight: 20 },
    modalLossLine: { fontFamily: fonts.bodyBold, fontSize: 14, textAlign: 'center' },
    modalBody: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21, textAlign: 'center' },
    modalBodySmall: { fontFamily: fonts.body, fontSize: 12, textAlign: 'center' },
    keepGoingBtn: { borderRadius: 12, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
    keepGoingBtnText: { fontFamily: fonts.bodyBold, fontSize: 16 },
    modalCancelText: { fontFamily: fonts.body, fontSize: 13, textAlign: 'center' },
    leaveBtn: { marginTop: spacing.md, borderWidth: 1, borderColor: colors.danger, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    leaveBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    leaveBtnText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.danger },
    chatEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 32 },
    chatEmptyText: { fontFamily: fonts.body, fontSize: 14, fontStyle: 'italic', textAlign: 'center', lineHeight: 20 },
  })
}
