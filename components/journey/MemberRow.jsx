import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '../../constants/colors'
import { fonts } from '../../constants/fonts'
import Avatar from '../shared/Avatar'

export default function MemberRow({ member, daysElapsed }) {
  const rate = daysElapsed > 0 ? Math.min(member.total_checkins / daysElapsed, 1) : 0
  const rateColor = rate >= 0.9 ? colors.success : rate >= 0.6 ? colors.accent : colors.danger

  return (
    <View style={styles.row}>
      <Avatar name={member.full_name} size={40} />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{member.full_name}</Text>
          {member.role === 'creator' && (
            <View style={styles.creatorBadge}>
              <Text style={styles.creatorText}>Creator</Text>
            </View>
          )}
        </View>
        <View style={styles.metaRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Ionicons name="flame" size={12} color={colors.accent} />
            <Text style={styles.streak}>{member.current_streak}d streak</Text>
          </View>
          <View style={styles.rateBar}>
            <View style={[styles.rateFill, { width: `${rate * 100}%`, backgroundColor: rateColor }]} />
          </View>
          <Text style={[styles.rateText, { color: rateColor }]}>{Math.round(rate * 100)}%</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  info: { flex: 1, gap: 6 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textPrimary },
  creatorBadge: {
    backgroundColor: 'rgba(232,168,56,0.12)', borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: 'rgba(232,168,56,0.25)',
  },
  creatorText: { fontFamily: fonts.bodyMedium, fontSize: 10, color: colors.accent },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  streak: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary },
  rateBar: {
    flex: 1, height: 4, backgroundColor: colors.surfaceAlt,
    borderRadius: 2, overflow: 'hidden',
  },
  rateFill: { height: '100%', borderRadius: 2 },
  rateText: { fontFamily: fonts.bodyMedium, fontSize: 11, minWidth: 32, textAlign: 'right' },
})
