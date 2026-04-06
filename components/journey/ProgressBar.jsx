import { useEffect, useRef } from 'react'
import { View, Text, Animated, StyleSheet } from 'react-native'
import { colors } from '../../constants/colors'
import { fonts } from '../../constants/fonts'

export default function ProgressBar({ percent, daysElapsed, durationDays, height = 8 }) {
  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(anim, {
      toValue: percent / 100,
      duration: 800,
      useNativeDriver: false,
    }).start()
  }, [percent])

  const width = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })

  return (
    <View style={styles.container}>
      <View style={styles.labels}>
        <Text style={styles.dayLabel}>Day {daysElapsed} of {durationDays}</Text>
        <Text style={styles.pct}>{percent}%</Text>
      </View>
      <View style={[styles.track, { height }]}>
        <Animated.View style={[styles.fill, { width, height }]} />
      </View>
      <Text style={styles.remaining}>{durationDays - daysElapsed} days remaining</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  labels: { flexDirection: 'row', justifyContent: 'space-between' },
  dayLabel: { fontFamily: fonts.body, fontSize: 13, color: colors.textSecondary },
  pct: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.accent },
  track: { backgroundColor: colors.surfaceAlt, borderRadius: 99, overflow: 'hidden' },
  fill: { backgroundColor: colors.accent, borderRadius: 99 },
  remaining: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
})
