import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { useTheme } from '../../context/ThemeContext'
import { fonts } from '../../constants/fonts'

const CELL = 10
const GAP = 3

// Each cell: { state: 'own' | 'others' | 'missed' | 'future' }
export default function CheckinHeatmap({ data }) {
  const { colors } = useTheme()
  const ROWS = 7
  const cols = []
  for (let i = 0; i < data.length; i += ROWS) cols.push(data.slice(i, i + ROWS))

  const cellColor = (cell) => {
    if (cell.state === 'own') return '#E8A838'
    if (cell.state === 'others') return colors.success
    if (cell.state === 'missed') return colors.danger + 'CC'
    return colors.surfaceAlt
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {cols.map((col, ci) => (
          <View key={ci} style={styles.col}>
            {col.map((day, ri) => (
              <View key={ri} style={[styles.cell, { backgroundColor: cellColor(day) }]} />
            ))}
          </View>
        ))}
      </ScrollView>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#E8A838' }]} />
          <Text style={[styles.legendText, { color: colors.textMuted }]}>You</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.legendText, { color: colors.textMuted }]}>Others</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.danger + 'CC' }]} />
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
