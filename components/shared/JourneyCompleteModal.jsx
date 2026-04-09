import { useEffect, useRef, useMemo } from 'react'
import { View, Text, TouchableOpacity, Modal, StyleSheet, Dimensions, Share, Linking } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { fonts } from '../../constants/fonts'
import { spacing } from '../../constants/spacing'
import { useTheme } from '../../context/ThemeContext'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

const CONFETTI_COLORS = ['#E8A838', '#3ECFAA', '#6366f1', '#47bfff', '#f87171', '#a78bfa', '#fbbf24']

function ConfettiDot({ color, delay }) {
  const x = useSharedValue(0)
  const y = useSharedValue(0)
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0)

  const targetX = useMemo(() => (Math.random() - 0.5) * SCREEN_WIDTH * 1.2, [])
  const targetY = useMemo(() => -Math.random() * SCREEN_HEIGHT * 0.6 - 80, [])

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 200 }))
    scale.value = withDelay(delay, withSpring(1, { damping: 8 }))
    x.value = withDelay(delay, withTiming(targetX, { duration: 900, easing: Easing.out(Easing.quad) }))
    y.value = withDelay(delay, withTiming(targetY, { duration: 900, easing: Easing.out(Easing.quad) }, () => {
      opacity.value = withTiming(0, { duration: 300 })
    }))
  }, [])

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }, { scale: scale.value }],
    opacity: opacity.value,
  }))

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          bottom: SCREEN_HEIGHT * 0.35,
          left: SCREEN_WIDTH / 2 - 5,
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: color,
        },
        style,
      ]}
    />
  )
}

function CheckmarkCircle({ colors }) {
  const scale = useSharedValue(0)
  const opacity = useSharedValue(0)

  useEffect(() => {
    opacity.value = withDelay(200, withTiming(1, { duration: 300 }))
    scale.value = withDelay(200, withSpring(1, { damping: 12, stiffness: 120 }))
  }, [])

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  return (
    <Animated.View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.accent + '20', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.accent }}>
        <Ionicons name="checkmark" size={44} color={colors.accent} />
      </View>
    </Animated.View>
  )
}

const DOTS = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  delay: Math.random() * 300,
}))

export default function JourneyCompleteModal({ visible, onClose, journey, userName }) {
  const router = useRouter()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const contentOpacity = useSharedValue(0)
  const contentY = useSharedValue(30)

  useEffect(() => {
    if (visible) {
      contentOpacity.value = withDelay(400, withTiming(1, { duration: 500 }))
      contentY.value = withDelay(400, withSpring(0, { damping: 16 }))
    }
  }, [visible])

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentY.value }],
  }))

  const shareToWhatsApp = async () => {
    const text = encodeURIComponent(
      `Just completed "${journey?.title}" on Vouch — ${journey?.duration_days} days of showing up every single day. Don't grow alone. https://vouch.app`
    )
    const url = `whatsapp://send?text=${text}`
    const canOpen = await Linking.canOpenURL(url)
    if (canOpen) {
      await Linking.openURL(url)
    } else {
      await Share.share({ message: decodeURIComponent(text) })
    }
  }

  const shareToLinkedIn = async () => {
    const text = encodeURIComponent(
      `Just completed "${journey?.title}" on Vouch — ${journey?.duration_days} days of showing up every single day. Don't grow alone. #Vouch #Accountability #Growth`
    )
    await Linking.openURL(`https://www.linkedin.com/sharing/share-offsite/?text=${text}`)
  }

  const shareAnywhere = async () => {
    await Share.share({
      message: `I just completed "${journey?.title}" on Vouch — ${journey?.duration_days} days straight. Don't grow alone. https://vouch.app`,
      title: 'Journey Complete on Vouch',
    })
  }

  const memberCount = journey?.current_participants ?? journey?.members?.length ?? 0
  const hasDeposit = journey?.stake_amount > 0

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: '#0A0F1E' }]}>
        {/* Confetti burst */}
        {visible && DOTS.map(d => (
          <ConfettiDot key={d.id} color={d.color} delay={d.delay} />
        ))}

        <Animated.View style={[styles.content, contentStyle]}>
          <CheckmarkCircle colors={colors} />

          <Text style={styles.headline}>Journey Complete.</Text>
          <Text style={styles.journeyTitle}>{journey?.title}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statCell}>
              <Text style={styles.statValue}>{journey?.duration_days ?? 0}</Text>
              <Text style={styles.statLabel}>days</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: '#ffffff20' }]} />
            <View style={styles.statCell}>
              <Text style={styles.statValue}>{memberCount}</Text>
              <Text style={styles.statLabel}>members</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: '#ffffff20' }]} />
            <View style={styles.statCell}>
              <Ionicons name="flame" size={14} color={colors.accent} />
              <Text style={styles.statLabel}>streak kept</Text>
            </View>
          </View>

          {hasDeposit && (
            <View style={styles.depositNotice}>
              <Ionicons name="wallet-outline" size={16} color={colors.success} />
              <Text style={styles.depositText}>
                ₦{journey.stake_amount.toLocaleString()} is being returned to you
              </Text>
            </View>
          )}

          {/* Share buttons */}
          <View style={styles.shareRow}>
            <TouchableOpacity style={[styles.shareBtn, { backgroundColor: '#25D366' }]} onPress={shareToWhatsApp} activeOpacity={0.85}>
              <Ionicons name="logo-whatsapp" size={16} color="#fff" />
              <Text style={styles.shareBtnText}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.shareBtn, { backgroundColor: '#0077B5' }]} onPress={shareToLinkedIn} activeOpacity={0.85}>
              <Ionicons name="logo-linkedin" size={16} color="#fff" />
              <Text style={styles.shareBtnText}>LinkedIn</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.shareBtn, { backgroundColor: '#ffffff18' }]} onPress={shareAnywhere} activeOpacity={0.85}>
              <Ionicons name="share-social-outline" size={16} color="#fff" />
              <Text style={styles.shareBtnText}>More</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.newJourneyBtn, { backgroundColor: colors.accent }]}
            onPress={() => { onClose(); router.push('/journey/create') }}
            activeOpacity={0.85}
          >
            <Text style={[styles.newJourneyBtnText, { color: colors.bg }]}>Start a new journey →</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { onClose(); router.replace('/(tabs)') }} style={{ paddingVertical: 10 }}>
            <Text style={styles.backHomeText}>Back to home</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  )
}

function makeStyles(colors) {
  return StyleSheet.create({
    overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
    content: { width: '100%', alignItems: 'center', gap: spacing.md },
    headline: { fontFamily: fonts.display, fontSize: 36, color: colors.accent, textAlign: 'center', lineHeight: 42 },
    journeyTitle: { fontFamily: fonts.body, fontSize: 17, color: '#ffffffCC', textAlign: 'center', lineHeight: 24 },
    statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff10', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24, gap: 0 },
    statCell: { flex: 1, alignItems: 'center', gap: 4 },
    statValue: { fontFamily: fonts.display, fontSize: 22, color: '#fff' },
    statLabel: { fontFamily: fonts.body, fontSize: 11, color: '#ffffff80' },
    statDivider: { width: 1, height: 32 },
    depositNotice: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.success + '18', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: colors.success + '40' },
    depositText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.success },
    shareRow: { flexDirection: 'row', gap: 10, width: '100%' },
    shareBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, paddingVertical: 12 },
    shareBtnText: { fontFamily: fonts.bodyBold, fontSize: 13, color: '#fff' },
    newJourneyBtn: { width: '100%', borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center' },
    newJourneyBtnText: { fontFamily: fonts.bodyBold, fontSize: 16 },
    backHomeText: { fontFamily: fonts.body, fontSize: 14, color: '#ffffff60', textAlign: 'center' },
  })
}
