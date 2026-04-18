import { useState, useRef } from 'react'
import { View, Text, TouchableOpacity, Modal, ScrollView, ActivityIndicator, StyleSheet, PanResponder, Animated } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../context/ThemeContext'
import { useUser } from '../../context/UserContext'
import { fonts } from '../../constants/fonts'
import { spacing } from '../../constants/spacing'

export const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '₦0',
    period: 'forever',
    journeyLimit: 3,
    maxParticipants: 20,
    features: [
      'Up to 3 active journeys',
      'Photo & video proof upload',
      'Basic check-ins & check-outs',
      'Group chat',
      'Badges & streaks',
      'Community discovery',
      'AI coach: 3 interactions/day',
    ],
    cta: 'Current plan',
    highlight: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '₦1,500',
    period: 'per month',
    journeyLimit: 10,
    maxParticipants: 50,
    features: [
      'Up to 10 active journeys',
      'Everything in Free',
      'Unlimited AI coach interactions',
      'Priority partner matching',
      'Advanced streak analytics',
      'Private journeys (invite-only)',
      'Anonymous mode in Discover',
      'Verified badge on profile',
    ],
    cta: 'Upgrade to Pro',
    highlight: true,
  },
  {
    id: 'elite',
    name: 'Elite',
    price: '₦3,500',
    period: 'per month',
    journeyLimit: Infinity,
    maxParticipants: 100,
    features: [
      'Unlimited active journeys',
      'Everything in Pro',
      'Create community challenges',
      'Dedicated support',
    ],
    cta: 'Go Elite',
    highlight: false,
  },
]

export function getPlanLimit(plan) {
  return PLANS.find(p => p.id === plan)?.journeyLimit ?? 3
}

export function getPlanMaxParticipants(plan) {
  return PLANS.find(p => p.id === plan)?.maxParticipants ?? 20
}

export default function PlansModal({ visible, onClose, highlightPlan }) {
  const { colors } = useTheme()
  const { user, updateUser } = useUser()
  const [loading, setLoading] = useState(null)
  const [success, setSuccess] = useState(null)
  const translateY = useRef(new Animated.Value(0)).current

  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => g.dy > 8 && Math.abs(g.dy) > Math.abs(g.dx),
    onPanResponderMove: (_, g) => {
      if (g.dy > 0) translateY.setValue(g.dy)
    },
    onPanResponderRelease: (_, g) => {
      if (g.dy > 120 || g.vy > 0.5) {
        Animated.timing(translateY, { toValue: 800, duration: 220, useNativeDriver: true }).start(() => {
          translateY.setValue(0)
          onClose()
        })
      } else {
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 20 }).start()
      }
    },
  })).current

  const currentPlan = user?.plan ?? 'free'

  const handleSelect = async (planId) => {
    if (planId === currentPlan) return
    setLoading(planId)
    await new Promise(r => setTimeout(r, 1500))
    updateUser({ plan: planId })
    setLoading(null)
    setSuccess(planId)
    setTimeout(() => {
      setSuccess(null)
      onClose()
    }, 1200)
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay} />
      <Animated.View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border, transform: [{ translateY }] }]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} {...panResponder.panHandlers} />
        <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Choose your plan</Text>
        <Text style={[styles.sheetSub, { color: colors.textSecondary }]}>Upgrade anytime. Cancel anytime.</Text>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 24 }}>
          {PLANS.map(plan => {
            const isCurrent = currentPlan === plan.id
            const isHighlighted = plan.highlight || highlightPlan === plan.id
            const isLoading = loading === plan.id
            const isSuccess = success === plan.id

            return (
              <View
                key={plan.id}
                style={[
                  styles.planCard,
                  {
                    backgroundColor: isHighlighted ? colors.accent + '08' : colors.surfaceAlt,
                    borderColor: isHighlighted ? colors.accent : isCurrent ? colors.accent + '60' : colors.border,
                    borderWidth: isHighlighted ? 1.5 : 1,
                  },
                ]}
              >
                {isHighlighted && (
                  <View style={[styles.popularBadge, { backgroundColor: colors.accent }]}>
                    <Text style={[styles.popularText, { color: colors.bg }]}>Most popular</Text>
                  </View>
                )}

                <View style={styles.planHeader}>
                  <View>
                    <Text style={[styles.planName, { color: colors.textPrimary }]}>{plan.name}</Text>
                    <Text style={[styles.planLimit, { color: colors.textMuted }]}>
                      {plan.journeyLimit === Infinity ? 'Unlimited journeys' : `Up to ${plan.journeyLimit} journeys`}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.planPrice, { color: isHighlighted ? colors.accent : colors.textPrimary }]}>{plan.price}</Text>
                    <Text style={[styles.planPeriod, { color: colors.textMuted }]}>{plan.period}</Text>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.featureList}>
                  {plan.features.map((f, i) => (
                    <View key={i} style={styles.featureRow}>
                      <Ionicons name="checkmark-circle" size={15} color={isHighlighted ? colors.accent : colors.success} />
                      <Text style={[styles.featureText, { color: colors.textSecondary }]}>{f}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.planBtn,
                    {
                      backgroundColor: isCurrent
                        ? colors.surfaceAlt
                        : isHighlighted
                          ? colors.accent
                          : colors.surface,
                      borderColor: isCurrent ? colors.border : isHighlighted ? colors.accent : colors.border,
                    },
                  ]}
                  onPress={() => handleSelect(plan.id)}
                  disabled={isCurrent || !!loading}
                  activeOpacity={0.85}
                >
                  {isLoading ? (
                    <ActivityIndicator color={isHighlighted ? colors.bg : colors.accent} size="small" />
                  ) : isSuccess ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                      <Text style={[styles.planBtnText, { color: colors.success }]}>Done!</Text>
                    </View>
                  ) : (
                    <Text style={[
                      styles.planBtnText,
                      { color: isCurrent ? colors.textMuted : isHighlighted ? colors.bg : colors.textPrimary }
                    ]}>
                      {isCurrent ? 'Current plan' : plan.cta}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )
          })}
        </ScrollView>

        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Text style={[styles.closeBtnText, { color: colors.textMuted }]}>Maybe later</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, maxHeight: '90%', padding: spacing.lg, paddingTop: spacing.sm },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.md },
  sheetTitle: { fontFamily: fonts.display, fontSize: 26, textAlign: 'center' },
  sheetSub: { fontFamily: fonts.body, fontSize: 14, textAlign: 'center', marginTop: 4, marginBottom: spacing.md },
  planCard: { borderRadius: 16, padding: 16, gap: 12, position: 'relative', overflow: 'hidden' },
  popularBadge: { position: 'absolute', top: 0, right: 0, paddingHorizontal: 10, paddingVertical: 4, borderBottomLeftRadius: 10 },
  popularText: { fontFamily: fonts.bodyBold, fontSize: 11 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  planName: { fontFamily: fonts.display, fontSize: 20 },
  planLimit: { fontFamily: fonts.body, fontSize: 12, marginTop: 2 },
  planPrice: { fontFamily: fonts.display, fontSize: 22 },
  planPeriod: { fontFamily: fonts.body, fontSize: 11 },
  divider: { height: 1 },
  featureList: { gap: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontFamily: fonts.body, fontSize: 13, flex: 1, lineHeight: 18 },
  planBtn: { borderRadius: 10, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  planBtnText: { fontFamily: fonts.bodyBold, fontSize: 15 },
  closeBtn: { alignItems: 'center', paddingVertical: 12 },
  closeBtnText: { fontFamily: fonts.body, fontSize: 14 },
})
