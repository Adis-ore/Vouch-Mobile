import { TouchableOpacity, Text, StyleSheet } from 'react-native'
import { useTheme } from '../../context/ThemeContext'
import { fonts } from '../../constants/fonts'

export default function CategoryChip({ label, selected, onPress, size = 'md' }) {
  const { colors } = useTheme()
  const isSmall = size === 'sm'

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.chip,
        isSmall && styles.chipSmall,
        selected
          ? { backgroundColor: 'rgba(232,168,56,0.12)', borderColor: colors.accent }
          : { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
      ]}
    >
      <Text style={[
        styles.label,
        isSmall && styles.labelSmall,
        { color: selected ? colors.accent : colors.textSecondary },
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  chipSmall: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 14 },
  labelSmall: { fontSize: 12 },
})
