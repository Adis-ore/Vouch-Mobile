import { useState, useRef, useMemo } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, Animated, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import * as Haptics from 'expo-haptics'
import { fonts } from '../../constants/fonts'
import { spacing } from '../../constants/spacing'
import { useTheme } from '../../context/ThemeContext'
import { ACTIVE_JOURNEY } from '../../data/dummy'
import Button from '../../components/shared/Button'

const MIN_CHARS = 20

function Confetti({ visible, colors }) {
  const DOTS = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    color: [colors.accent, colors.success, colors.info, colors.danger][i % 4],
    angle: (i / 20) * Math.PI * 2,
    size: 4 + Math.random() * 5,
  })), [colors])

  const anims = useRef(DOTS.map(() => new Animated.Value(0))).current
  const opacities = useRef(DOTS.map(() => new Animated.Value(0))).current

  if (visible) {
    Animated.parallel(
      DOTS.map((_, i) => Animated.parallel([
        Animated.timing(anims[i], { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(opacities[i], { toValue: 1, duration: 100, useNativeDriver: true }),
          Animated.timing(opacities[i], { toValue: 0, duration: 500, delay: 100, useNativeDriver: true }),
        ]),
      ]))
    ).start()
  }

  if (!visible) return null

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {DOTS.map((dot, i) => {
        const tx = anims[i].interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(dot.angle) * 100] })
        const ty = anims[i].interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(dot.angle) * 100] })
        return (
          <Animated.View key={i} style={{ position: 'absolute', alignSelf: 'center', top: '60%', width: dot.size, height: dot.size, borderRadius: dot.size / 2, backgroundColor: dot.color, opacity: opacities[i], transform: [{ translateX: tx }, { translateY: ty }] }} />
        )
      })}
    </View>
  )
}

export default function CheckinScreen() {
  const { journeyId } = useLocalSearchParams()
  const router = useRouter()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const [note, setNote] = useState('')
  const [nextStep, setNextStep] = useState('')
  const [proofUri, setProofUri] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const isValid = note.trim().length >= MIN_CHARS
  const charColor = note.length >= MIN_CHARS ? colors.success : note.length > MIN_CHARS * 0.6 ? colors.accent : colors.textMuted

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 0.8 })
    if (!result.canceled) setProofUri(result.assets[0].uri)
  }

  const submit = async () => {
    if (!isValid) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 900))
    setLoading(false)
    setSuccess(true)
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    setTimeout(() => router.back(), 1800)
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.journeyName}>{ACTIVE_JOURNEY.title}</Text>
            <Text style={styles.dateText}>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          </View>

          <Text style={styles.prompt}>What did you do today?</Text>

          <View>
            <TextInput style={[styles.noteInput, isValid && styles.noteInputValid]} value={note} onChangeText={setNote} placeholder="Be specific — what did you actually do? (min 20 chars)" placeholderTextColor={colors.textMuted} multiline textAlignVertical="top" />
            <Text style={[styles.charCount, { color: charColor }]}>{note.length} / {MIN_CHARS} min</Text>
          </View>

          <View style={styles.proofSection}>
            <Text style={styles.proofLabel}>Add proof (optional but encouraged)</Text>
            <View style={styles.proofOptions}>
              <TouchableOpacity style={[styles.proofChip, proofUri && styles.proofChipActive]} onPress={pickPhoto} activeOpacity={0.8}>
                <Ionicons name="camera-outline" size={16} color={proofUri ? colors.success : colors.textSecondary} />
                <Text style={[styles.proofChipText, proofUri && { color: colors.success }]}>Photo</Text>
              </TouchableOpacity>
            </View>
            {proofUri && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                <Text style={styles.proofAttached}>Photo attached</Text>
              </View>
            )}
          </View>

          <View style={styles.nextStepSection}>
            <Text style={styles.proofLabel}>What will you do tomorrow? (optional)</Text>
            <TextInput style={styles.nextStepInput} value={nextStep} onChangeText={setNextStep} placeholder="Tomorrow I will..." placeholderTextColor={colors.textMuted} />
          </View>

          <Button label={success ? 'Submitted!' : 'Submit check-in'} onPress={submit} loading={loading} disabled={!isValid || success} style={{ marginTop: spacing.sm }} />
          {success && <Text style={styles.successMsg}>Check-in submitted. Keep going!</Text>}
        </ScrollView>
      </KeyboardAvoidingView>
      <Confetti visible={success} colors={colors} />
    </SafeAreaView>
  )
}

function makeStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    header: { gap: 4 },
    journeyName: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textMuted },
    dateText: { fontFamily: fonts.display, fontSize: 18, color: colors.textPrimary },
    prompt: { fontFamily: fonts.display, fontSize: 26, color: colors.textPrimary, lineHeight: 32 },
    noteInput: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, fontSize: 15, fontFamily: fonts.body, color: colors.textPrimary, minHeight: 130 },
    noteInputValid: { borderColor: colors.success },
    charCount: { fontFamily: fonts.body, fontSize: 11, textAlign: 'right', marginTop: 4 },
    proofSection: { gap: 8 },
    proofLabel: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textSecondary },
    proofOptions: { flexDirection: 'row', gap: 8 },
    proofChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 10, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceAlt },
    proofChipActive: { borderColor: colors.success, backgroundColor: 'rgba(62,207,170,0.1)' },
    proofChipText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textSecondary },
    proofAttached: { fontFamily: fonts.body, fontSize: 12, color: colors.success },
    nextStepSection: { gap: 8 },
    nextStepInput: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border, borderRadius: 10, height: 46, paddingHorizontal: 14, fontSize: 14, fontFamily: fonts.body, color: colors.textPrimary },
    successMsg: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.success, textAlign: 'center' },
  })
}
