import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../context/ThemeContext'
import { fonts } from '../../constants/fonts'

export default function StakeCard({ amount, currency = 'NGN' }) {
  const { colors } = useTheme()
  if (!amount || amount === 0) return null
  const symbol = currency === 'NGN' ? '₦' : currency

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name="wallet-outline" size={18} color={colors.accent} />
      </View>
      <View style={styles.text}>
        <Text style={[styles.amount, { color: colors.accent }]}>{symbol}{amount.toLocaleString()} deposit per member</Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>
          Complete the journey to get it back. Miss 3 days in a row and your deposit is forfeited to Vouch.
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'rgba(232,168,56,0.08)', borderWidth: 1, borderColor: 'rgba(232,168,56,0.25)', borderRadius: 12, padding: 14, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  iconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(232,168,56,0.12)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  text: { flex: 1, gap: 4 },
  amount: { fontFamily: fonts.bodyBold, fontSize: 14 },
  sub: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17 },
})
