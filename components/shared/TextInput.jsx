import { View, TextInput as RNTextInput, Text, StyleSheet } from 'react-native'
import { useTheme } from '../../context/ThemeContext'
import { fonts } from '../../constants/fonts'

export default function TextInput({ label, error, style, containerStyle, ...props }) {
  const { colors } = useTheme()

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
      <RNTextInput
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          { backgroundColor: colors.surfaceAlt, borderColor: colors.border, color: colors.textPrimary },
          error && { borderColor: colors.danger },
          style,
        ]}
        {...props}
      />
      {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 13 },
  input: { borderWidth: 1, borderRadius: 10, height: 48, paddingHorizontal: 14, fontSize: 15, fontFamily: fonts.body },
  error: { fontFamily: fonts.body, fontSize: 12 },
})
