import { useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as WebBrowser from 'expo-web-browser'
import { Linking } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { fonts } from '../constants/fonts'
import { spacing } from '../constants/spacing'
import { useTheme } from '../context/ThemeContext'
import { apiGetDrafts, apiDeleteFormDraft, apiRetryPayment, apiShelveJourneyDraft } from '../utils/api'
import { logger } from '../utils/logger'
import { FEATURES } from '../constants/features'
import ComingSoonModal from '../components/shared/ComingSoonModal'

export default function Drafts() {
  const router = useRouter()
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const [loading, setLoading] = useState(true)
  const [formDrafts, setFormDrafts] = useState([])
  const [journeyDrafts, setJourneyDrafts] = useState([])
  const [retrying, setRetrying] = useState(null)
  const [comingSoonVisible, setComingSoonVisible] = useState(false)

  const load = async () => {
    try {
      const res = await apiGetDrafts()
      setFormDrafts(res.data.formDrafts || [])
      setJourneyDrafts(res.data.journeyDrafts || [])
    } catch (err) {
      logger.error('[DRAFTS]', 'Failed to load drafts', err.message)
    } finally { setLoading(false) }
  }

  useFocusEffect(useCallback(() => { load() }, []))

  const deleteFormDraft = (id) => {
    Alert.alert('Delete draft?', 'This will permanently remove your saved progress.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await apiDeleteFormDraft(id)
            setFormDrafts(prev => prev.filter(d => d.id !== id))
          } catch (_) {}
        }
      }
    ])
  }

  const retryPayment = async (journeyId) => {
    if (!FEATURES.PAYMENTS_ENABLED) {
      setComingSoonVisible(true)
      return
    }
    setRetrying(journeyId)
    try {
      const res = await apiRetryPayment(journeyId)
      if (!res.payment_url) {
        // No payment needed — journey is now open
        load()
        return router.push(`/journey/${journeyId}`)
      }
      await WebBrowser.openAuthSessionAsync(res.payment_url, 'vouch://')
      await load()
    } catch (err) {
      logger.error('[DRAFTS]', 'Retry payment failed', err.message)
      Alert.alert('Error', err.message)
    } finally { setRetrying(null) }
  }

  const continueDraft = (draft) => {
    router.push({ pathname: '/journey/create', params: { draft_id: draft.id, draft_data: JSON.stringify(draft.form_data), draft_step: draft.step } })
  }

  const isEmpty = formDrafts.length === 0 && journeyDrafts.length === 0

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Drafts</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 60 }} />
      ) : isEmpty ? (
        <View style={styles.empty}>
          <Ionicons name="document-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No drafts</Text>
          <Text style={styles.emptyBody}>Unfinished journeys and failed payments will appear here.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {journeyDrafts.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>AWAITING PAYMENT</Text>
              {journeyDrafts.map(j => (
                <View key={j.id} style={[styles.card, { borderColor: j.status === 'pending_payment' ? colors.accent + '40' : colors.border }]}>
                  <View style={styles.cardTop}>
                    <View style={styles.cardBadge}>
                      <Text style={[styles.cardBadgeText, { color: j.status === 'pending_payment' ? colors.accent : colors.textMuted }]}>
                        {j.status === 'pending_payment' ? 'Payment pending' : 'Draft'}
                      </Text>
                    </View>
                    {j.stake_amount > 0 && (
                      <Text style={[styles.stakeLabel, { color: colors.textMuted }]}>₦{Number(j.stake_amount).toLocaleString()} deposit</Text>
                    )}
                  </View>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{j.title || 'Untitled journey'}</Text>
                  {j.category && <Text style={[styles.cardMeta, { color: colors.textMuted }]}>{j.category} · {j.duration_days}d</Text>}
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={[styles.retryBtn, { borderColor: colors.accent }]}
                      onPress={() => retryPayment(j.id)}
                      disabled={retrying === j.id}
                      activeOpacity={0.85}
                    >
                      {retrying === j.id
                        ? <ActivityIndicator size="small" color={colors.accent} />
                        : <Text style={[styles.retryBtnText, { color: colors.accent }]}>
                            {j.stake_amount > 0 ? 'Complete deposit →' : 'Publish journey →'}
                          </Text>
                      }
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.viewBtn, { borderColor: colors.border }]}
                      onPress={() => router.push(`/journey/${j.id}`)}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.viewBtnText, { color: colors.textSecondary }]}>View</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </>
          )}

          {formDrafts.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: journeyDrafts.length > 0 ? spacing.lg : 0 }]}>INCOMPLETE CREATIONS</Text>
              {formDrafts.map(d => {
                const data = d.form_data || {}
                return (
                  <View key={d.id} style={[styles.card, { borderColor: colors.border }]}>
                    <View style={styles.cardTop}>
                      <View style={[styles.cardBadge, { backgroundColor: colors.surfaceAlt }]}>
                        <Text style={[styles.cardBadgeText, { color: colors.textMuted }]}>Step {d.step} of 5</Text>
                      </View>
                      <Text style={[styles.cardMeta, { color: colors.textMuted }]}>
                        {new Date(d.updated_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                      {data.title?.trim() || 'Untitled draft'}
                    </Text>
                    {data.category && <Text style={[styles.cardMeta, { color: colors.textMuted }]}>{data.category}</Text>}
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={[styles.retryBtn, { borderColor: colors.accent }]}
                        onPress={() => continueDraft(d)}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.retryBtnText, { color: colors.accent }]}>Continue →</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.viewBtn, { borderColor: colors.border }]}
                        onPress={() => deleteFormDraft(d.id)}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )
              })}
            </>
          )}
        </ScrollView>
      )}

      <ComingSoonModal
        visible={comingSoonVisible}
        onClose={() => setComingSoonVisible(false)}
        featureName="Journey Pass"
      />
    </SafeAreaView>
  )
}

function makeStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    title: { fontFamily: fonts.display, fontSize: 22, color: colors.textPrimary },
    scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    sectionLabel: { fontFamily: fonts.bodyMedium, fontSize: 11, color: colors.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
    card: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
    cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cardBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: colors.accent + '18' },
    cardBadgeText: { fontFamily: fonts.bodyMedium, fontSize: 11 },
    stakeLabel: { fontFamily: fonts.body, fontSize: 12 },
    cardTitle: { fontFamily: fonts.display, fontSize: 18, lineHeight: 24 },
    cardMeta: { fontFamily: fonts.body, fontSize: 13 },
    cardActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
    retryBtn: { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
    retryBtnText: { fontFamily: fonts.bodyBold, fontSize: 14 },
    viewBtn: { width: 44, height: 44, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    viewBtnText: { fontFamily: fonts.bodyMedium, fontSize: 13 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: spacing.xl },
    emptyTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.textPrimary },
    emptyBody: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  })
}
