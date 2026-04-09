import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../context/ThemeContext'
import { fonts } from '../../constants/fonts'

// 3-tier refund structure:
// 0–74%   → 0% back  (platform keeps all after 10% fee)
// 75–89%  → 75% back
// 90–99%  → 95% back
// 100%    → 100% back
// Platform takes 10% fee at join regardless

const TIERS = [
  { label: '100%',    min: 100, max: 100, refund: 100, color: '#4CAF50' },
  { label: '90–99%', min: 90,  max: 99,  refund: 95,  color: '#8BC34A' },
  { label: '75–89%', min: 75,  max: 89,  refund: 75,  color: '#FF9800' },
  { label: '0–74%',  min: 0,   max: 74,  refund: 0,   color: '#F44336' },
]

function getActiveTier(pct) {
  if (pct == null) return null
  return TIERS.find(t => pct >= t.min && pct <= t.max) ?? TIERS[TIERS.length - 1]
}

export default function StakeCard({ amount, currency = 'NGN', progressPercent }) {
  const { colors } = useTheme()
  if (!amount || amount === 0) return null
  const symbol = currency === 'NGN' ? '₦' : currency

  const platformFee = Math.round(amount * 0.10)
  const net = amount - platformFee
  const activeTier = getActiveTier(progressPercent)

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="wallet-outline" size={18} color="#E8A838" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.amount}>{symbol}{amount.toLocaleString()} deposit</Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>
            {symbol}{platformFee.toLocaleString()} platform fee (10%) at join · {symbol}{net.toLocaleString()} refundable
          </Text>
        </View>
      </View>

      <View style={[styles.tierTable, { borderColor: 'rgba(232,168,56,0.2)' }]}>
        <Text style={[styles.tierHeader, { color: colors.textMuted }]}>Completion → Refund</Text>
        {TIERS.map(t => {
          const isActive = progressPercent != null && progressPercent >= t.min && progressPercent <= t.max
          return (
            <View key={t.label} style={[styles.tierRow, isActive && { backgroundColor: t.color + '18', borderRadius: 6 }]}>
              <Text style={[styles.tierRange, { color: isActive ? t.color : colors.textSecondary }]}>{t.label}</Text>
              <Text style={[styles.tierRefund, { color: isActive ? t.color : colors.textMuted }]}>
                {t.refund}% back{isActive ? ' ← you are here' : ''}
              </Text>
            </View>
          )
        })}
      </View>

      {activeTier && progressPercent != null && (
        <View style={[styles.currentStatus, { backgroundColor: activeTier.color + '15', borderColor: activeTier.color + '40' }]}>
          <Ionicons name="information-circle-outline" size={14} color={activeTier.color} />
          <Text style={[styles.currentStatusText, { color: activeTier.color }]}>
            At {progressPercent}% you'd receive {symbol}{Math.round(net * activeTier.refund / 100).toLocaleString()} back
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(232,168,56,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(232,168,56,0.22)',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  header: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  iconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(232,168,56,0.12)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  headerText: { flex: 1, gap: 3 },
  amount: { fontFamily: fonts.bodyBold, fontSize: 14, color: '#E8A838' },
  sub: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17 },
  tierTable: { borderWidth: 1, borderRadius: 8, padding: 10, gap: 6 },
  tierHeader: { fontFamily: fonts.bodyMedium, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  tierRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, paddingVertical: 5 },
  tierRange: { fontFamily: fonts.bodyMedium, fontSize: 13 },
  tierRefund: { fontFamily: fonts.body, fontSize: 12 },
  currentStatus: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, borderWidth: 1, borderRadius: 8, padding: 10 },
  currentStatusText: { flex: 1, fontFamily: fonts.body, fontSize: 12, lineHeight: 17 },
})
