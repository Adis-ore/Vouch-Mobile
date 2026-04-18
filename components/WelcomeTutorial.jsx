import { useState, useRef } from 'react'
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView, Dimensions } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../context/ThemeContext'
import { fonts } from '../constants/fonts'
import { spacing } from '../constants/spacing'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const SLIDES = [
  {
    icon: 'compass-outline',
    title: 'Find your journey',
    body: 'Browse open journeys in your area or create your own. Any goal — learning, fitness, habits, or faith.',
  },
  {
    icon: 'people-outline',
    title: 'Grow with partners',
    body: 'Get matched with people working toward the same goal. You hold each other accountable every day.',
  },
  {
    icon: 'checkmark-circle-outline',
    title: 'Check in daily',
    body: 'Submit your daily check-in with a note or proof. Your group sees your progress in real time.',
  },
  {
    icon: 'flame-outline',
    title: 'Build your streak',
    body: 'Every check-in grows your streak. Miss a day and it resets. Consistency is the whole game.',
  },
]

export default function WelcomeTutorial({ visible, onDone }) {
  const { colors } = useTheme()
  const [slide, setSlide] = useState(0)
  const scrollRef = useRef(null)

  const goTo = (index) => {
    setSlide(index)
    scrollRef.current?.scrollTo({ x: SCREEN_WIDTH * index, animated: true })
  }

  const handleNext = () => {
    if (slide < SLIDES.length - 1) {
      goTo(slide + 1)
    } else {
      onDone()
    }
  }

  const handleScroll = (e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
    if (index !== slide) setSlide(index)
  }

  const current = SLIDES[slide]

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={[styles.overlay, { backgroundColor: colors.bg }]}>
        <TouchableOpacity style={styles.skipBtn} onPress={onDone} activeOpacity={0.7}>
          <Text style={[styles.skipText, { color: colors.textMuted }]}>Skip</Text>
        </TouchableOpacity>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          scrollEventThrottle={16}
          style={styles.pager}
        >
          {SLIDES.map((s, i) => (
            <View key={i} style={[styles.slide, { width: SCREEN_WIDTH }]}>
              <View style={[styles.iconWrap, { backgroundColor: colors.accent + '18', borderColor: colors.accent + '30' }]}>
                <Ionicons name={s.icon} size={52} color={colors.accent} />
              </View>
              <Text style={[styles.slideTitle, { color: colors.textPrimary }]}>{s.title}</Text>
              <Text style={[styles.slideBody, { color: colors.textSecondary }]}>{s.body}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goTo(i)} activeOpacity={0.7}>
              <View style={[styles.dot, { backgroundColor: i === slide ? colors.accent : colors.border }]} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={[styles.nextBtn, { backgroundColor: colors.accent }]} onPress={handleNext} activeOpacity={0.85}>
          <Text style={[styles.nextBtnText, { color: colors.bg }]}>
            {slide === SLIDES.length - 1 ? "Let's go" : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, paddingTop: 60, paddingBottom: spacing.xl },
  skipBtn: { position: 'absolute', top: 16, right: spacing.lg, zIndex: 10, padding: 8 },
  skipText: { fontFamily: fonts.bodyMedium, fontSize: 14 },
  pager: { flex: 1 },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, gap: 20 },
  iconWrap: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  slideTitle: { fontFamily: fonts.display, fontSize: 28, textAlign: 'center', lineHeight: 34 },
  slideBody: { fontFamily: fonts.body, fontSize: 16, textAlign: 'center', lineHeight: 24 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: spacing.md },
  dot: { width: 8, height: 8, borderRadius: 4 },
  nextBtn: { marginHorizontal: spacing.lg, borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center' },
  nextBtnText: { fontFamily: fonts.bodyBold, fontSize: 16 },
})
