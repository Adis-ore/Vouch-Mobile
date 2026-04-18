import { useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, Animated, Share, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../context/ThemeContext'
import { fonts } from '../../constants/fonts'
import Avatar from '../shared/Avatar'

const CATEGORY_COLORS = {
  Learning: '#5B9CF6',
  Fitness: '#3ECFAA',
  Habit: '#E8A838',
  Career: '#9B72CF',
  Faith: '#F0A500',
  Finance: '#E85D4A',
  Custom: '#8A8680',
}

export default function JourneyCard({ journey, index = 0, onJoin }) {
  const router = useRouter()
  const { colors } = useTheme()
  const opacity = useRef(new Animated.Value(0)).current
  const translateY = useRef(new Animated.Value(18)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 350, delay: index * 80, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 350, delay: index * 80, useNativeDriver: true }),
    ]).start()
  }, [])

  const spotsLeft = journey.max_participants - journey.current_participants
  const catColor = CATEGORY_COLORS[journey.category] ?? colors.textMuted

  const handleShare = async (e) => {
    try {
      await Share.share({
        message: `Check out this journey on Vouch: "${journey.title}" — ${journey.duration_days} days. Join here: https://vouch.app/journey/${journey.id}`,
      })
    } catch (_) {}
  }

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => onJoin ? onJoin() : router.push(`/journey/${journey.id}`)}
        activeOpacity={0.88}
      >
        <View style={[styles.cover, { backgroundColor: catColor + '22' }]}>
          {journey.cover_image_url ? (
            <Image
              source={{ uri: journey.cover_image_url }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : null}
          <View style={styles.coverBadges}>
            <View style={[styles.catBadge, { backgroundColor: catColor + '22', borderColor: catColor + '44' }]}>
              <Text style={[styles.catText, { color: catColor }]}>{journey.category}</Text>
            </View>
            {journey.stake_amount > 0 ? (
              <View style={styles.stakeBadge}>
                <Text style={[styles.stakeText, { color: colors.danger }]}>₦{journey.stake_amount.toLocaleString()} stake</Text>
              </View>
            ) : (
              <View style={styles.freeBadge}>
                <Text style={[styles.freeText, { color: colors.success }]}>Free</Text>
              </View>
            )}
          </View>
          {/* Share icon top-right */}
          <TouchableOpacity style={[styles.shareIconBtn, { backgroundColor: colors.bg + 'CC' }]} onPress={handleShare} activeOpacity={0.8} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <Ionicons name="share-social-outline" size={14} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={[styles.coverShape, { borderColor: catColor + '33' }]} />
        </View>

        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>{journey.title}</Text>
          <View style={styles.creatorRow}>
            <Avatar name={journey.creator.full_name} size={20} />
            <Text style={[styles.creatorName, { color: colors.textSecondary }]}>{journey.creator.full_name}</Text>
            <Text style={[styles.rep, { color: colors.accent }]}>★ {journey.creator.reputation_score}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="location-outline" size={11} color={colors.textMuted} />
            <Text style={[styles.location, { color: colors.textMuted }]}>{journey.region}, {journey.country}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>{journey.duration_days} days</Text>
            <Text style={[styles.metaDot, { color: colors.textMuted }]}>·</Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>{journey.current_participants}/{journey.max_participants} members</Text>
          </View>

          {journey.join_window && (
            <View style={[
              styles.windowChip,
              journey.join_window.state === 'waiting' && { backgroundColor: '#E8A83818', borderColor: '#E8A83844' },
              journey.join_window.state === 'open'    && { backgroundColor: '#3ECFAA18', borderColor: '#3ECFAA44' },
              journey.join_window.state === 'closed'  && { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
            ]}>
              <Text style={[
                styles.windowChipText,
                journey.join_window.state === 'waiting' && { color: '#E8A838' },
                journey.join_window.state === 'open'    && { color: '#3ECFAA' },
                journey.join_window.state === 'closed'  && { color: colors.textMuted },
              ]}>{journey.join_window.text}</Text>
            </View>
          )}

          <View style={styles.footer}>
            <Text style={[styles.spots, { color: colors.textMuted }]}>{spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left` : 'Full'}</Text>
            {spotsLeft > 0 && onJoin && (
              <TouchableOpacity
                style={[styles.joinBtn, { backgroundColor: colors.accent }]}
                onPress={(e) => { e.stopPropagation?.(); onJoin() }}
                activeOpacity={0.8}
              >
                <Text style={[styles.joinText, { color: colors.bg }]}>Join →</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 12 },
  cover: { height: 110, position: 'relative', alignItems: 'flex-start', justifyContent: 'flex-end', padding: 10 },
  coverBadges: { flexDirection: 'row', gap: 6 },
  catBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  catText: { fontFamily: fonts.bodyMedium, fontSize: 11 },
  stakeBadge: { backgroundColor: 'rgba(232,93,74,0.15)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(232,93,74,0.3)' },
  stakeText: { fontFamily: fonts.bodyMedium, fontSize: 11 },
  freeBadge: { backgroundColor: 'rgba(62,207,170,0.15)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(62,207,170,0.3)' },
  freeText: { fontFamily: fonts.bodyMedium, fontSize: 11 },
  shareIconBtn: { position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  coverShape: { position: 'absolute', right: 50, top: 20, width: 60, height: 60, borderRadius: 30, borderWidth: 1.5 },
  content: { padding: 14, gap: 8 },
  title: { fontFamily: fonts.display, fontSize: 16, lineHeight: 22 },
  creatorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  creatorName: { fontFamily: fonts.body, fontSize: 12, flex: 1 },
  rep: { fontFamily: fonts.bodyMedium, fontSize: 11 },
  location: { fontFamily: fonts.body, fontSize: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meta: { fontFamily: fonts.body, fontSize: 12 },
  metaDot: {},
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  spots: { fontFamily: fonts.body, fontSize: 12 },
  joinBtn: { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  joinText: { fontFamily: fonts.bodyBold, fontSize: 13 },
})
