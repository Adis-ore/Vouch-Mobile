import { useRef } from 'react'
import { View, Text, TouchableOpacity, Share, StyleSheet, Alert } from 'react-native'
import { captureRef } from 'react-native-view-shot'
import { Ionicons } from '@expo/vector-icons'
import { fonts } from '../../constants/fonts'
import VouchLogo from './VouchLogo'

// Card types: 'journey_complete' | 'streak_7' | 'streak_30' | 'partner_matched'

const BRAND_LINES = {
  journey_complete: 'I showed up every day and finished what I started.',
  streak_7: 'Seven days straight. Accountability works.',
  streak_30: '30 days. No excuses. Just results.',
  partner_matched: 'Found my accountability partner. Watch what we build.',
}

const CARD_TITLES = {
  journey_complete: 'Journey Complete',
  streak_7: '7-Day Streak',
  streak_30: '30-Day Streak',
  partner_matched: 'New Partner Matched',
}

const CARD_ICONS = {
  journey_complete: 'trophy-outline',
  streak_7: 'flame',
  streak_30: 'flash-outline',
  partner_matched: 'people-outline',
}

// The visual card that gets captured
export function ShareCardCanvas({ type, userName, journeyTitle, streakCount, partnerName, cardRef }) {
  const line = BRAND_LINES[type] ?? ''
  const title = CARD_TITLES[type] ?? ''
  const icon = CARD_ICONS[type] ?? 'star-outline'

  return (
    <View ref={cardRef} style={styles.canvas} collapsable={false}>
      {/* Background pattern dots */}
      <View style={styles.dotTL} />
      <View style={styles.dotBR} />
      <View style={styles.dotMid} />

      {/* Top accent line */}
      <View style={styles.accentLine} />

      {/* Icon */}
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={40} color="#E8A838" />
      </View>

      {/* Card type label */}
      <Text style={styles.cardType}>{title}</Text>

      {/* User name */}
      <Text style={styles.userName}>{userName}</Text>

      {/* Journey title */}
      {journeyTitle ? (
        <View style={styles.journeyPill}>
          <Text style={styles.journeyPillText}>{journeyTitle}</Text>
        </View>
      ) : null}

      {/* Streak count */}
      {streakCount ? (
        <Text style={styles.streakNum}>{streakCount}<Text style={styles.streakUnit}> days</Text></Text>
      ) : null}

      {/* Partner name */}
      {partnerName ? (
        <Text style={styles.partnerName}>with {partnerName}</Text>
      ) : null}

      {/* Brand line */}
      <Text style={styles.brandLine}>"{line}"</Text>

      {/* Bottom — Vouch logo */}
      <View style={styles.footer}>
        <VouchLogo size={16} />
        <Text style={styles.footerText}>vouch.app</Text>
      </View>
    </View>
  )
}

// Button that triggers capture + share
export default function ShareCardButton({ type, userName, journeyTitle, streakCount, partnerName, label }) {
  const cardRef = useRef(null)

  const shareCard = async () => {
    try {
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
        width: 1080,
        height: 1920,
        result: 'tmpfile',
      })
      await Share.share({
        url: uri,
        message: `${BRAND_LINES[type] ?? ''} — Vouch app`,
        title: CARD_TITLES[type] ?? 'Vouch',
      })
    } catch (e) {
      // view-shot not available in Expo Go without dev build
      // Fall back to text share
      await Share.share({
        message: `${CARD_TITLES[type]}: ${journeyTitle ?? ''}\n${BRAND_LINES[type]}\n\nJoin me on Vouch — vouch.app`,
        title: CARD_TITLES[type] ?? 'Vouch',
      })
    }
  }

  return (
    <View>
      {/* Off-screen card for capture */}
      <View style={styles.offscreen}>
        <ShareCardCanvas
          cardRef={cardRef}
          type={type}
          userName={userName}
          journeyTitle={journeyTitle}
          streakCount={streakCount}
          partnerName={partnerName}
        />
      </View>

      <TouchableOpacity style={styles.shareBtn} onPress={shareCard} activeOpacity={0.85}>
        <Ionicons name="share-social-outline" size={16} color="#E8A838" />
        <Text style={styles.shareBtnText}>{label ?? 'Share'}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  // Share button
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
    backgroundColor: 'rgba(232,168,56,0.12)', borderWidth: 1, borderColor: 'rgba(232,168,56,0.3)',
  },
  shareBtnText: { fontFamily: fonts.bodyBold, fontSize: 14, color: '#E8A838' },

  // Canvas — 9:16 ratio card (rendered off-screen)
  offscreen: { position: 'absolute', left: -9999, top: -9999, width: 360, height: 640 },
  canvas: {
    width: 360, height: 640,
    backgroundColor: '#0A0F1E',
    alignItems: 'center', justifyContent: 'center',
    padding: 36, gap: 14, overflow: 'hidden',
  },
  accentLine: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: '#E8A838' },
  dotTL: { position: 'absolute', top: 40, left: 40, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(232,168,56,0.06)' },
  dotBR: { position: 'absolute', bottom: 60, right: 30, width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(232,168,56,0.06)' },
  dotMid: { position: 'absolute', top: '45%', left: -20, width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(232,168,56,0.04)' },

  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(232,168,56,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(232,168,56,0.25)' },
  cardType: { fontFamily: fonts.bodyMedium, fontSize: 13, color: '#E8A838', letterSpacing: 2, textTransform: 'uppercase' },
  userName: { fontFamily: fonts.display, fontSize: 30, color: '#F5F0E8', textAlign: 'center', lineHeight: 36 },
  journeyPill: { backgroundColor: 'rgba(232,168,56,0.12)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(232,168,56,0.25)' },
  journeyPillText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: '#E8A838', textAlign: 'center' },
  streakNum: { fontFamily: fonts.display, fontSize: 64, color: '#E8A838', lineHeight: 72 },
  streakUnit: { fontFamily: fonts.body, fontSize: 22, color: '#8A8680' },
  partnerName: { fontFamily: fonts.body, fontSize: 16, color: '#8A8680' },
  brandLine: { fontFamily: fonts.display, fontSize: 18, color: '#F5F0E8', textAlign: 'center', lineHeight: 26, fontStyle: 'italic', marginTop: 8 },
  footer: { position: 'absolute', bottom: 28, flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: '#4A4A52' },
})
