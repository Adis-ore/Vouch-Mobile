import { useState, useMemo } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Switch, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { fonts } from '../constants/fonts'
import { spacing } from '../constants/spacing'
import { useTheme } from '../context/ThemeContext'
import { CURRENT_USER } from '../data/dummy'

export default function Settings() {
  const router = useRouter()
  const { colors, scheme, toggleTheme } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const [notifCheckins, setNotifCheckins] = useState(CURRENT_USER.notification_checkins)
  const [notifMilestones, setNotifMilestones] = useState(CURRENT_USER.notification_milestones)
  const [notifMessages, setNotifMessages] = useState(CURRENT_USER.notification_messages)
  const [notifReminders, setNotifReminders] = useState(CURRENT_USER.notification_reminders)
  const [strictStreak, setStrictStreak] = useState(CURRENT_USER.streak_mode === 'strict')

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.group}>
          <Row icon="person-outline" label="Edit profile" onPress={() => router.push('/edit-profile')} colors={colors} styles={styles} />
          <Row icon="notifications-outline" label="Notification preferences" onPress={null} noChevron colors={colors} styles={styles} />
          <ToggleRow label="Check-in alerts" value={notifCheckins} onChange={setNotifCheckins} indent colors={colors} styles={styles} />
          <ToggleRow label="Milestone updates" value={notifMilestones} onChange={setNotifMilestones} indent colors={colors} styles={styles} />
          <ToggleRow label="Group messages" value={notifMessages} onChange={setNotifMessages} indent colors={colors} styles={styles} />
          <ToggleRow label="Daily check-in reminder" value={notifReminders} onChange={setNotifReminders} indent last colors={colors} styles={styles} />
        </View>

        <Text style={styles.sectionLabel}>Appearance</Text>
        <View style={styles.group}>
          <ToggleRow
            label={scheme === 'dark' ? 'Dark mode' : 'Light mode'}
            sublabel="Toggle between light and dark"
            value={scheme === 'dark'}
            onChange={toggleTheme}
            last
            colors={colors}
            styles={styles}
          />
        </View>

        <Text style={styles.sectionLabel}>Journey preferences</Text>
        <View style={styles.group}>
          <ToggleRow label="Strict streak mode" sublabel="Streak resets if you miss any day" value={strictStreak} onChange={setStrictStreak} last colors={colors} styles={styles} />
        </View>

        <Text style={styles.sectionLabel}>Support</Text>
        <View style={styles.group}>
          <Row icon="help-circle-outline" label="FAQ" onPress={() => router.push('/faq')} colors={colors} styles={styles} />
          <Row icon="shield-outline" label="Privacy policy" onPress={() => router.push('/privacy')} colors={colors} styles={styles} />
          <Row icon="document-text-outline" label="Terms of service" onPress={() => router.push('/terms')} last colors={colors} styles={styles} />
        </View>

        <Text style={styles.sectionLabel}>About</Text>
        <View style={styles.group}>
          <Row icon="information-circle-outline" label="App version" value="1.0.0" last noChevron colors={colors} styles={styles} />
        </View>

        <TouchableOpacity style={styles.signOut} onPress={() => router.replace('/(auth)/welcome')} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  )
}

function Row({ icon, label, onPress, value, noChevron, last, colors, styles }) {
  return (
    <TouchableOpacity style={[styles.row, last && styles.rowLast]} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <Ionicons name={icon} size={18} color={colors.textSecondary} style={styles.rowIcon} />
      <Text style={styles.rowLabel}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {!noChevron && <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />}
    </TouchableOpacity>
  )
}

function ToggleRow({ label, sublabel, value, onChange, indent, last, colors, styles }) {
  return (
    <View style={[styles.row, last && styles.rowLast, indent && styles.rowIndent]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sublabel ? <Text style={styles.rowSublabel}>{sublabel}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: colors.border, true: colors.accent }} thumbColor={colors.surface} />
    </View>
  )
}

function makeStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
    backBtn: { padding: 4 },
    title: { fontFamily: fonts.display, fontSize: 18, color: colors.textPrimary },
    content: { padding: spacing.lg, gap: 6 },
    sectionLabel: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: spacing.md, marginBottom: 6, paddingHorizontal: 4 },
    group: { backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
    rowLast: { borderBottomWidth: 0 },
    rowIndent: { paddingLeft: 46 },
    rowIcon: { width: 20, textAlign: 'center' },
    rowLabel: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.textPrimary },
    rowSublabel: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginTop: 2 },
    rowValue: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted },
    signOut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: spacing.lg, padding: 16, borderWidth: 1, borderColor: colors.danger + '40', borderRadius: 14, backgroundColor: colors.danger + '0D' },
    signOutText: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.danger },
  })
}
