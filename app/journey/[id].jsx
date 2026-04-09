import { useState, useRef, useMemo } from 'react'
import { View, Text, TouchableOpacity, ScrollView, FlatList, TextInput, KeyboardAvoidingView, Platform, Dimensions, StyleSheet, Share, Modal, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { fonts } from '../../constants/fonts'
import { spacing } from '../../constants/spacing'
import { useTheme } from '../../context/ThemeContext'
import { ACTIVE_JOURNEY, JOURNEY_MEMBERS, MILESTONES, CHECKINS, MESSAGES, CHECKIN_HEATMAP, CURRENT_USER } from '../../data/dummy'
import ProgressBar from '../../components/journey/ProgressBar'
import MemberRow from '../../components/journey/MemberRow'
import CheckinCard from '../../components/journey/CheckinCard'
import CheckinHeatmap from '../../components/journey/CheckinHeatmap'
import ChatBubble from '../../components/journey/ChatBubble'
import StakeCard from '../../components/shared/StakeCard'
import Avatar from '../../components/shared/Avatar'
import ShareCardButton from '../../components/shared/ShareCard'

const TABS = ['Overview', 'Check-ins', 'Chat', 'Members']
const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function JourneyDetail() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const journey = ACTIVE_JOURNEY
  const [activeTab, setActiveTab] = useState(0)
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState(MESSAGES)
  const [checkinFilter, setCheckinFilter] = useState('All')
  const [abandonModalVisible, setAbandonModalVisible] = useState(false)
  const [checkins, setCheckins] = useState(
    CHECKINS.map(c => ({ ...c, votes: {} })) // votes: { userId: 'approve' | 'flag' }
  )
  const pagerRef = useRef(null)
  const chatListRef = useRef(null)

  const isChatEnded = journey.status !== 'active'

  const goToTab = (index) => {
    setActiveTab(index)
    pagerRef.current?.scrollToIndex({ index, animated: true })
  }

  const onScrollEnd = (e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
    setActiveTab(index)
  }

  const sendMessage = () => {
    if (!chatInput.trim() || isChatEnded) return
    setMessages(prev => [...prev, {
      id: `msg-${Date.now()}`,
      sender_id: CURRENT_USER.id,
      content: chatInput.trim(),
      type: 'text',
      created_at: new Date().toISOString(),
      user: { full_name: CURRENT_USER.full_name },
    }])
    setChatInput('')
    setTimeout(() => chatListRef.current?.scrollToEnd({ animated: true }), 100)
  }

  const voteCheckin = (checkinId, vote) => {
    setCheckins(prev => prev.map(c => {
      if (c.id !== checkinId) return c
      if (c.votes[CURRENT_USER.id]) return c // already voted
      return { ...c, votes: { ...c.votes, [CURRENT_USER.id]: vote } }
    }))
  }

  const filteredCheckins = checkins.filter(c => {
    if (checkinFilter === 'Mine') return c.user_id === CURRENT_USER.id
    if (checkinFilter === 'Unverified') return Object.keys(c.votes).length === 0
    return true
  })

  const inviteFriend = async () => {
    try {
      await Share.share({
        message: `Join me on Vouch! I'm working on "${journey.title}". Join here: https://vouch.app/journey/${journey.id}`,
        title: 'Join my journey on Vouch',
      })
    } catch (_) {}
  }

  const renderTab = ({ item: tabIndex }) => {
    if (tabIndex === 0) return (
      <ScrollView style={{ width: SCREEN_WIDTH }} contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.description}>{journey.description}</Text>
        <ProgressBar percent={journey.progress_percent} daysElapsed={journey.days_elapsed} durationDays={journey.duration_days} />
        <StakeCard amount={journey.stake_amount} currency={journey.stake_currency} progressPercent={journey.progress_percent} />
        <Text style={styles.sectionTitle}>Milestones</Text>
        {MILESTONES.map(m => (
          <View key={m.id} style={[styles.milestoneRow, !m.is_unlocked && styles.milestoneLocked]}>
            <View style={[styles.milestoneIcon, m.is_unlocked && styles.milestoneIconUnlocked]}>
              <Ionicons name={m.is_unlocked ? 'diamond' : 'diamond-outline'} size={12} color={m.is_unlocked ? colors.accent : colors.textMuted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.milestoneTitle, !m.is_unlocked && { color: colors.textMuted }]}>Week {m.week_number}: {m.title}</Text>
              <Text style={styles.milestoneDesc} numberOfLines={1}>{m.description}</Text>
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
          {JOURNEY_MEMBERS.map(m => (
            <View key={m.user_id} style={styles.memberChip}>
              <Avatar name={m.full_name} size={36} />
              <Text style={styles.memberChipName}>{m.full_name.split(' ')[0]}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Ionicons name="flame" size={11} color={colors.accent} />
                <Text style={styles.memberChipStreak}>{m.current_streak}d</Text>
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
              userName={CURRENT_USER.full_name}
              journeyTitle={journey.title}
              label="Share completion card"
            />
          </View>
        )}
      </ScrollView>
    )

    if (tabIndex === 1) return (
      <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
        <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
          <CheckinHeatmap data={CHECKIN_HEATMAP} />
          <View style={styles.filterChips}>
            {['All', 'Mine', 'Unverified'].map(f => (
              <TouchableOpacity key={f} style={[styles.filterChip, checkinFilter === f && styles.filterChipActive]} onPress={() => setCheckinFilter(f)}>
                <Text style={[styles.filterChipText, checkinFilter === f && { color: colors.accent }]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {filteredCheckins.map(c => {
            const approveCount = Object.values(c.votes).filter(v => v === 'approve').length
            const flagCount = Object.values(c.votes).filter(v => v === 'flag').length
            const myVote = c.votes[CURRENT_USER.id]
            const majorityFlagged = flagCount > 0 && flagCount > approveCount
            return (
              <View key={c.id}>
                <CheckinCard item={c} currentUserId={CURRENT_USER.id} />
                {majorityFlagged && (
                  <View style={[styles.flagWarning, { backgroundColor: colors.accent + '15', borderColor: colors.accent + '40' }]}>
                    <Ionicons name="warning-outline" size={14} color={colors.accent} />
                    <Text style={[styles.flagWarningText, { color: colors.accent }]}>Flagged by majority</Text>
                  </View>
                )}
                <View style={styles.voteRow}>
                  {myVote ? (
                    <Text style={[styles.votedText, { color: colors.textMuted }]}>
                      You {myVote === 'approve' ? 'approved' : 'flagged'} · {approveCount} approved · {flagCount} flagged
                    </Text>
                  ) : c.user_id !== CURRENT_USER.id ? (
                    <>
                      <TouchableOpacity style={[styles.voteBtn, { borderColor: colors.success, backgroundColor: colors.success + '15' }]} onPress={() => voteCheckin(c.id, 'approve')}>
                        <Ionicons name="checkmark" size={14} color={colors.success} />
                        <Text style={[styles.voteBtnText, { color: colors.success }]}>Approve {approveCount > 0 ? `(${approveCount})` : ''}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.voteBtn, { borderColor: colors.danger, backgroundColor: colors.danger + '15' }]} onPress={() => voteCheckin(c.id, 'flag')}>
                        <Ionicons name="flag-outline" size={14} color={colors.danger} />
                        <Text style={[styles.voteBtnText, { color: colors.danger }]}>Flag {flagCount > 0 ? `(${flagCount})` : ''}</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <Text style={[styles.votedText, { color: colors.textMuted }]}>{approveCount} approved · {flagCount} flagged</Text>
                  )}
                </View>
              </View>
            )
          })}
          <View style={{ height: 80 }} />
        </ScrollView>
        <TouchableOpacity style={styles.checkinFab} onPress={() => router.push(`/checkin/${journey.id}`)} activeOpacity={0.85}>
          <Text style={styles.checkinFabText}>+ Check in</Text>
        </TouchableOpacity>
      </View>
    )

    if (tabIndex === 2) return (
      <KeyboardAvoidingView style={{ width: SCREEN_WIDTH, flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={120}>
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
          contentContainerStyle={{ paddingVertical: 12 }}
          onLayout={() => chatListRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item, index }) => {
            const isOwn = item.sender_id === CURRENT_USER.id
            const prevSender = index > 0 ? messages[index - 1].sender_id : null
            return <ChatBubble message={item} isOwn={isOwn} showAvatar={!isOwn && prevSender !== item.sender_id} />
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
          <TouchableOpacity style={[styles.sendBtn, { backgroundColor: isChatEnded ? colors.border : colors.accent }]} onPress={sendMessage} activeOpacity={0.8} disabled={isChatEnded}>
            <Ionicons name="send" size={16} color={isChatEnded ? colors.textMuted : colors.bg} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    )

    if (tabIndex === 3) return (
      <ScrollView style={{ width: SCREEN_WIDTH }} contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
        {JOURNEY_MEMBERS.map(m => <MemberRow key={m.user_id} member={m} daysElapsed={journey.days_elapsed} />)}
        <TouchableOpacity style={styles.inviteBtn} onPress={inviteFriend}>
          <Text style={styles.inviteBtnText}>Invite a friend →</Text>
        </TouchableOpacity>
      </ScrollView>
    )

    return null
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setAbandonModalVisible(true)} style={styles.moreBtn} activeOpacity={0.7}>
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={styles.heroContent}>
          <View style={styles.heroBadges}>
            <View style={styles.catBadge}><Text style={styles.catText}>{journey.category}</Text></View>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>{journey.status}</Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>{journey.title}</Text>
        </View>
      </View>

      <View style={styles.tabStrip}>
        {TABS.map((tab, i) => (
          <TouchableOpacity key={tab} style={[styles.tabBtn, activeTab === i && styles.tabBtnActive]} onPress={() => goToTab(i)} activeOpacity={0.75}>
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Abandon modal — smart, context-aware */}
      <Modal visible={abandonModalVisible} transparent animationType="fade" onRequestClose={() => setAbandonModalVisible(false)}>
        <View style={styles.modalOverlay}>
          {(() => {
            const member = JOURNEY_MEMBERS.find(m => m.user_id === CURRENT_USER.id)
            const completionPercent = Math.round(((member?.total_checkins ?? journey.days_elapsed) / journey.duration_days) * 100)
            const stake = journey.stake_amount

            let refundPercent = 0
            if (completionPercent >= 100) refundPercent = 100
            else if (completionPercent >= 90) refundPercent = 95
            else if (completionPercent >= 75) refundPercent = 75

            const refundAmount = Math.round((refundPercent / 100) * stake)
            const lossAmount = stake - refundAmount

            let encouragement = ''
            if (completionPercent >= 85 && completionPercent < 90) {
              encouragement = `You're ${90 - completionPercent}% away from getting 95% back (₦${Math.round(stake * 0.95).toLocaleString()}).`
            } else if (completionPercent >= 70 && completionPercent < 75) {
              encouragement = `Just ${75 - completionPercent}% more and you'll recover ₦${Math.round(stake * 0.75).toLocaleString()}.`
            }

            const confirmLabel = stake > 0
              ? `Abandon and ${refundPercent > 0 ? `receive ₦${refundAmount.toLocaleString()}` : 'lose deposit'}`
              : 'Yes, abandon'

            return (
              <View style={[styles.modalBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.modalPercent, { color: colors.accent }]}>{completionPercent}%</Text>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  {stake > 0
                    ? `You've completed ${completionPercent}% of this journey`
                    : `You've done ${completionPercent}% of this journey`}
                </Text>

                {encouragement ? (
                  <Text style={[styles.modalEncouragement, { color: colors.success }]}>{encouragement}</Text>
                ) : null}

                {stake > 0 ? (
                  <>
                    <Text style={[styles.modalRefundLine, { color: colors.textSecondary }]}>
                      {refundPercent > 0
                        ? `You'll receive ₦${refundAmount.toLocaleString()} back (${refundPercent}% refund).`
                        : `You will lose your full ₦${stake.toLocaleString()} deposit.`}
                    </Text>
                    {lossAmount > 0 && (
                      <Text style={[styles.modalLossLine, { color: colors.danger }]}>
                        ₦{lossAmount.toLocaleString()} will be forfeited to Vouch.
                      </Text>
                    )}
                  </>
                ) : (
                  <Text style={[styles.modalBody, { color: colors.textSecondary }]}>
                    You're {100 - completionPercent}% away from finishing. Are you sure you want to stop now?
                  </Text>
                )}

                <Text style={[styles.modalBodySmall, { color: colors.textMuted }]}>Your partner and group are counting on you.</Text>

                <TouchableOpacity
                  style={[styles.keepGoingBtn, { backgroundColor: colors.accent }]}
                  onPress={() => setAbandonModalVisible(false)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.keepGoingBtnText, { color: colors.bg }]}>Keep going</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => { setAbandonModalVisible(false); router.replace('/(tabs)') }}
                  style={{ paddingVertical: 10, alignItems: 'center' }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.modalCancelText, { color: colors.textMuted }]}>{confirmLabel}</Text>
                </TouchableOpacity>
              </View>
            )
          })()}
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
    </SafeAreaView>
  )
}

function makeStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    hero: { backgroundColor: colors.surface, padding: spacing.lg, paddingTop: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 10 },
    heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { padding: 4 },
    moreBtn: { padding: 4 },
    heroContent: { gap: 8 },
    heroBadges: { flexDirection: 'row', gap: 8 },
    catBadge: { backgroundColor: 'rgba(232,168,56,0.12)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    catText: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.accent },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
    statusText: { fontFamily: fonts.body, fontSize: 11, color: colors.success },
    heroTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.textPrimary, lineHeight: 28 },
    tabStrip: { flexDirection: 'row', backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    tabBtnActive: { borderBottomColor: colors.accent },
    tabText: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted },
    tabTextActive: { color: colors.accent },
    tabContent: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    description: { fontFamily: fonts.body, fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
    sectionTitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.textPrimary, marginTop: 4 },
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
    filterChips: { flexDirection: 'row', gap: 8, marginBottom: 4 },
    filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceAlt },
    filterChipActive: { borderColor: colors.accent },
    filterChipText: { fontFamily: fonts.bodyMedium, fontSize: 12, color: colors.textMuted },
    voteRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, marginBottom: 12 },
    voteBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
    voteBtnText: { fontFamily: fonts.bodyMedium, fontSize: 12 },
    votedText: { fontFamily: fonts.body, fontSize: 12 },
    flagWarning: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, marginTop: 4 },
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
  })
}
