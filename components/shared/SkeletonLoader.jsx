import { useEffect, useRef } from 'react'
import { View, Animated, StyleSheet } from 'react-native'
import { useTheme } from '../../context/ThemeContext'

function SkeletonBlock({ width, height, borderRadius = 8, style }) {
  const { colors } = useTheme()
  const opacity = useRef(new Animated.Value(0.4)).current

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    )
    anim.start()
    return () => anim.stop()
  }, [])

  return (
    <Animated.View style={[{ width, height, borderRadius, backgroundColor: colors.surfaceAlt, opacity }, style]} />
  )
}

export function JourneyCardSkeleton() {
  const { colors } = useTheme()
  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <SkeletonBlock width="100%" height={120} borderRadius={12} />
      <View style={{ padding: 14, gap: 10 }}>
        <SkeletonBlock width="75%" height={16} />
        <SkeletonBlock width="50%" height={12} />
        <SkeletonBlock width="100%" height={6} borderRadius={3} />
      </View>
    </View>
  )
}

export function StatCardSkeleton() {
  const { colors } = useTheme()
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
      <SkeletonBlock width={40} height={22} />
      <SkeletonBlock width={60} height={10} style={{ marginTop: 6 }} />
    </View>
  )
}

export default SkeletonBlock

const styles = StyleSheet.create({
  card: { borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  statCard: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
})
