import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '../../context/ThemeContext'
import { fonts } from '../../constants/fonts'
import Avatar from '../shared/Avatar'

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function ChatBubble({ message, isOwn, showAvatar }) {
  const { colors } = useTheme()

  if (message.type === 'system') {
    return (
      <View style={styles.systemWrap}>
        <Text style={[styles.systemText, { color: colors.textMuted }]}>{message.content}</Text>
      </View>
    )
  }

  return (
    <View style={[styles.row, isOwn && styles.rowOwn]}>
      {!isOwn && (
        showAvatar
          ? <Avatar name={message.user?.full_name} size={28} style={styles.avatar} />
          : <View style={styles.avatarPlaceholder} />
      )}
      <View style={[styles.bubble, isOwn ? { backgroundColor: colors.accent, borderBottomRightRadius: 4 } : { backgroundColor: colors.surfaceAlt, borderBottomLeftRadius: 4 }]}>
        {!isOwn && showAvatar && <Text style={[styles.senderName, { color: colors.textMuted }]}>{message.user?.full_name}</Text>}
        <Text style={[styles.text, { color: isOwn ? colors.bg : colors.textPrimary }]}>{message.content}</Text>
        <Text style={[styles.time, { color: isOwn ? colors.bg + 'AA' : colors.textMuted }]}>{formatTime(message.created_at)}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 4, paddingHorizontal: 16 },
  rowOwn: { flexDirection: 'row-reverse' },
  avatar: { flexShrink: 0, marginBottom: 2 },
  avatarPlaceholder: { width: 28 },
  bubble: { maxWidth: '75%', borderRadius: 16, padding: 10, gap: 3 },
  senderName: { fontFamily: fonts.bodyMedium, fontSize: 11, marginBottom: 2 },
  text: { fontFamily: fonts.body, fontSize: 14, lineHeight: 19 },
  time: { fontFamily: fonts.body, fontSize: 10, alignSelf: 'flex-end' },
  systemWrap: { alignItems: 'center', paddingVertical: 10, paddingHorizontal: 24 },
  systemText: { fontFamily: fonts.body, fontSize: 12, fontStyle: 'italic', textAlign: 'center' },
})
