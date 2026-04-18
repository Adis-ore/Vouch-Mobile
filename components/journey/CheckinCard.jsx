import { useState } from 'react'
import { View, Text, TouchableOpacity, Image, StyleSheet, Modal, ScrollView, Pressable, Dimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../context/ThemeContext'
import { fonts } from '../../constants/fonts'
import Avatar from '../shared/Avatar'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

export default function CheckinCard({ item, currentUserId, onVerify, onFlag, canVerify = true }) {
  const { colors } = useTheme()
  const isOwn = item.user_id === currentUserId
  const [modalVisible, setModalVisible] = useState(false)

  // Permanent state: use server-returned my_verdict as default
  const [verdict, setVerdict] = useState(item.my_verdict || null)

  const MAX_CHARS = 120
  const isLong = item.note.length > MAX_CHARS
  const previewNote = isLong ? item.note.slice(0, MAX_CHARS) + '...' : item.note

  const handleVerify = () => {
    setVerdict('approve')
    onVerify?.(item.id)
    setModalVisible(false)
  }

  const handleFlag = () => {
    setVerdict('flag')
    onFlag?.(item.id)
    setModalVisible(false)
  }

  const showActions = !isOwn && !verdict && canVerify

  return (
    <>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.85}
      >
        <View style={styles.header}>
          <Avatar name={item.user.full_name} uri={item.user.avatar_url} avatarSeed={item.user.avatar_seed} avatarBg={item.user.avatar_bg} size={34} />
          <View style={styles.headerText}>
            <Text style={[styles.userName, { color: colors.textPrimary }]}>{item.user.full_name}</Text>
            <Text style={[styles.date, { color: colors.textMuted }]}>{item.checkin_date}</Text>
          </View>
          {item.verified_count > 0 && (
            <View style={[styles.verifiedBadge, { backgroundColor: colors.success + '18' }]}>
              <Ionicons name="checkmark-circle" size={13} color={colors.success} />
              <Text style={[styles.verifiedCount, { color: colors.success }]}>{item.verified_count}</Text>
            </View>
          )}
        </View>

        <Text style={[styles.note, { color: colors.textSecondary }]}>{previewNote}</Text>
        {isLong && <Text style={[styles.readMore, { color: colors.accent }]}>Read more</Text>}

        {item.proof_url && item.proof_type === 'image' && (
          <Image source={{ uri: item.proof_url }} style={styles.proof} resizeMode="cover" />
        )}

        {showActions && (
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.verifyBtn, { borderColor: colors.success + '50' }]} onPress={handleVerify} activeOpacity={0.8}>
              <Ionicons name="checkmark" size={14} color={colors.success} />
              <Text style={[styles.verifyText, { color: colors.success }]}>Looks real</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.flagBtn, { borderColor: colors.danger + '50' }]} onPress={handleFlag} activeOpacity={0.8}>
              <Ionicons name="flag-outline" size={14} color={colors.danger} />
              <Text style={[styles.flagText, { color: colors.danger }]}>Flag</Text>
            </TouchableOpacity>
          </View>
        )}
        {verdict === 'approve' && <Text style={[styles.statusMsg, { color: colors.success }]}>You verified this check-in</Text>}
        {verdict === 'flag' && <Text style={[styles.statusMsg, { color: colors.danger }]}>Flagged for review</Text>}
        {!isOwn && !verdict && !canVerify && (
          <Text style={[styles.statusMsg, { color: colors.textMuted }]}>Join earlier to verify check-ins</Text>
        )}
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setModalVisible(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border, maxHeight: SCREEN_HEIGHT * 0.75 }]} onPress={() => {}}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />

            <View style={styles.sheetHeader}>
              <Avatar name={item.user.full_name} uri={item.user.avatar_url} avatarSeed={item.user.avatar_seed} avatarBg={item.user.avatar_bg} size={40} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.sheetName, { color: colors.textPrimary }]}>{item.user.full_name}</Text>
                <Text style={[styles.sheetDate, { color: colors.textMuted }]}>{item.checkin_date}</Text>
              </View>
              {item.verified_count > 0 && (
                <View style={[styles.verifiedBadge, { backgroundColor: colors.success + '18' }]}>
                  <Ionicons name="checkmark-circle" size={13} color={colors.success} />
                  <Text style={[styles.verifiedCount, { color: colors.success }]}>{item.verified_count} verified</Text>
                </View>
              )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ flexShrink: 1 }}>
              <Text style={[styles.sheetNote, { color: colors.textSecondary }]}>{item.note}</Text>
              {item.proof_url && item.proof_type === 'image' && (
                <Image source={{ uri: item.proof_url }} style={styles.sheetProof} resizeMode="cover" />
              )}
              {item.next_step ? (
                <Text style={[styles.sheetNextStep, { color: colors.textMuted }]}>Next: {item.next_step}</Text>
              ) : null}
            </ScrollView>

            {showActions && (
              <View style={[styles.sheetActions, { borderTopColor: colors.border }]}>
                <TouchableOpacity style={[styles.sheetVerifyBtn, { backgroundColor: colors.success + '18', borderColor: colors.success + '40' }]} onPress={handleVerify} activeOpacity={0.85}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
                  <Text style={[styles.sheetVerifyText, { color: colors.success }]}>Looks real</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.sheetFlagBtn, { backgroundColor: colors.danger + '10', borderColor: colors.danger + '30' }]} onPress={handleFlag} activeOpacity={0.85}>
                  <Ionicons name="flag-outline" size={18} color={colors.danger} />
                  <Text style={[styles.sheetFlagText, { color: colors.danger }]}>Flag</Text>
                </TouchableOpacity>
              </View>
            )}
            {verdict === 'approve' && <Text style={[styles.sheetStatusMsg, { color: colors.success }]}>You verified this check-in</Text>}
            {verdict === 'flag' && <Text style={[styles.sheetStatusMsg, { color: colors.danger }]}>Flagged for review</Text>}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10, marginBottom: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerText: { flex: 1 },
  userName: { fontFamily: fonts.bodyMedium, fontSize: 13 },
  date: { fontFamily: fonts.body, fontSize: 11 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  verifiedCount: { fontFamily: fonts.bodyMedium, fontSize: 11 },
  note: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  readMore: { fontFamily: fonts.bodyMedium, fontSize: 13 },
  proof: { width: '100%', height: 160, borderRadius: 8 },
  actions: { flexDirection: 'row', gap: 8 },
  verifyBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  verifyText: { fontFamily: fonts.bodyMedium, fontSize: 13 },
  flagBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  flagText: { fontFamily: fonts.bodyMedium, fontSize: 13 },
  statusMsg: { fontFamily: fonts.body, fontSize: 12 },
  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, borderWidth: 1, borderBottomWidth: 0, padding: 20, paddingTop: 12, gap: 14 },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 8 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sheetName: { fontFamily: fonts.bodyMedium, fontSize: 15 },
  sheetDate: { fontFamily: fonts.body, fontSize: 12, marginTop: 2 },
  sheetNote: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, marginBottom: 10 },
  sheetProof: { width: '100%', height: 220, borderRadius: 10, marginBottom: 10 },
  sheetNextStep: { fontFamily: fonts.body, fontSize: 13, fontStyle: 'italic', marginBottom: 8 },
  sheetActions: { flexDirection: 'row', gap: 10, borderTopWidth: 1, paddingTop: 14 },
  sheetVerifyBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 12, borderWidth: 1 },
  sheetVerifyText: { fontFamily: fonts.bodyBold, fontSize: 14 },
  sheetFlagBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 12, borderWidth: 1 },
  sheetFlagText: { fontFamily: fonts.bodyBold, fontSize: 14 },
  sheetStatusMsg: { fontFamily: fonts.bodyMedium, fontSize: 13, textAlign: 'center', paddingVertical: 8 },
})
