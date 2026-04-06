import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { useTheme } from '../../context/ThemeContext'
import { fonts } from '../../constants/fonts'

export default function Button({ label, onPress, variant = 'primary', loading = false, disabled = false, style }) {
  const { colors } = useTheme()
  const isPrimary = variant === 'primary'
  const isOutline = variant === 'outline'
  const isGhost = variant === 'ghost'

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        isPrimary && { backgroundColor: colors.accent },
        isOutline && { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.accent },
        isGhost && { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator size="small" color={isPrimary ? colors.bg : colors.accent} />
        : <Text style={[
            styles.label,
            isPrimary && { fontFamily: fonts.bodyBold, color: colors.bg },
            isOutline && { fontFamily: fonts.bodyMedium, color: colors.accent },
            isGhost && { fontFamily: fonts.bodyMedium, color: colors.textSecondary },
          ]}>
            {label}
          </Text>
      }
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: { height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  disabled: { opacity: 0.45 },
  label: { fontSize: 15 },
})
