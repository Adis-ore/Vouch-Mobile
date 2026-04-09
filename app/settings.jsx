import { useState, useMemo } from 'react'
import { View, Text, TouchableOpacity, ScrollView, Switch, Modal, StyleSheet, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { fonts } from '../constants/fonts'
import { spacing } from '../constants/spacing'
import { useTheme } from '../context/ThemeContext'
import { useUser } from '../context/UserContext'
import { clearSession } from './_layout'
import PlansModal, { PLANS } from '../components/shared/PlansModal'
import {
  requestNotificationPermissions,
  scheduleDailyReminder,
  scheduleStreakAlert,
} from '../utils/notifications'

export default function Settings() {
  const router = useRouter()
  const { colors, preference, setPreference } = useTheme()
  const { user, updateUser } = useUser()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const [notifCheckins, setNotifCheckins] = useState(user?.notification_checkins ?? true)
  const [notifMilestones, setNotifMilestones] = useState(user?.notification_milestones ?? true)
  const [notifMessages, setNotifMessages] = useState(user?.notification_messages ?? false)
  const [notifReminders, setNotifReminders] = useState(user?.notification_reminders ?? true)
  const [strictStreak, setStrictStreak] = useState((user?.streak_mode ?? 'strict') === 'strict')

  const withPermission = async (fn) => {
    const granted = await requestNotificationPermissions()
    if (granted) await fn()
  }

  const handleNotifCheckins = async (val) => {
    setNotifCheckins(val)
    updateUser({ notification_checkins: val })
    await withPermission(() => scheduleStreakAlert(val))
  }

  const handleNotifReminders = async (val) => {
    setNotifReminders(val)
    updateUser({ notification_reminders: val })
    await withPermission(() => scheduleDailyReminder(val))
  }

  const handleNotifMilestones = (val) => {
    setNotifMilestones(val)
    updateUser({ notification_milestones: val })
  }

  const handleNotifMessages = (val) => {
    setNotifMessages(val)
    updateUser({ notification_messages: val })
  }

  const [plansVisible, setPlansVisible] = useState(false)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteToast, setDeleteToast] = useState(false)

  const handleStreakToggle = (val) => {
    setStrictStreak(val)
    updateUser({ streak_mode: val ? 'strict' : 'relaxed' })
  }

  const handleDeleteAccount = async () => {
    setDeleteLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    setDeleteLoading(false)
    setDeleteModalVisible(false)
    setDeleteToast(true)
    setTimeout(async () => {
      setDeleteToast(false)
      await clearSession()
      router.replace('/(auth)/welcome')
    }, 2000)
  }

  const handleLogout = async () => {
    await clearSession()
    router.replace('/(auth)/welcome')
  }

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

        {/* Plan */}
        <Text style={styles.sectionLabel}>Your plan</Text>
        <TouchableOpacity style={[styles.planBanner, { backgroundColor: colors.accent + '10', borderColor: colors.accent + '30' }]} onPress={() => setPlansVisible(true)} activeOpacity={0.85}>
          <View>
            <Text style={[styles.planName, { color: colors.textPrimary }]}>{PLANS.find(p => p.id === (user?.plan ?? 'free'))?.name ?? 'Free'}</Text>
            <Text style={[styles.planSub, { color: colors.textSecondary }]}>
              {PLANS.find(p => p.id === (user?.plan ?? 'free'))?.journeyLimit === Infinity
                ? 'Unlimited journeys'
                : `Up to ${PLANS.find(p => p.id === (user?.plan ?? 'free'))?.journeyLimit} journeys`}
            </Text>
          </View>
          <Text style={[styles.planUpgrade, { color: colors.accent }]}>{user?.plan === 'elite' ? '' : 'Upgrade →'}</Text>
        </TouchableOpacity>

        {/* Account */}
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.group}>
          <Row icon="person-outline" label="Edit profile" onPress={() => router.push('/edit-profile')} colors={colors} styles={styles} />
          <Row icon="notifications-outline" label="Notification preferences" onPress={null} noChevron colors={colors} styles={styles} />
          <ToggleRow label="Check-in alerts" value={notifCheckins} onChange={handleNotifCheckins} indent colors={colors} styles={styles} />
          <ToggleRow label="Milestone updates" value={notifMilestones} onChange={handleNotifMilestones} indent colors={colors} styles={styles} />
          <ToggleRow label="Group messages" value={notifMessages} onChange={handleNotifMessages} indent colors={colors} styles={styles} />
          <ToggleRow label="Daily check-in reminder" value={notifReminders} onChange={handleNotifReminders} indent last colors={colors} styles={styles} />
        </View>

        {/* Appearance */}
        <Text style={styles.sectionLabel}>Appearance</Text>
        <View style={styles.group}>
          {[
            { key: 'dark', label: 'Dark', icon: 'moon-outline' },
            { key: 'light', label: 'Light', icon: 'sunny-outline' },
            { key: 'system', label: 'System (auto)', icon: 'phone-portrait-outline' },
          ].map(({ key, label, icon }, i, arr) => (
            <TouchableOpacity
              key={key}
              style={[styles.row, i === arr.length - 1 && styles.rowLast]}
              onPress={() => setPreference(key)}
              activeOpacity={0.7}
            >
              <Ionicons name={icon} size={18} color={colors.textSecondary} style={styles.rowIcon} />
              <Text style={styles.rowLabel}>{label}</Text>
              {preference === key && <Ionicons name="checkmark-circle" size={20} color={colors.accent} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Streak mode */}
        <Text style={styles.sectionLabel}>Streak mode</Text>
        <View style={styles.group}>
          <ToggleRow
            label="Strict mode"
            sublabel={strictStreak ? 'Streak resets if you miss any day' : 'Miss 1 day per week without penalty'}
            value={strictStreak}
            onChange={handleStreakToggle}
            last
            colors={colors}
            styles={styles}
          />
        </View>
        <Text style={styles.modeNote}>
          {strictStreak
            ? 'Strict: miss any day and your streak resets to zero.'
            : 'Relaxed: you can miss 1 day per week without losing your streak.'}
        </Text>

        {/* Support */}
        <Text style={styles.sectionLabel}>Support</Text>
        <View style={styles.group}>
          <Row icon="help-circle-outline" label="FAQ" onPress={() => router.push('/faq')} colors={colors} styles={styles} />
          <Row icon="shield-outline" label="Privacy policy" onPress={() => router.push('/privacy')} colors={colors} styles={styles} />
          <Row icon="document-text-outline" label="Terms of service" onPress={() => router.push('/terms')} last colors={colors} styles={styles} />
        </View>

        {/* About */}
        <Text style={styles.sectionLabel}>About</Text>
        <View style={styles.group}>
          <Row icon="information-circle-outline" label="App version" value="1.0.0" last noChevron colors={colors} styles={styles} />
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOut} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>

        {/* Delete account */}
        <TouchableOpacity style={styles.deleteBtn} onPress={() => setDeleteModalVisible(true)} activeOpacity={0.7}>
          <Text style={styles.deleteBtnText}>Delete account</Text>
        </TouchableOpacity>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      <PlansModal visible={plansVisible} onClose={() => setPlansVisible(false)} />

      {/* Delete confirmation modal */}
      <Modal visible={deleteModalVisible} transparent animationType="fade" onRequestClose={() => setDeleteModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="warning-outline" size={32} color={colors.danger} style={{ alignSelf: 'center' }} />
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Delete your account?</Text>
            <Text style={[styles.modalBody, { color: colors.textSecondary }]}>
              This will permanently delete your account, all journeys, and any held deposits will be forfeited. This cannot be undone.
            </Text>
            <TouchableOpacity
              style={[styles.modalDangerBtn, { backgroundColor: colors.danger }]}
              onPress={handleDeleteAccount}
              disabled={deleteLoading}
              activeOpacity={0.85}
            >
              {deleteLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.modalDangerBtnText}>Yes, delete my account</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setDeleteModalVisible(false)} style={{ paddingVertical: 8 }}>
              <Text style={[styles.modalCancelText, { color: colors.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Toast */}
      {deleteToast && (
        <View style={[styles.toast, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.toastText, { color: colors.textPrimary }]}>Account deletion requested</Text>
        </View>
      )}
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
    modeNote: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, paddingHorizontal: 4, marginTop: 2 },
    group: { backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
    rowLast: { borderBottomWidth: 0 },
    rowIndent: { paddingLeft: 46 },
    rowIcon: { width: 20, textAlign: 'center' },
    rowLabel: { flex: 1, fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.textPrimary },
    rowSublabel: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted, marginTop: 2 },
    rowValue: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted },
    planBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, borderWidth: 1, padding: 16 },
    planName: { fontFamily: fonts.display, fontSize: 18 },
    planSub: { fontFamily: fonts.body, fontSize: 13, marginTop: 2 },
    planUpgrade: { fontFamily: fonts.bodyBold, fontSize: 14 },
    signOut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: spacing.lg, padding: 16, borderWidth: 1, borderColor: colors.danger + '40', borderRadius: 14, backgroundColor: colors.danger + '0D' },
    signOutText: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.danger },
    deleteBtn: { alignItems: 'center', marginTop: spacing.sm, paddingVertical: 12 },
    deleteBtnText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.danger },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
    modalBox: { width: '100%', borderRadius: 20, borderWidth: 1, padding: spacing.lg, gap: spacing.md },
    modalTitle: { fontFamily: fonts.display, fontSize: 22, textAlign: 'center' },
    modalBody: { fontFamily: fonts.body, fontSize: 14, lineHeight: 21, textAlign: 'center' },
    modalDangerBtn: { borderRadius: 12, height: 50, alignItems: 'center', justifyContent: 'center' },
    modalDangerBtnText: { fontFamily: fonts.bodyBold, fontSize: 15, color: '#fff' },
    modalCancelText: { fontFamily: fonts.body, fontSize: 14, textAlign: 'center' },
    toast: { position: 'absolute', bottom: 40, left: spacing.lg, right: spacing.lg, borderRadius: 12, borderWidth: 1, padding: 14, alignItems: 'center' },
    toastText: { fontFamily: fonts.bodyMedium, fontSize: 14 },
  })
}
