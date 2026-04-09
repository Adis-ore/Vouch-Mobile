import { useState, useMemo } from 'react'
import { View, Text, TextInput, TouchableOpacity, FlatList, Modal, ScrollView, ActivityIndicator, StyleSheet, Dimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import { fonts } from '../../constants/fonts'
import { spacing } from '../../constants/spacing'
import { useTheme } from '../../context/ThemeContext'
import { useUser } from '../../context/UserContext'
import { DISCOVER_JOURNEYS, CATEGORIES, ACTIVE_JOURNEYS } from '../../data/dummy'
import JourneyCard from '../../components/journey/JourneyCard'
import CategoryChip from '../../components/shared/CategoryChip'
import EmptyState from '../../components/shared/EmptyState'
import PlansModal, { getPlanLimit } from '../../components/shared/PlansModal'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

const ALL_CATS = ['All', ...CATEGORIES.map(c => typeof c === 'string' ? c : c.label)]

export default function Discover() {
  const { colors } = useTheme()
  const { user, updateUser } = useUser()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [scope, setScope] = useState('nearby')
  const [joinedIds, setJoinedIds] = useState([])

  // Bottom sheet state
  const [selectedJourney, setSelectedJourney] = useState(null)
  const [sheetVisible, setSheetVisible] = useState(false)

  // Payment state
  const [paymentVisible, setPaymentVisible] = useState(false)
  const [paying, setPaying] = useState(false)
  const [paymentDone, setPaymentDone] = useState(false)

  // Plans modal state
  const [plansVisible, setPlansVisible] = useState(false)

  const activeCount = ACTIVE_JOURNEYS.length + joinedIds.length

  const filtered = useMemo(() => {
    let list = DISCOVER_JOURNEYS.filter(j => !joinedIds.includes(j.id))
    if (category !== 'All') list = list.filter(j => j.category === category)
    if (scope === 'nearby') list = list.filter(j => j.country === 'Nigeria')
    if (search.trim()) list = list.filter(j => j.title.toLowerCase().includes(search.toLowerCase()))
    return list
  }, [search, category, scope, joinedIds])

  const openJourney = (journey) => {
    setSelectedJourney(journey)
    setSheetVisible(true)
    setPaymentDone(false)
  }

  const continueToJoin = () => {
    const limit = getPlanLimit(user?.plan ?? 'free')
    if (activeCount >= limit) {
      setSheetVisible(false)
      setPlansVisible(true)
      return
    }
    if (selectedJourney.stake_amount > 0) {
      setSheetVisible(false)
      setPaymentVisible(true)
    } else {
      completeJoin()
    }
  }

  const completeJoin = () => {
    setJoinedIds(prev => [...prev, selectedJourney.id])
    setSheetVisible(false)
    setPaymentVisible(false)
    setPaymentDone(false)
    setSelectedJourney(null)
  }

  const handlePay = async () => {
    setPaying(true)
    await new Promise(r => setTimeout(r, 1500))
    setPaying(false)
    setPaymentDone(true)
    setTimeout(() => completeJoin(), 800)
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <JourneyCard journey={item} index={index} onJoin={() => openJourney(item)} />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState title="No journeys found" body="Try different filters or create your own journey." />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.screenTitle}>Discover</Text>
            <View style={styles.searchWrap}>
              <Ionicons name="search-outline" size={18} color={colors.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: colors.textPrimary }]}
                value={search}
                onChangeText={setSearch}
                placeholder="Search journeys..."
                placeholderTextColor={colors.textMuted}
              />
            </View>
            <FlatList
              horizontal
              data={ALL_CATS}
              keyExtractor={c => c}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
              renderItem={({ item }) => (
                <CategoryChip label={item} selected={category === item} onPress={() => setCategory(item)} size="sm" />
              )}
            />
            <View style={styles.toggle}>
              {['nearby', 'everywhere'].map(s => (
                <TouchableOpacity key={s} style={[styles.toggleBtn, scope === s && { backgroundColor: colors.accent }]} onPress={() => setScope(s)} activeOpacity={0.75}>
                  <Text style={[styles.toggleText, { color: scope === s ? colors.bg : colors.textMuted }]}>
                    {s === 'nearby' ? 'Nearby' : 'Everywhere'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
      />

      {/* Join Bottom Sheet */}
      <Modal visible={sheetVisible} transparent animationType="slide" onRequestClose={() => setSheetVisible(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setSheetVisible(false)} />
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {selectedJourney && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetCatRow}>
                <View style={[styles.catBadge, { backgroundColor: colors.accent + '15' }]}>
                  <Text style={[styles.catText, { color: colors.accent }]}>{selectedJourney.category}</Text>
                </View>
                <Text style={[styles.sheetDuration, { color: colors.textMuted }]}>{selectedJourney.duration_days} days</Text>
              </View>
              <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>{selectedJourney.title}</Text>
              <Text style={[styles.sheetDesc, { color: colors.textSecondary }]}>{selectedJourney.description}</Text>

              <View style={[styles.sheetInfoRow, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <InfoCell icon="people-outline" label="Members" value={`${selectedJourney.current_participants}/${selectedJourney.max_participants}`} colors={colors} />
                <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />
                <InfoCell icon="calendar-outline" label="Duration" value={`${selectedJourney.duration_days}d`} colors={colors} />
                <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />
                <InfoCell
                  icon="wallet-outline"
                  label="Stake"
                  value={selectedJourney.stake_amount > 0 ? `₦${selectedJourney.stake_amount.toLocaleString()}` : 'Free'}
                  colors={colors}
                />
              </View>

              <View style={[styles.creatorRow, { backgroundColor: colors.surfaceAlt, borderRadius: 10, padding: 12 }]}>
                <Ionicons name="person-circle-outline" size={20} color={colors.textMuted} />
                <Text style={[styles.creatorText, { color: colors.textSecondary }]}>
                  Created by <Text style={{ color: colors.textPrimary, fontFamily: fonts.bodyBold }}>{selectedJourney.creator?.full_name}</Text>
                  {' '}· {selectedJourney.creator?.reputation_score}% rep
                </Text>
              </View>

              {selectedJourney.stake_amount > 0 && (
                <View style={[styles.stakeNote, { backgroundColor: colors.accent + '10', borderColor: colors.accent + '30' }]}>
                  <Ionicons name="information-circle-outline" size={15} color={colors.accent} />
                  <Text style={[styles.stakeNoteText, { color: colors.textSecondary }]}>
                    A deposit of <Text style={{ color: colors.accent, fontFamily: fonts.bodyBold }}>₦{selectedJourney.stake_amount.toLocaleString()}</Text> is required. Complete the journey and get it back. Abandon it and it goes to Vouch.
                  </Text>
                </View>
              )}

              <TouchableOpacity style={[styles.continueBtn, { backgroundColor: colors.accent }]} onPress={continueToJoin} activeOpacity={0.85}>
                <Text style={[styles.continueBtnText, { color: colors.bg }]}>Continue to join</Text>
              </TouchableOpacity>
              <View style={{ height: 8 }} />
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Payment Modal */}
      <Modal visible={paymentVisible} transparent animationType="slide" onRequestClose={() => setPaymentVisible(false)}>
        <View style={styles.overlay} />
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sheetHandle} />
          <View style={{ alignItems: 'center', gap: spacing.md, padding: spacing.sm }}>
            <View style={[styles.payIcon, { backgroundColor: colors.accent + '15' }]}>
              <Ionicons name="wallet-outline" size={28} color={colors.accent} />
            </View>
            <Text style={[styles.payTitle, { color: colors.textPrimary }]}>Security deposit</Text>
            <Text style={[styles.paySubtitle, { color: colors.textSecondary }]}>
              This deposit is held in escrow. Complete the journey and it's returned to you in full.
            </Text>
            <Text style={[styles.payAmount, { color: colors.accent }]}>
              ₦{selectedJourney?.stake_amount?.toLocaleString()}
            </Text>

            {paymentDone ? (
              <View style={styles.paySuccessRow}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                <Text style={[styles.paySuccessText, { color: colors.success }]}>Payment confirmed!</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.continueBtn, { backgroundColor: colors.accent, width: '100%' }]}
                onPress={handlePay}
                disabled={paying}
                activeOpacity={0.85}
              >
                {paying
                  ? <ActivityIndicator color={colors.bg} />
                  : <Text style={[styles.continueBtnText, { color: colors.bg }]}>Pay ₦{selectedJourney?.stake_amount?.toLocaleString()}</Text>
                }
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => setPaymentVisible(false)}>
              <Text style={[styles.cancelText, { color: colors.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <PlansModal visible={plansVisible} onClose={() => setPlansVisible(false)} />
    </SafeAreaView>
  )
}

function InfoCell({ icon, label, value, colors }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
      <Ionicons name={icon} size={16} color={colors.textMuted} />
      <Text style={{ fontFamily: fonts.body, fontSize: 11, color: colors.textMuted }}>{label}</Text>
      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: colors.textPrimary }}>{value}</Text>
    </View>
  )
}

function makeStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    list: { padding: spacing.lg, paddingBottom: spacing.xxl },
    header: { gap: spacing.md, marginBottom: spacing.md },
    screenTitle: { fontFamily: fonts.display, fontSize: 28, color: colors.textPrimary },
    searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: 12, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, height: 46, gap: 8 },
    searchInput: { flex: 1, fontFamily: fonts.body, fontSize: 15 },
    toggle: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: 10, padding: 3, borderWidth: 1, borderColor: colors.border, alignSelf: 'flex-start' },
    toggleBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8 },
    toggleText: { fontFamily: fonts.bodyMedium, fontSize: 13 },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
    sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, maxHeight: SCREEN_HEIGHT * 0.85, padding: spacing.lg, paddingTop: spacing.sm },
    sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.sm },
    sheetCatRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    catBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    catText: { fontFamily: fonts.bodyMedium, fontSize: 11 },
    sheetDuration: { fontFamily: fonts.body, fontSize: 13 },
    sheetTitle: { fontFamily: fonts.display, fontSize: 24, lineHeight: 30 },
    sheetDesc: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21 },
    sheetInfoRow: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, paddingVertical: 14 },
    infoDivider: { width: 1, marginVertical: 4 },
    creatorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    creatorText: { flex: 1, fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
    stakeNote: { flexDirection: 'row', gap: 8, borderRadius: 10, borderWidth: 1, padding: 12, alignItems: 'flex-start' },
    stakeNoteText: { flex: 1, fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
    continueBtn: { borderRadius: 12, height: 50, alignItems: 'center', justifyContent: 'center' },
    continueBtnText: { fontFamily: fonts.bodyBold, fontSize: 16 },
    payIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
    payTitle: { fontFamily: fonts.display, fontSize: 22 },
    paySubtitle: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, textAlign: 'center' },
    payAmount: { fontFamily: fonts.display, fontSize: 36 },
    paySuccessRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    paySuccessText: { fontFamily: fonts.bodyBold, fontSize: 15 },
    cancelText: { fontFamily: fonts.body, fontSize: 14, textAlign: 'center', paddingVertical: 8 },
  })
}
