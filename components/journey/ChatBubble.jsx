import { useState } from 'react'
import { View, Text, StyleSheet, Modal, TouchableOpacity, Pressable, TextInput } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../context/ThemeContext'
import { fonts } from '../../constants/fonts'
import Avatar from '../shared/Avatar'

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatGroupTime(iso) {
  const d = new Date(iso)
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) + ' · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function ChatBubble({ message, isOwn, showAvatar, showTimestamp, onEdit, onDelete }) {
  const { colors } = useTheme()
  const [menuVisible, setMenuVisible] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editText, setEditText] = useState(message.content)

  if (message.type === 'system') {
    return (
      <View style={styles.systemWrap}>
        <Text style={[styles.systemText, { color: colors.textMuted }]}>{message.content}</Text>
      </View>
    )
  }

  const timestampHeader = showTimestamp ? (
    <View style={styles.timestampRow}>
      <Text style={[styles.timestampText, { color: colors.textMuted }]}>{formatGroupTime(message.created_at)}</Text>
    </View>
  ) : null

  const handleLongPress = () => {
    if (isOwn) setMenuVisible(true)
  }

  const startEdit = () => {
    setEditText(message.content)
    setEditMode(true)
    setMenuVisible(false)
  }

  const submitEdit = () => {
    if (editText.trim() && editText.trim() !== message.content) {
      onEdit?.(message.id, editText.trim())
    }
    setEditMode(false)
  }

  const handleDelete = () => {
    setMenuVisible(false)
    onDelete?.(message.id)
  }

  return (
    <>
      {timestampHeader}
      <View style={[styles.row, isOwn && styles.rowOwn]}>
        {!isOwn && (
          showAvatar
            ? <Avatar name={message.sender?.full_name || message.user?.full_name} size={28} style={styles.avatar} />
            : <View style={styles.avatarPlaceholder} />
        )}
        <TouchableOpacity
          onLongPress={handleLongPress}
          delayLongPress={400}
          activeOpacity={0.85}
        >
          <View style={[styles.bubble, isOwn ? { backgroundColor: colors.accent, borderBottomRightRadius: 4 } : { backgroundColor: colors.surfaceAlt, borderBottomLeftRadius: 4 }]}>
            {!isOwn && showAvatar && <Text style={[styles.senderName, { color: colors.textMuted }]}>{message.sender?.full_name || message.user?.full_name}</Text>}
            {editMode ? (
              <TextInput
                style={[styles.editInput, { color: colors.bg, borderColor: colors.bg + '50' }]}
                value={editText}
                onChangeText={setEditText}
                onSubmitEditing={submitEdit}
                onBlur={submitEdit}
                autoFocus
                multiline
              />
            ) : (
              <Text style={[styles.text, { color: isOwn ? colors.bg : colors.textPrimary }]}>
                {message.content}
                {message.edited_at ? <Text style={[styles.edited, { color: isOwn ? colors.bg + 'AA' : colors.textMuted }]}> (edited)</Text> : null}
              </Text>
            )}
            <Text style={[styles.time, { color: isOwn ? colors.bg + 'AA' : colors.textMuted }]}>{formatTime(message.created_at)}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setMenuVisible(false)}>
          <View style={[styles.menu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity style={styles.menuItem} onPress={startEdit} activeOpacity={0.8}>
              <Ionicons name="create-outline" size={18} color={colors.textPrimary} />
              <Text style={[styles.menuText, { color: colors.textPrimary }]}>Edit</Text>
            </TouchableOpacity>
            <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={styles.menuItem} onPress={handleDelete} activeOpacity={0.8}>
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
              <Text style={[styles.menuText, { color: colors.danger }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
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
  edited: { fontFamily: fonts.body, fontSize: 11 },
  editInput: { fontFamily: fonts.body, fontSize: 14, lineHeight: 19, borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, minWidth: 100 },
  time: { fontFamily: fonts.body, fontSize: 10, alignSelf: 'flex-end' },
  systemWrap: { alignItems: 'center', paddingVertical: 10, paddingHorizontal: 24 },
  systemText: { fontFamily: fonts.body, fontSize: 12, fontStyle: 'italic', textAlign: 'center' },
  timestampRow: { alignItems: 'center', paddingVertical: 8 },
  timestampText: { fontFamily: fonts.body, fontSize: 11 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  menu: { borderRadius: 14, borderWidth: 1, minWidth: 160, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 18 },
  menuText: { fontFamily: fonts.bodyMedium, fontSize: 15 },
  menuDivider: { height: 1 },
})
