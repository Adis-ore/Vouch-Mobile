import { useState } from 'react'
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native'
import { useTheme } from '../../context/ThemeContext'
import { fonts } from '../../constants/fonts'
import Avatar from '../shared/Avatar'

export default function CheckinCard({ item, currentUserId }) {
  const { colors } = useTheme()
  const isOwn = item.user_id === currentUserId
  const [expanded, setExpanded] = useState(false)
  const [verified, setVerified] = useState(false)
  const [flagged, setFlagged] = useState(false)

  const MAX_CHARS = 140
  const isLong = item.note.length > MAX_CHARS
  const displayNote = expanded || !isLong ? item.note : item.note.slice(0, MAX_CHARS) + '...'

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Avatar name={item.user.full_name} size={34} />
        <View style={styles.headerText}>
          <Text style={[styles.userName, { color: colors.textPrimary }]}>{item.user.full_name}</Text>
          <Text style={[styles.date, { color: colors.textMuted }]}>{item.checkin_date}</Text>
        </View>
        {item.verified_count > 0 && <Text style={[styles.verifiedCount, { color: colors.success }]}>✓ {item.verified_count}</Text>}
      </View>

      <Text style={[styles.note, { color: colors.textSecondary }]}>{displayNote}</Text>
      {isLong && (
        <TouchableOpacity onPress={() => setExpanded(!expanded)}>
          <Text style={[styles.readMore, { color: colors.accent }]}>{expanded ? 'Show less' : 'Read more'}</Text>
        </TouchableOpacity>
      )}

      {item.proof_url && item.proof_type === 'image' && (
        <Image source={{ uri: item.proof_url }} style={styles.proof} resizeMode="cover" />
      )}

      {item.next_step && <Text style={[styles.nextStep, { color: colors.textMuted }]}>Next: {item.next_step}</Text>}

      {!isOwn && !verified && !flagged && (
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.verifyBtn, { borderColor: colors.success + '50' }]} onPress={() => setVerified(true)} activeOpacity={0.8}>
            <Text style={[styles.verifyText, { color: colors.success }]}>✓ Looks real</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.flagBtn, { borderColor: colors.danger + '50' }]} onPress={() => setFlagged(true)} activeOpacity={0.8}>
            <Text style={[styles.flagText, { color: colors.danger }]}>⚑ Flag</Text>
          </TouchableOpacity>
        </View>
      )}
      {verified && <Text style={[styles.verifiedMsg, { color: colors.success }]}>You verified this check-in</Text>}
      {flagged && <Text style={[styles.flaggedMsg, { color: colors.danger }]}>Flagged for review</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10, marginBottom: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerText: { flex: 1 },
  userName: { fontFamily: fonts.bodyMedium, fontSize: 13 },
  date: { fontFamily: fonts.body, fontSize: 11 },
  verifiedCount: { fontFamily: fonts.bodyMedium, fontSize: 12 },
  note: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  readMore: { fontFamily: fonts.bodyMedium, fontSize: 13 },
  proof: { width: '100%', height: 180, borderRadius: 8 },
  nextStep: { fontFamily: fonts.body, fontSize: 12, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 8 },
  verifyBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  verifyText: { fontFamily: fonts.bodyMedium, fontSize: 13 },
  flagBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  flagText: { fontFamily: fonts.bodyMedium, fontSize: 13 },
  verifiedMsg: { fontFamily: fonts.body, fontSize: 12 },
  flaggedMsg: { fontFamily: fonts.body, fontSize: 12 },
})
