import { useState } from 'react'
import { View, Text, TouchableOpacity, Modal, StyleSheet, ActivityIndicator } from 'react-native'
import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../context/ThemeContext'
import { useUser } from '../../context/UserContext'
import { fonts } from '../../constants/fonts'
import { spacing } from '../../constants/spacing'
import { getJourneyPassPrice } from '../../constants/journeyPass'
import { apiInitJourneyPass } from '../../utils/api'

function BenefitRow({ text, colors, styles }) {
  return (
    <View style={styles.benefitRow}>
      <Ionicons name="checkmark-circle" size={16} color={colors.success} />
      <Text style={[styles.benefitText, { color: colors.textPrimary }]}>{text}</Text>
    </View>
  )
}

export default function JourneyPassModal({ visible, draftId, draftTitle, onClose, onSuccess, onUpgrade }) {
  const { colors } = useTheme()
  const { user } = useUser()
  const styles = makeStyles(colors)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const pricing = getJourneyPassPrice(user?.country)

  const handlePay = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiInitJourneyPass(draftId)
      if (!res.payment_url) throw new Error('No payment URL returned')

      const sub = Linking.addEventListener('url', ({ url }) => {
        if (url.startsWith('vouch://')) { sub.remove(); WebBrowser.dismissBrowser() }
      })
      await WebBrowser.openBrowserAsync(res.payment_url)
      sub.remove()
      // Payment complete — caller should re-try publish
      onSuccess?.()
    } catch (err) {
      setError('Payment could not start. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Publish this draft</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Draft name */}
          {draftTitle ? (
            <Text style={[styles.draftName, { color: colors.accent }]} numberOfLines={1}>
              "{draftTitle}"
            </Text>
          ) : null}

          {/* Explanation */}
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            You've reached your active journey limit. A Journey Pass lets you publish this one journey without upgrading your plan.
          </Text>

          {/* Benefits */}
          <View style={[styles.benefitsList, { backgroundColor: colors.surfaceAlt }]}>
            <BenefitRow text="Publish this journey immediately" colors={colors} styles={styles} />
            <BenefitRow text="Full access for this journey's lifetime" colors={colors} styles={styles} />
            <BenefitRow text="One-time payment — no subscription" colors={colors} styles={styles} />
            <BenefitRow text="Pass expires when journey ends" colors={colors} styles={styles} />
          </View>

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Journey Pass</Text>
            <Text style={[styles.price, { color: colors.accent }]}>{pricing.display}</Text>
          </View>
          <Text style={[styles.priceSub, { color: colors.textMuted }]}>One-time · Non-refundable</Text>

          {error ? <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text> : null}

          {/* Pay button */}
          <TouchableOpacity
            style={[styles.payBtn, { backgroundColor: colors.accent }, loading && { opacity: 0.7 }]}
            onPress={handlePay}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={colors.bg} />
              : <Text style={[styles.payBtnText, { color: colors.bg }]}>Pay {pricing.display} and publish</Text>
            }
          </TouchableOpacity>

          {/* Upgrade instead */}
          <TouchableOpacity style={styles.upgradeLink} onPress={() => { onClose(); onUpgrade?.() }} activeOpacity={0.7}>
            <Text style={[styles.upgradeLinkText, { color: colors.textMuted }]}>
              Or upgrade to Pro for 5 journey slots →
            </Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  )
}

function makeStyles(colors) {
  return StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: 40, gap: 12 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontFamily: fonts.display, fontSize: 20 },
    closeBtn: { padding: 4 },
    draftName: { fontFamily: fonts.bodyMedium, fontSize: 13 },
    body: { fontFamily: fonts.body, fontSize: 14, lineHeight: 22 },
    benefitsList: { borderRadius: 12, padding: 14, gap: 10 },
    benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    benefitText: { fontFamily: fonts.body, fontSize: 13, flex: 1 },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    priceLabel: { fontFamily: fonts.bodyMedium, fontSize: 14 },
    price: { fontFamily: fonts.display, fontSize: 26 },
    priceSub: { fontFamily: fonts.body, fontSize: 11, textAlign: 'right', marginTop: -6 },
    errorText: { fontFamily: fonts.body, fontSize: 13, textAlign: 'center' },
    payBtn: { borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
    payBtnText: { fontFamily: fonts.bodyBold, fontSize: 15 },
    upgradeLink: { alignItems: 'center', paddingVertical: 4 },
    upgradeLinkText: { fontFamily: fonts.body, fontSize: 12, textDecorationLine: 'underline' },
  })
}
