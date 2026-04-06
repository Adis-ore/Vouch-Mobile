import { useState, useRef, useMemo } from 'react'
import { View, Text, TouchableOpacity, ScrollView, FlatList, TextInput, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native'
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

const TABS = ['Overview', 'Members', 'Check-ins', 'Chat']

export default function JourneyDetail() {
  const { id } = useLocalSearchParams()
  const router = useRouter()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const journey = ACTIVE_JOURNEY
  const [activeTab, setActiveTab] = useState('Overview')
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState(MESSAGES)
  const [checkinFilter, setCheckinFilter] = useState('All')
  const flatListRef = useRef(null)

  const sendMessage = () => {
    if (!chatInput.trim()) return
    setMessages(prev => [...prev, { id: `msg-${Date.now()}`, sender_id: CURRENT_USER.id, content: chatInput.trim(), type: 'text', created_at: new Date().toISOString(), user: { full_name: CURRENT_USER.full_name } }])
    setChatInput('')
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)
  }

  const filteredCheckins = CHECKINS.filter(c => {
    if (checkinFilter === 'Mine') return c.user_id === CURRENT_USER.id
    if (checkinFilter === 'Unverified') return c.verified_count === 0
    return true
  })

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.hero}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
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
        {TABS.map(tab => (
          <TouchableOpacity key={tab} style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]} onPress={() => setActiveTab(tab)} activeOpacity={0.75}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'Overview' && (
        <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.description}>{journey.description}</Text>
          <ProgressBar percent={journey.progress_percent} daysElapsed={journey.days_elapsed} durationDays={journey.duration_days} />
          <StakeCard amount={journey.stake_amount} currency={journey.stake_currency} />

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

          <TouchableOpacity style={styles.inviteBtn}>
            <Text style={styles.inviteBtnText}>Invite a friend →</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {activeTab === 'Members' && (
        <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
          {JOURNEY_MEMBERS.map(m => <MemberRow key={m.user_id} member={m} daysElapsed={journey.days_elapsed} />)}
        </ScrollView>
      )}

      {activeTab === 'Check-ins' && (
        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
            <CheckinHeatmap data={CHECKIN_HEATMAP} />
            <View style={styles.filterChips}>
              {['All', 'Mine', 'Unverified'].map(f => (
                <TouchableOpacity key={f} style={[styles.filterChip, checkinFilter === f && styles.filterChipActive]} onPress={() => setCheckinFilter(f)}>
                  <Text style={[styles.filterChipText, checkinFilter === f && { color: colors.accent }]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {filteredCheckins.map(c => <CheckinCard key={c.id} item={c} currentUserId={CURRENT_USER.id} />)}
          </ScrollView>
          <TouchableOpacity style={styles.checkinFab} onPress={() => router.push(`/checkin/${journey.id}`)} activeOpacity={0.85}>
            <Text style={styles.checkinFabText}>+ Check in</Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'Chat' && (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={120}>
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={m => m.id}
            contentContainerStyle={{ paddingVertical: 12 }}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item, index }) => {
              const isOwn = item.sender_id === CURRENT_USER.id
              const prevSender = index > 0 ? messages[index - 1].sender_id : null
              return <ChatBubble message={item} isOwn={isOwn} showAvatar={!isOwn && prevSender !== item.sender_id} />
            }}
          />
          <View style={styles.chatInputWrap}>
            <TextInput style={styles.chatTextInput} value={chatInput} onChangeText={setChatInput} placeholder="Say something..." placeholderTextColor={colors.textMuted} onSubmitEditing={sendMessage} returnKeyType="send" />
            <TouchableOpacity style={styles.sendBtn} onPress={sendMessage} activeOpacity={0.8}>
              <Ionicons name="send" size={16} color={colors.bg} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  )
}

function makeStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    hero: { backgroundColor: colors.surface, padding: spacing.lg, paddingTop: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 10 },
    backBtn: { alignSelf: 'flex-start', padding: 4 },
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
    checkinFab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: colors.accent, borderRadius: 24, paddingHorizontal: 20, paddingVertical: 12, shadowColor: colors.accent, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
    checkinFabText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.bg },
    chatInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
    chatTextInput: { flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, fontFamily: fonts.body, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border },
    sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  })
}
