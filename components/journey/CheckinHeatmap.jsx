import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { useTheme } from '../../context/ThemeContext'
import { fonts } from '../../constants/fonts'

const CELL = 10
const GAP = 3

export default function CheckinHeatmap({ data }) {
  const { colors } = useTheme()
  const ROWS = 7
  const cols = []
  for (let i = 0; i < data.length; i += ROWS) cols.push(data.slice(i, i + ROWS))

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {cols.map((col, ci) => (
          <View key={ci} style={styles.col}>
            {col.map((day, ri) => (
              <View key={ri} style={[
                styles.cell,
                day.count > 1 ? { backgroundColor: colors.success } : day.count > 0 ? { backgroundColor: colors.accent } : { backgroundColor: colors.surfaceAlt },
              ]} />
            ))}
          </View>
        ))}
      </ScrollView>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
          <Text style={[styles.legendText, { color: colors.textMuted }]}>You</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.legendText, { color: colors.textMuted }]}>Others</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.surfaceAlt }]} />
          <Text style={[styles.legendText, { color: colors.textMuted }]}>Missed</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  scroll: { paddingRight: 4, gap: GAP },
  col: { gap: GAP },
  cell: { width: CELL, height: CELL, borderRadius: 2 },
  legend: { flexDirection: 'row', gap: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 2 },
  legendText: { fontFamily: fonts.body, fontSize: 11 },
})
