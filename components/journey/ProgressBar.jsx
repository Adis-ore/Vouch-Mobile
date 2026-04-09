import { useEffect, useRef } from 'react'
import { View, Text, Animated, StyleSheet } from 'react-native'
import { useTheme } from '../../context/ThemeContext'
import { fonts } from '../../constants/fonts'

export default function ProgressBar({ percent, daysElapsed, durationDays, height = 8 }) {
  const { colors } = useTheme()
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(anim, { toValue: percent / 100, duration: 800, useNativeDriver: false }).start()
  }, [percent])

  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })

  return (
    <View style={styles.container}>
      <View style={styles.labels}>
        <Text style={[styles.dayLabel, { color: colors.textSecondary }]}>Day {daysElapsed} of {durationDays}</Text>
        <Text style={[styles.pct, { color: colors.accent }]}>{percent}%</Text>
      </View>
      <View style={[styles.track, { height, backgroundColor: colors.surfaceAlt }]}>
        <Animated.View style={[styles.fill, { width, height, backgroundColor: colors.accent }]} />
      </View>
      <Text style={[styles.remaining, { color: colors.textMuted }]}>{durationDays - daysElapsed} days remaining</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
  dayLabel: { fontFamily: fonts.body, fontSize: 13 },
  pct: { fontFamily: fonts.bodyMedium, fontSize: 13 },
  track: { borderRadius: 99, overflow: 'hidden' },
  fill: { borderRadius: 99 },
  remaining: { fontFamily: fonts.body, fontSize: 12 },
})
