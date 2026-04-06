import { View, Text, StyleSheet } from 'react-native'
import { colors } from '../../constants/colors'
import { fonts } from '../../constants/fonts'

function StatItem({ label, value }) {
  return (
    <View style={styles.item}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

export default function StatsRow({ journeysCompleted, totalCheckins, reputationScore }) {
  return (
    <View style={styles.row}>
      <StatItem label="Completed" value={journeysCompleted} />
      <View style={styles.divider} />
      <StatItem label="Check-ins" value={totalCheckins} />
      <View style={styles.divider} />
      <StatItem label="Reputation" value={reputationScore} />
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  value: {
    fontFamily: fonts.bodyBold,
    fontSize: 20,
    color: colors.textPrimary,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.textMuted,
  },
  divider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
})
