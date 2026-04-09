import { useState, useMemo } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, FlatList, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { fonts } from '../../constants/fonts'
import { spacing } from '../../constants/spacing'
import { useTheme } from '../../context/ThemeContext'
import { useUser } from '../../context/UserContext'
import { CATEGORIES } from '../../data/dummy'
import Button from '../../components/shared/Button'
import Avatar from '../../components/shared/Avatar'
import CategoryChip from '../../components/shared/CategoryChip'

const TOTAL_STEPS = 4

const COUNTRIES = [
  'Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Ethiopia',
  'Egypt', 'Tanzania', 'Uganda', 'Cameroon', 'Rwanda',
  'Senegal', 'Ivory Coast', 'Zambia', 'Zimbabwe', 'Other',
]

const REGIONS = {
  Nigeria: [
    'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
    'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','Gombe','Imo','Jigawa',
    'Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger',
    'Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe',
    'Zamfara','Abuja (FCT)',
  ],
  Ghana: ['Greater Accra','Ashanti','Western','Eastern','Central','Northern','Upper East','Upper West','Volta','Brong-Ahafo'],
  Kenya: ['Nairobi','Mombasa','Kisumu','Nakuru','Eldoret','Machakos','Nyeri','Meru','Kakamega','Kiambu'],
  'South Africa': ['Gauteng','Western Cape','KwaZulu-Natal','Eastern Cape','Limpopo','Mpumalanga','North West','Free State','Northern Cape'],
  Ethiopia: ['Addis Ababa','Oromia','Amhara','Tigray','Somali','SNNPR','Afar','Benishangul-Gumuz'],
  Egypt: ['Cairo','Giza','Alexandria','Dakahlia','Sharqia','Qalyubia','Kafr el-Sheikh','Gharbia'],
  Tanzania: ['Dar es Salaam','Dodoma','Mwanza','Zanzibar','Arusha','Mbeya','Morogoro','Tanga'],
  Uganda: ['Kampala','Wakiso','Mukono','Mbarara','Gulu','Jinja','Lira','Masaka'],
  Cameroon: ['Centre','Littoral','West','South West','North West','Adamawa','East','Far North','North','South'],
  Rwanda: ['Kigali','Eastern','Western','Northern','Southern'],
  Senegal: ['Dakar','Thiès','Saint-Louis','Diourbel','Tambacounda','Kaolack','Ziguinchor'],
  'Ivory Coast': ['Abidjan','Bouaké','Daloa','Yamoussoukro','San-Pédro','Korhogo'],
  Zambia: ['Lusaka','Copperbelt','Southern','Eastern','Northen','Western','Luapula','North-Western'],
  Zimbabwe: ['Harare','Bulawayo','Manicaland','Mashonaland Central','Mashonaland East','Mashonaland West','Masvingo','Matabeleland North','Matabeleland South','Midlands'],
}

// Popular (quick-pick) regions per country — shown as chips; rest accessible via "Others"
const POPULAR_REGIONS = {
  Nigeria:        ['Lagos', 'Abuja (FCT)', 'Kano', 'Rivers', 'Oyo', 'Delta'],
  Ghana:          ['Greater Accra', 'Ashanti', 'Western', 'Eastern'],
  Kenya:          ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru'],
  'South Africa': ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape'],
  Ethiopia:       ['Addis Ababa', 'Oromia', 'Amhara', 'Tigray'],
  Egypt:          ['Cairo', 'Giza', 'Alexandria', 'Dakahlia'],
  Tanzania:       ['Dar es Salaam', 'Dodoma', 'Mwanza', 'Arusha'],
  Uganda:         ['Kampala', 'Wakiso', 'Mukono', 'Mbarara'],
  Cameroon:       ['Centre', 'Littoral', 'West', 'South West'],
  Rwanda:         ['Kigali', 'Eastern', 'Western', 'Northern'],
  Senegal:        ['Dakar', 'Thiès', 'Saint-Louis', 'Diourbel'],
  'Ivory Coast':  ['Abidjan', 'Bouaké', 'Daloa', 'Yamoussoukro'],
  Zambia:         ['Lusaka', 'Copperbelt', 'Southern', 'Eastern'],
  Zimbabwe:       ['Harare', 'Bulawayo', 'Manicaland', 'Masvingo'],
}

export default function Onboarding() {
  const router = useRouter()
  const { colors } = useTheme()
  const { updateUser } = useUser()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [avatarUri, setAvatarUri] = useState(null)
  const [country, setCountry] = useState('')
  const [otherCountry, setOtherCountry] = useState('')
  const [region, setRegion] = useState('')
  const [otherRegion, setOtherRegion] = useState('')
  const [selectedCategories, setSelectedCategories] = useState([])
  const [customCategory, setCustomCategory] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [streakMode, setStreakMode] = useState('')
  const [regionModalVisible, setRegionModalVisible] = useState(false)
  const [regionSearch, setRegionSearch] = useState('')

  const canProceedStep1 = name.trim().length >= 2
  const canProceedStep2 = (() => {
    if (!country) return false
    if (country === 'Other') return true // region optional for Other
    const hasDropdown = !!REGIONS[country]
    if (hasDropdown) return !!region
    return otherRegion.trim().length > 0
  })()
  const canProceedStep3 = selectedCategories.length > 0
  const canProceedStep4 = !!streakMode

  const canProceed = [canProceedStep1, canProceedStep2, canProceedStep3, canProceedStep4][step - 1]

  const next = () => {
    if (step < TOTAL_STEPS) { setStep(s => s + 1) } else { finish() }
  }
  const back = () => setStep(s => s - 1)

  const finish = () => {
    const finalCountry = country === 'Other' ? (otherCountry || 'Other') : country
    const finalRegion = country === 'Other'
      ? otherRegion
      : (REGIONS[country] ? region : otherRegion)
    updateUser({
      full_name: name.trim(),
      avatar_url: avatarUri,
      country: finalCountry,
      region: finalRegion,
      location: finalRegion ? `${finalRegion}, ${finalCountry}` : finalCountry,
      categories: selectedCategories,
      streak_mode: streakMode,
    })
    router.replace('/(tabs)')
  }

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.7,
    })
    if (!result.canceled) setAvatarUri(result.assets[0].uri)
  }

  const toggleCategory = (cat) => {
    if (cat === 'Custom') {
      setShowCustomInput(v => !v)
      return
    }
    setSelectedCategories(prev =>
      prev.includes(cat)
        ? prev.filter(c => c !== cat)
        : prev.length < 3 ? [...prev, cat] : prev
    )
  }

  const addCustomCategory = () => {
    const trimmed = customCategory.trim()
    if (!trimmed || selectedCategories.includes(trimmed) || selectedCategories.length >= 3) return
    setSelectedCategories(prev => [...prev, trimmed])
    setCustomCategory('')
    setShowCustomInput(false)
  }

  const regions = REGIONS[country]

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.progressRow}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <View key={i} style={[styles.dot, i + 1 === step && styles.dotActive, i + 1 < step && styles.dotDone]} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* STEP 1 — NAME */}
        {step === 1 && (
          <View style={styles.step}>
            <Text style={styles.prompt}>What should we call you?</Text>
            <TouchableOpacity onPress={pickImage} style={styles.avatarPicker} activeOpacity={0.8}>
              <Avatar name={name || 'You'} uri={avatarUri} size={80} />
              <Text style={styles.avatarHint}>Tap to add a photo</Text>
            </TouchableOpacity>
            <TextInput
              style={[styles.bigInput, { color: colors.textPrimary, backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            {name.length > 0 && name.trim().length < 2 && (
              <Text style={[styles.fieldError, { color: colors.danger }]}>Name must be at least 2 characters</Text>
            )}
          </View>
        )}

        {/* STEP 2 — LOCATION */}
        {step === 2 && (
          <View style={styles.step}>
            <Text style={styles.prompt}>Where are you based?</Text>
            <Text style={styles.stepNote}>We use this to pair you with nearby partners. You can update this in your profile anytime.</Text>

            <Text style={styles.sectionLabel}>Country</Text>
            <View style={styles.chipGrid}>
              {COUNTRIES.map(c => (
                <CategoryChip key={c} label={c} selected={country === c} onPress={() => { setCountry(c); setRegion(''); setOtherRegion('') }} />
              ))}
            </View>

            {country === 'Other' && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>Which country?</Text>
                <TextInput
                  style={[styles.smallInput, { color: colors.textPrimary, backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                  value={otherCountry}
                  onChangeText={setOtherCountry}
                  placeholder="Type your country"
                  placeholderTextColor={colors.textMuted}
                />
                <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>Region / City (optional)</Text>
                <TextInput
                  style={[styles.smallInput, { color: colors.textPrimary, backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                  value={otherRegion}
                  onChangeText={setOtherRegion}
                  placeholder="e.g. Cape Town"
                  placeholderTextColor={colors.textMuted}
                />
              </>
            )}

            {country !== '' && country !== 'Other' && regions && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>State / Region</Text>
                <View style={styles.chipGrid}>
                  {(POPULAR_REGIONS[country] ?? regions.slice(0, 6)).map(r => (
                    <CategoryChip key={r} label={r} selected={region === r} onPress={() => setRegion(r)} />
                  ))}
                  <TouchableOpacity
                    style={[styles.othersBtn, { backgroundColor: colors.surfaceAlt, borderColor: region && !POPULAR_REGIONS[country]?.includes(region) ? colors.accent : colors.border }]}
                    onPress={() => { setRegionSearch(''); setRegionModalVisible(true) }}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.othersBtnText, { color: region && !POPULAR_REGIONS[country]?.includes(region) ? colors.accent : colors.textSecondary }]}>
                      {region && !POPULAR_REGIONS[country]?.includes(region) ? region : 'Others →'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {country !== '' && country !== 'Other' && !regions && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: spacing.md }]}>Region / City</Text>
                <TextInput
                  style={[styles.smallInput, { color: colors.textPrimary, backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                  value={otherRegion}
                  onChangeText={setOtherRegion}
                  placeholder="e.g. Accra"
                  placeholderTextColor={colors.textMuted}
                />
              </>
            )}
          </View>
        )}

        {/* STEP 3 — CATEGORIES */}
        {step === 3 && (
          <View style={styles.step}>
            <Text style={styles.prompt}>What matters most to you right now?</Text>
            <Text style={styles.stepNote}>Pick up to 3 categories.</Text>
            <View style={styles.chipGrid}>
              {CATEGORIES.map(cat => {
                const label = typeof cat === 'string' ? cat : cat.label
                return (
                  <CategoryChip
                    key={label}
                    label={label}
                    selected={selectedCategories.includes(label) || (label === 'Custom' && showCustomInput)}
                    onPress={() => toggleCategory(label)}
                  />
                )
              })}
            </View>

            {showCustomInput && (
              <View style={styles.customRow}>
                <TextInput
                  style={[styles.customInput, { color: colors.textPrimary, backgroundColor: colors.surfaceAlt, borderColor: colors.accent, flex: 1 }]}
                  value={customCategory}
                  onChangeText={setCustomCategory}
                  placeholder="Name your category"
                  placeholderTextColor={colors.textMuted}
                  autoFocus
                />
                <TouchableOpacity style={[styles.customAddBtn, { backgroundColor: colors.accent }]} onPress={addCustomCategory} activeOpacity={0.8}>
                  <Ionicons name="checkmark" size={18} color={colors.bg} />
                </TouchableOpacity>
              </View>
            )}

            {selectedCategories.length > 0 && (
              <View style={styles.selectedRow}>
                {selectedCategories.map(c => (
                  <TouchableOpacity key={c} style={[styles.selectedChip, { backgroundColor: colors.accent + '20', borderColor: colors.accent }]} onPress={() => setSelectedCategories(prev => prev.filter(x => x !== c))}>
                    <Text style={[styles.selectedChipText, { color: colors.accent }]}>{c}</Text>
                    <Ionicons name="close" size={12} color={colors.accent} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* STEP 4 — STREAK MODE */}
        {step === 4 && (
          <View style={styles.step}>
            <Text style={styles.prompt}>Choose your accountability mode</Text>
            <Text style={styles.stepNote}>You can change this later in Settings.</Text>
            <View style={styles.modeCards}>
              <TouchableOpacity
                style={[styles.modeCard, { backgroundColor: colors.surface, borderColor: streakMode === 'strict' ? colors.accent : colors.border }]}
                onPress={() => setStreakMode('strict')}
                activeOpacity={0.8}
              >
                <View style={styles.modeTop}>
                  <Text style={[styles.modeTitle, { color: colors.textPrimary }]}>Strict</Text>
                  {streakMode === 'strict' && <Ionicons name="checkmark-circle" size={20} color={colors.accent} />}
                </View>
                <Text style={[styles.modeDesc, { color: colors.textSecondary }]}>Check in every single day. Miss one — streak resets to zero. High commitment.</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeCard, { backgroundColor: colors.surface, borderColor: streakMode === 'relaxed' ? colors.accent : colors.border }]}
                onPress={() => setStreakMode('relaxed')}
                activeOpacity={0.8}
              >
                <View style={styles.modeTop}>
                  <Text style={[styles.modeTitle, { color: colors.textPrimary }]}>Relaxed</Text>
                  {streakMode === 'relaxed' && <Ionicons name="checkmark-circle" size={20} color={colors.accent} />}
                </View>
                <Text style={[styles.modeDesc, { color: colors.textSecondary }]}>Miss 1 day per week without penalty. Sustainable for long journeys.</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step > 1 && (
          <TouchableOpacity onPress={back} style={styles.backLink}>
            <Text style={[styles.backLinkText, { color: colors.textSecondary }]}>Back</Text>
          </TouchableOpacity>
        )}
        <Button
          label={step === TOTAL_STEPS ? "Let's go" : 'Continue'}
          onPress={next}
          disabled={!canProceed}
          style={{ flex: 1 }}
        />
      </View>

      {/* Full region search modal */}
      <Modal visible={regionModalVisible} animationType="slide" transparent onRequestClose={() => setRegionModalVisible(false)}>
        <View style={[styles.regionModalOverlay]}>
          <View style={[styles.regionModalSheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.regionHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.regionModalTitle, { color: colors.textPrimary }]}>Select region</Text>
            <View style={[styles.regionSearchWrap, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
              <Ionicons name="search-outline" size={16} color={colors.textMuted} />
              <TextInput
                style={[styles.regionSearchInput, { color: colors.textPrimary }]}
                value={regionSearch}
                onChangeText={setRegionSearch}
                placeholder="Search..."
                placeholderTextColor={colors.textMuted}
                autoFocus
              />
            </View>
            <FlatList
              data={(regions ?? []).filter(r => r.toLowerCase().includes(regionSearch.toLowerCase()))}
              keyExtractor={r => r}
              showsVerticalScrollIndicator={false}
              renderItem={({ item: r }) => (
                <TouchableOpacity
                  style={[styles.regionRow, { borderBottomColor: colors.border }, region === r && { backgroundColor: colors.accent + '12' }]}
                  onPress={() => { setRegion(r); setRegionModalVisible(false) }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.regionRowText, { color: region === r ? colors.accent : colors.textPrimary }]}>{r}</Text>
                  {region === r && <Ionicons name="checkmark" size={16} color={colors.accent} />}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={[styles.regionCloseBtn, { borderTopColor: colors.border }]} onPress={() => setRegionModalVisible(false)}>
              <Text style={[styles.regionCloseBtnText, { color: colors.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    prompt: { fontFamily: fonts.display, fontSize: 28, color: colors.textPrimary, lineHeight: 34 },
    stepNote: { fontFamily: fonts.body, fontSize: 14, color: colors.textSecondary, marginTop: -spacing.xs },
    fieldError: { fontFamily: fonts.body, fontSize: 12 },
    avatarPicker: { alignItems: 'center', gap: 10, marginVertical: spacing.md },
    avatarHint: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted },
    bigInput: { borderWidth: 1, borderRadius: 12, height: 56, paddingHorizontal: 16, fontSize: 20, fontFamily: fonts.body },
    smallInput: { borderWidth: 1, borderRadius: 10, height: 48, paddingHorizontal: 14, fontSize: 15, fontFamily: fonts.body },
    sectionLabel: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textSecondary, marginBottom: spacing.xs },
    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    customRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 },
    customInput: { borderWidth: 1, borderRadius: 10, height: 44, paddingHorizontal: 12, fontSize: 14, fontFamily: fonts.body },
    customAddBtn: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    selectedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    selectedChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
    selectedChipText: { fontFamily: fonts.bodyMedium, fontSize: 13 },
    modeCards: { gap: 12, marginTop: spacing.sm },
    modeCard: { borderWidth: 1.5, borderRadius: 14, padding: 20, gap: 10 },
    modeTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    modeTitle: { fontFamily: fonts.bodyBold, fontSize: 18 },
    modeDesc: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
    footer: { flexDirection: 'row', gap: 12, padding: spacing.lg, paddingTop: spacing.sm, alignItems: 'center' },
    backLink: { paddingHorizontal: 4 },
    backLinkText: { fontFamily: fonts.bodyMedium, fontSize: 15 },
    othersBtn: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
    othersBtnText: { fontFamily: fonts.bodyMedium, fontSize: 13 },
    // Region modal
    regionModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    regionModalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, maxHeight: '80%', paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
    regionHandle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: spacing.sm, marginBottom: spacing.md },
    regionModalTitle: { fontFamily: fonts.display, fontSize: 20, marginBottom: spacing.sm },
    regionSearchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, height: 44, marginBottom: spacing.sm },
    regionSearchInput: { flex: 1, fontFamily: fonts.body, fontSize: 15 },
    regionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1 },
    regionRowText: { fontFamily: fonts.body, fontSize: 15 },
    regionCloseBtn: { borderTopWidth: 1, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.sm },
    regionCloseBtnText: { fontFamily: fonts.bodyMedium, fontSize: 15 },
  })
}
