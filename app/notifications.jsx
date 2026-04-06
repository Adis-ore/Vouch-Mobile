import { useState, useMemo } from 'react'
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { fonts } from '../constants/fonts'
import { spacing } from '../constants/spacing'
import { useTheme } from '../context/ThemeContext'
import { NOTIFICATIONS } from '../data/dummy'

const TYPE_ICONS = {
  checkin: 'checkmark-outline',
  milestone: 'flag-outline',
  message: 'chatbubble-outline',
  system: 'information-circle-outline',
  streak: 'flame',
  badge: 'ribbon-outline',
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function Notifications() {
  const router = useRouter()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const [items, setItems] = useState(NOTIFICATIONS)

  const markAllRead = () => setItems(prev => prev.map(n => ({ ...n, read: true })))
  const markRead = (id) => setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  const unreadCount = items.filter(n => !n.read).length

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} activeOpacity={0.7}>
            <Text style={styles.markAll}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}><Text style={styles.emptyText}>Nothing here yet.</Text></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={n => n.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.row, !item.read && styles.rowUnread]} onPress={() => markRead(item.id)} activeOpacity={0.75}>
              <View style={[styles.iconBox, !item.read && styles.iconBoxUnread]}>
                <Ionicons name={TYPE_ICONS[item.type] ?? 'ellipse-outline'} size={16} color={!item.read ? colors.accent : colors.textMuted} />
              </View>
              <View style={styles.rowBody}>
                <Text style={[styles.rowTitle, !item.read && styles.rowTitleUnread]}>{item.title}</Text>
                {item.body ? <Text style={styles.rowBody2} numberOfLines={2}>{item.body}</Text> : null}
                <Text style={styles.rowTime}>{timeAgo(item.created_at)}</Text>
              </View>
              {!item.read && <View style={styles.dot} />}
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      )}
    </SafeAreaView>
  )
}

function makeStyles(colors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm, gap: 12 },
    backBtn: { padding: 4 },
    title: { flex: 1, fontFamily: fonts.display, fontSize: 22, color: colors.textPrimary },
    markAll: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.accent },
    list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 14, borderRadius: 12 },
    rowUnread: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.accent + '30', paddingHorizontal: 12, marginHorizontal: -spacing.xs },
    iconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
    iconBoxUnread: { backgroundColor: 'rgba(232,168,56,0.12)' },
    rowBody: { flex: 1, gap: 3 },
    rowTitle: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
    rowTitleUnread: { color: colors.textPrimary },
    rowBody2: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, lineHeight: 18 },
    rowTime: { fontFamily: fonts.body, fontSize: 11, color: colors.textMuted },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, marginTop: 6 },
    sep: { height: 4 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyText: { fontFamily: fonts.body, fontSize: 15, color: colors.textMuted },
  })
}
