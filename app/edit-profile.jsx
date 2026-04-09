import { useState, useMemo } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { fonts } from '../constants/fonts'
import { spacing } from '../constants/spacing'
import { useTheme } from '../context/ThemeContext'
import { useUser } from '../context/UserContext'
import Avatar from '../components/shared/Avatar'
import Button from '../components/shared/Button'

export default function EditProfile() {
  const router = useRouter()
  const { colors } = useTheme()
  const { user, updateUser } = useUser()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const [fullName, setFullName] = useState(user?.full_name ?? '')
  const [username, setUsername] = useState(user?.username ?? '')
  const [bio, setBio] = useState(user?.bio ?? '')
  const [region, setRegion] = useState(user?.region ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const save = async () => {
    if (!fullName.trim()) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    updateUser({ full_name: fullName.trim(), username: username.trim(), bio: bio.trim(), region: region.trim() })
    setSaving(false)
    setSaved(true)
    setTimeout(() => router.back(), 1000)
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Edit profile</Text>
        <View style={{ width: 30 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.avatarWrap} onPress={async () => {
            const result = await (await import('expo-image-picker')).launchImageLibraryAsync({ allowsEditing: false, quality: 0.7 })
            if (!result.canceled) updateUser({ avatar_url: result.assets[0].uri })
          }} activeOpacity={0.8}>
            <Avatar name={fullName || user?.full_name || 'You'} uri={user?.avatar_url} size={80} />
            <View style={styles.avatarEdit}>
              <Ionicons name="camera-outline" size={14} color={colors.bg} />
            </View>
          </TouchableOpacity>

          <Field label="Full name" value={fullName} onChange={setFullName} placeholder="Your full name" colors={colors} styles={styles} />
          <Field label="Username" value={username} onChange={setUsername} placeholder="username" prefix="@" colors={colors} styles={styles} />
          <Field label="Bio" value={bio} onChange={setBio} placeholder="A short bio..." multiline colors={colors} styles={styles} />
          <Field label="Region" value={region} onChange={setRegion} placeholder="e.g. Lagos" colors={colors} styles={styles} />

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Email</Text>
            <View style={[styles.input, styles.inputReadOnly]}>
              <Text style={styles.readOnlyText}>{user?.email ?? '—'}</Text>
              <Ionicons name="lock-closed-outline" size={14} color={colors.textMuted} />
            </View>
            <Text style={styles.fieldHint}>Contact support to change your email.</Text>
          </View>

          <Button label={saved ? 'Saved!' : 'Save changes'} onPress={save} loading={saving} disabled={!fullName.trim() || saving || saved} style={{ marginTop: spacing.sm }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function Field({ label, value, onChange, placeholder, prefix, multiline, colors, styles }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.input, multiline && styles.inputMulti]}>
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          style={[styles.textInput, multiline && { height: 90, textAlignVertical: 'top' }]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          multiline={multiline}
          autoCapitalize={prefix === '@' ? 'none' : 'words'}
        />
      </View>
    </View>
  )
}

function makeStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
    backBtn: { padding: 4 },
    title: { fontFamily: fonts.display, fontSize: 18, color: colors.textPrimary },
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    avatarWrap: { alignSelf: 'center', marginBottom: spacing.sm, position: 'relative' },
    avatarEdit: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.bg },
    field: { gap: 6 },
    fieldLabel: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textSecondary },
    input: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, minHeight: 46 },
    inputMulti: { alignItems: 'flex-start', paddingVertical: 12 },
    inputReadOnly: { opacity: 0.6 },
    prefix: { fontFamily: fonts.body, fontSize: 15, color: colors.textMuted, marginRight: 2 },
    textInput: { flex: 1, fontFamily: fonts.body, fontSize: 15, color: colors.textPrimary },
    readOnlyText: { flex: 1, fontFamily: fonts.body, fontSize: 15, color: colors.textMuted },
    fieldHint: { fontFamily: fonts.body, fontSize: 11, color: colors.textMuted },
  })
}
