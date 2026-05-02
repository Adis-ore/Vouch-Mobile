import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../context/ThemeContext'
import { fonts } from '../../constants/fonts'
import { spacing } from '../../constants/spacing'

export default function ComingSoonModal({ visible, onClose, featureName }) {
  const { colors } = useTheme()

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>

          <View style={[styles.iconWrap, { backgroundColor: colors.accent + '18' }]}>
            <Ionicons name="time-outline" size={32} color={colors.accent} />
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>Coming Soon</Text>

          <Text style={[styles.body, { color: colors.textSecondary }]}>
            {featureName ? `${featureName} is almost ready.` : 'Payments are almost ready.'}
            {'\n\n'}
            We are finalising our payment system. You will be notified the moment it goes live — early users get first access.
          </Text>

          <View style={[styles.notifyCard, { backgroundColor: colors.surfaceAlt }]}>
            <Ionicons name="notifications-outline" size={16} color={colors.accent} />
            <Text style={[styles.notifyText, { color: colors.textPrimary }]}>
              You will be notified when this launches
            </Text>
          </View>

          <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.accent }]} onPress={onClose} activeOpacity={0.85}>
            <Text style={[styles.closeBtnText, { color: colors.bg }]}>Got it</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    paddingBottom: 44,
    alignItems: 'center',
    gap: 16,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  notifyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    padding: 12,
    width: '100%',
  },
  notifyText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    flex: 1,
  },
  closeBtn: {
    borderRadius: 12,
    paddingVertical: 15,
    width: '100%',
    alignItems: 'center',
  },
  closeBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
  },
})
