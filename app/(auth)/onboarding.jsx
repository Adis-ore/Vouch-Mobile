import { useState, useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { fonts } from '../../constants/fonts'
import { spacing } from '../../constants/spacing'
import { useTheme } from '../../context/ThemeContext'
import { CATEGORIES } from '../../data/dummy'
import Button from '../../components/shared/Button'
import Avatar from '../../components/shared/Avatar'
import CategoryChip from '../../components/shared/CategoryChip'

const TOTAL_STEPS = 4
const COUNTRIES = ['Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Ethiopia', 'Egypt', 'Tanzania', 'Uganda', 'Cameroon', 'Other']
const NIGERIA_STATES = ['Lagos', 'Abuja (FCT)', 'Oyo', 'Kano', 'Rivers', 'Anambra', 'Ogun', 'Delta', 'Kaduna', 'Enugu']

export default function Onboarding() {
  const router = useRouter()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [avatarUri, setAvatarUri] = useState(null)
  const [country, setCountry] = useState('')
  const [region, setRegion] = useState('')
  const [selectedCategories, setSelectedCategories] = useState([])
  const [streakMode, setStreakMode] = useState('')

  const next = () => step < TOTAL_STEPS ? setStep(s => s + 1) : finish()
  const back = () => setStep(s => s - 1)
  const finish = () => router.replace('/(tabs)')

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.7 })
    if (!result.canceled) setAvatarUri(result.assets[0].uri)
  }

  const toggleCategory = (cat) => {
    setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : prev.length < 3 ? [...prev, cat] : prev)
  }

  const regions = country === 'Nigeria' ? NIGERIA_STATES : ['Capital', 'Central', 'Northern', 'Southern', 'Eastern', 'Western']

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.progressRow}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <View key={i} style={[styles.dot, i + 1 === step && styles.dotActive, i + 1 < step && styles.dotDone]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {step === 1 && (
          <View style={styles.step}>
            <Text style={styles.prompt}>What should we call you?</Text>
            <TouchableOpacity onPress={pickImage} style={styles.avatarPicker}>
              <Avatar name={name || 'You'} uri={avatarUri} size={80} />
              <Text style={styles.avatarHint}>Tap to add a photo</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.bigInput}
              value={name}
              onChangeText={setName}
              placeholder="Your full name"
              placeholderTextColor={colors.textMuted}
            />
          </View>
        )}

        {step === 2 && (
          <View style={styles.step}>
            <Text style={styles.prompt}>Where are you based?</Text>
            <Text style={styles.stepNote}>We use this to pair you with nearby partners.</Text>
            <Text style={styles.sectionLabel}>Country</Text>
            <View style={styles.chipGrid}>
              {COUNTRIES.map(c => <CategoryChip key={c} label={c} selected={country === c} onPress={() => setCountry(c)} />)}
            </View>
            {country !== '' && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>Region / State</Text>
                <View style={styles.chipGrid}>
                  {regions.map(r => <CategoryChip key={r} label={r} selected={region === r} onPress={() => setRegion(r)} />)}
                </View>
              </>
            )}
          </View>
        )}

        {step === 3 && (
          <View style={styles.step}>
            <Text style={styles.prompt}>What matters most to you right now?</Text>
            <Text style={styles.stepNote}>Pick up to 3 categories.</Text>
            <View style={styles.chipGrid}>
              {CATEGORIES.map(cat => (
                <CategoryChip key={cat} label={cat} selected={selectedCategories.includes(cat)} onPress={() => toggleCategory(cat)} />
              ))}
            </View>
          </View>
        )}

        {step === 4 && (
          <View style={styles.step}>
            <Text style={styles.prompt}>Choose your accountability mode</Text>
            <View style={styles.modeCards}>
              <TouchableOpacity style={[styles.modeCard, streakMode === 'strict' && styles.modeCardSelected]} onPress={() => setStreakMode('strict')} activeOpacity={0.8}>
                <Text style={styles.modeTitle}>Strict</Text>
                <Text style={styles.modeDesc}>Check in every single day. Miss one — streak resets. Bold, high commitment.</Text>
                {streakMode === 'strict' && <View style={styles.modeCheck}><Ionicons name="checkmark-circle" size={22} color={colors.accent} /></View>}
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modeCard, streakMode === 'relaxed' && styles.modeCardSelected]} onPress={() => setStreakMode('relaxed')} activeOpacity={0.8}>
                <Text style={styles.modeTitle}>Relaxed</Text>
                <Text style={styles.modeDesc}>Miss 1 day per week without penalty. Forgiving, sustainable.</Text>
                {streakMode === 'relaxed' && <View style={styles.modeCheck}><Ionicons name="checkmark-circle" size={22} color={colors.accent} /></View>}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step > 1 && (
          <TouchableOpacity onPress={back} style={styles.backLink}>
            <Text style={styles.backLinkText}>Back</Text>
          </TouchableOpacity>
        )}
        <Button
          label={step === TOTAL_STEPS ? "Let's go" : 'Continue'}
          onPress={next}
          disabled={(step === 1 && !name.trim()) || (step === 3 && selectedCategories.length === 0) || (step === 4 && !streakMode)}
          style={{ flex: 1 }}
        />
      </View>
    </SafeAreaView>
  )
}

function makeStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    progressRow: { flexDirection: 'row', gap: 6, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
    dot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.surfaceAlt },
    dotActive: { backgroundColor: colors.accent },
    dotDone: { backgroundColor: colors.accent + '60' },
    content: { padding: spacing.lg, paddingTop: spacing.md, flexGrow: 1 },
    step: { gap: spacing.md },
    prompt: { fontFamily: fonts.display, fontSize: 28, color: colors.textPrimary, lineHeight: 34, marginBottom: spacing.xs },
    stepNote: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary, marginTop: -spacing.xs },
    avatarPicker: { alignItems: 'center', gap: 10, marginVertical: spacing.md },
    avatarHint: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },
    bigInput: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border, borderRadius: 12, height: 56, paddingHorizontal: 16, fontSize: 20, fontFamily: fonts.body, color: colors.textPrimary },
    sectionLabel: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textSecondary, marginBottom: spacing.xs },
    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    modeCards: { gap: 12, marginTop: spacing.sm },
    modeCard: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 14, padding: 20, gap: 8, position: 'relative' },
    modeCardSelected: { borderColor: colors.accent, backgroundColor: 'rgba(232,168,56,0.06)' },
    modeTitle: { fontFamily: fonts.bodyBold, fontSize: 18, color: colors.textPrimary },
    modeDesc: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
    modeCheck: { position: 'absolute', top: 16, right: 16 },
    footer: { flexDirection: 'row', gap: 12, padding: spacing.lg, paddingTop: spacing.sm, alignItems: 'center' },
    backLink: { paddingHorizontal: 4 },
    backLinkText: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.textSecondary },
  })
}
