import { useEffect, useRef, useMemo } from 'react'
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { fonts } from '../../constants/fonts'
import { spacing } from '../../constants/spacing'
import { useTheme } from '../../context/ThemeContext'
import Button from '../../components/shared/Button'
import VouchLogo from '../../components/shared/VouchLogo'

const { width, height } = Dimensions.get('window')

const DOTS = [
  { x: 0.1, y: 0.15, size: 6, delay: 0 },
  { x: 0.85, y: 0.1, size: 4, delay: 300 },
  { x: 0.75, y: 0.35, size: 8, delay: 600 },
  { x: 0.05, y: 0.55, size: 5, delay: 200 },
  { x: 0.9, y: 0.6, size: 6, delay: 900 },
  { x: 0.5, y: 0.08, size: 4, delay: 450 },
]

function FloatingDot({ x, y, size, delay, color }) {
  const translateY = useRef(new Animated.Value(0)).current
  const opacity = useRef(new Animated.Value(0.1)).current

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, { toValue: -12, duration: 2400, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.22, duration: 1200, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(translateY, { toValue: 0, duration: 2400, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.1, duration: 1200, useNativeDriver: true }),
        ]),
      ])
    )
    anim.start()
    return () => anim.stop()
  }, [])

  return (
    <Animated.View style={{
      position: 'absolute',
      left: x * width,
      top: y * height,
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: color,
      opacity,
      transform: [{ translateY }],
    }} />
  )
}

export default function Welcome() {
  const router = useRouter()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const logoOpacity = useRef(new Animated.Value(0)).current
  const headlineY = useRef(new Animated.Value(30)).current
  const headlineOpacity = useRef(new Animated.Value(0)).current
  const subtextOpacity = useRef(new Animated.Value(0)).current
  const buttonsOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(headlineOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(headlineY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.timing(subtextOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(buttonsOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start()
  }, [])

  return (
    <SafeAreaView style={styles.container}>
      {DOTS.map((d, i) => <FloatingDot key={i} {...d} color={colors.accent} />)}

      <Animated.View style={[styles.logoArea, { opacity: logoOpacity }]}>
        <VouchLogo size={36} />
        <Text style={styles.logoText}>Vouch</Text>
      </Animated.View>

      <View style={styles.heroArea}>
        <Animated.Text style={[styles.headline, { opacity: headlineOpacity, transform: [{ translateY: headlineY }] }]}>
          Don't grow{'\n'}alone.
        </Animated.Text>
        <Animated.Text style={[styles.subtext, { opacity: subtextOpacity }]}>
          Find your accountability partner. Show up every day. Actually finish what you start.
        </Animated.Text>
      </View>

      <Animated.View style={[styles.statsGrid, { opacity: subtextOpacity }]}>
        {[
          { value: '12,000+', label: 'journeys started' },
          { value: '78%', label: 'completion rate\nwith a partner' },
          { value: '₦4.2M', label: 'stakes\nreturned' },
          { value: '4.8', label: 'average rating' },
        ].map((s, i) => (
          <View key={i} style={styles.statCell}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </Animated.View>

      <Animated.View style={[styles.buttons, { opacity: buttonsOpacity }]}>
        <Button label="Get Started" onPress={() => router.push('/(auth)/onboarding')} />
        <Button label="I have an account" variant="outline" onPress={() => router.push('/(auth)/login')} />
      </Animated.View>
    </SafeAreaView>
  )
}

function makeStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
    logoArea: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.xl },
    logoText: { fontFamily: fonts.display, fontSize: 22, color: colors.textPrimary },
    heroArea: { flex: 1, justifyContent: 'center', gap: spacing.md },
    headline: { fontFamily: fonts.display, fontSize: 52, color: colors.textPrimary, lineHeight: 58, letterSpacing: -1 },
    subtext: { fontFamily: fonts.body, fontSize: 16, color: colors.textSecondary, lineHeight: 24, maxWidth: 300 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: spacing.lg },
    statCell: {
      flex: 1, minWidth: '45%',
      backgroundColor: colors.surface, borderRadius: 12,
      borderWidth: 1, borderColor: colors.border,
      padding: 12, gap: 4, overflow: 'hidden',
    },
    statValue: { fontFamily: fonts.display, fontSize: 18, color: colors.accent, lineHeight: 22, flexShrink: 1 },
    statLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.textMuted, lineHeight: 15, flexWrap: 'wrap' },
    buttons: { gap: spacing.sm, paddingBottom: spacing.xl },
  })
}
