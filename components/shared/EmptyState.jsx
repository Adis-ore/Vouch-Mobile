import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '../../context/ThemeContext'
import { fonts } from '../../constants/fonts'
import Button from './Button'

export default function EmptyState({ title, body, ctaLabel, onCta, secondaryLabel, onSecondary }) {
  const { colors } = useTheme()

  return (
    <View style={styles.container}>
      <View style={styles.illustration}>
        <View style={[styles.circle, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]} />
        <View style={[styles.bar1, { backgroundColor: colors.surfaceAlt }]} />
        <View style={[styles.bar2, { backgroundColor: colors.surfaceAlt }]} />
      </View>
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {body && <Text style={[styles.body, { color: colors.textSecondary }]}>{body}</Text>}
      {ctaLabel && <Button label={ctaLabel} onPress={onCta} style={styles.cta} />}
      {secondaryLabel && <Button label={secondaryLabel} onPress={onSecondary} variant="outline" style={styles.secondary} />}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingVertical: 60, gap: 12 },
  illustration: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center', marginBottom: 8, gap: 6 },
  circle: { width: 36, height: 36, borderRadius: 18, borderWidth: 2 },
  bar1: { width: 56, height: 6, borderRadius: 3 },
  bar2: { width: 40, height: 6, borderRadius: 3 },
  title: { fontFamily: fonts.bodyBold, fontSize: 17, textAlign: 'center' },
  body: { fontFamily: fonts.body, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  cta: { marginTop: 8, width: '100%' },
  secondary: { width: '100%' },
})
