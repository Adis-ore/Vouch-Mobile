import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '../../context/ThemeContext'
import { fonts } from '../../constants/fonts'

function StatItem({ label, value, colors }) {
  return (
    <View style={styles.item}>
      <Text style={[styles.value, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
    </View>
  )
}

export default function StatsRow({ journeysCompleted, totalCheckins, reputationScore }) {
  const { colors } = useTheme()
  return (
    <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <StatItem label="Completed" value={journeysCompleted} colors={colors} />
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <StatItem label="Check-ins" value={totalCheckins} colors={colors} />
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <StatItem label="Reputation" value={reputationScore} colors={colors} />
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, paddingVertical: 14 },
  item: { flex: 1, alignItems: 'center', gap: 3 },
  value: { fontFamily: fonts.bodyBold, fontSize: 20 },
  label: { fontFamily: fonts.body, fontSize: 11 },
  divider: { width: 1, marginVertical: 4 },
})
