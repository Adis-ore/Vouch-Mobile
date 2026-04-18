import { useState } from 'react'
import { View, TextInput as RNTextInput, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../context/ThemeContext'
import { fonts } from '../../constants/fonts'

export default function TextInput({ label, error, style, containerStyle, secureTextEntry, ...props }) {
  const { colors } = useTheme()
  const [visible, setVisible] = useState(false)

  const isPassword = secureTextEntry === true

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
      <View style={styles.inputWrap}>
        <RNTextInput
          placeholderTextColor={colors.textMuted}
          secureTextEntry={isPassword && !visible}
          style={[
            styles.input,
            { backgroundColor: colors.surfaceAlt, borderColor: error ? colors.danger : colors.border, color: colors.textPrimary },
            isPassword && { paddingRight: 44 },
            style,
          ]}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setVisible(v => !v)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={visible ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 13 },
  inputWrap: { position: 'relative', justifyContent: 'center' },
  input: { borderWidth: 1, borderRadius: 10, height: 48, paddingHorizontal: 14, fontSize: 15, fontFamily: fonts.body },
  eyeBtn: { position: 'absolute', right: 12, height: 48, justifyContent: 'center' },
  error: { fontFamily: fonts.body, fontSize: 12 },
})
