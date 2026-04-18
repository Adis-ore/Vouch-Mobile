import { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Animated, PanResponder, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { fonts } from '../constants/fonts'
import { spacing } from '../constants/spacing'
import { useTheme } from '../context/ThemeContext'
import { apiGetNotifications, apiMarkNotificationRead, apiMarkAllNotificationsRead } from '../utils/api'
import { setUnreadCount, clearUnread, decrementUnread } from '../utils/notificationStore'

const TYPE_ICONS = {
  checkin: 'checkmark-outline',
  milestone: 'flag-outline',
  message: 'chatbubble-outline',
  system: 'information-circle-outline',
  streak: 'flame',
  badge: 'ribbon-outline',
  welcome: 'hand-left-outline',
  journey_started: 'rocket-outline',
  member_joined: 'person-add-outline',
  checkin_reminder: 'alarm-outline',
  partner_checkin: 'checkmark-circle-outline',
  streak_milestone: 'flame',
  streak_broken: 'alert-circle-outline',
  milestone_unlock: 'diamond-outline',
  journey_complete: 'trophy-outline',
  member_left: 'exit-outline',
  auto_abandoned: 'close-circle-outline',
}

const SWIPE_THRESHOLD = 80

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function NotificationRow({ item, onDismiss, onNavigate, colors, styles }) {
  const translateX = useRef(new Animated.Value(0)).current

  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
    onPanResponderMove: (_, g) => { translateX.setValue(g.dx) },
    onPanResponderRelease: (_, g) => {
      if (g.dx > SWIPE_THRESHOLD) {
        Animated.timing(translateX, { toValue: 600, duration: 200, useNativeDriver: true }).start(() => onDismiss(item.id))
      } else if (g.dx < -SWIPE_THRESHOLD) {
        onNavigate(item)
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start()
      } else {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start()
      }
    },
  })).current

  const dismissOpacity = translateX.interpolate({ inputRange: [0, SWIPE_THRESHOLD], outputRange: [0, 1], extrapolate: 'clamp' })
  const openOpacity = translateX.interpolate({ inputRange: [-SWIPE_THRESHOLD, 0], outputRange: [1, 0], extrapolate: 'clamp' })

  return (
    <View style={{ position: 'relative' }}>
      <Animated.View style={[styles.swipeBgLeft, { backgroundColor: colors.danger, opacity: dismissOpacity }]}>
        <Ionicons name="trash-outline" size={20} color="#fff" />
        <Text style={styles.swipeBgText}>Clear</Text>
      </Animated.View>
      <Animated.View style={[styles.swipeBgRight, { backgroundColor: colors.accent, opacity: openOpacity }]}>
        <Ionicons name="arrow-forward-outline" size={20} color={colors.bg} />
        <Text style={[styles.swipeBgText, { color: colors.bg }]}>Open</Text>
      </Animated.View>
      <Animated.View style={{ transform: [{ translateX }], borderRadius: 16 }} {...panResponder.panHandlers}>
        <TouchableOpacity
          style={[styles.row, !item.read && styles.rowUnread, { backgroundColor: colors.bg }]}
          onPress={() => onNavigate(item)}
          activeOpacity={0.75}
        >
          <View style={[styles.iconBox, !item.read && styles.iconBoxUnread]}>
            <Ionicons name={TYPE_ICONS[item.type] ?? 'ellipse-outline'} size={16} color={!item.read ? colors.accent : colors.textMuted} />
          </View>
          <View style={styles.rowContent}>
            <Text style={[styles.rowTitle, !item.read && styles.rowTitleUnread]}>{item.title}</Text>
            {item.body ? <Text style={styles.rowBody} numberOfLines={2}>{item.body}</Text> : null}
            <Text style={styles.rowTime}>{timeAgo(item.created_at)}</Text>
          </View>
          {!item.read && <View style={styles.dot} />}
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

export default function Notifications() {
  const router = useRouter()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await apiGetNotifications()
      setItems(res.notifications || [])
      setUnreadCount(res.unread_count ?? 0)
    } catch (_) {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const markAllRead = async () => {
    setItems(prev => prev.map(n => ({ ...n, read: true })))
    clearUnread()
    try { await apiMarkAllNotificationsRead() } catch (_) {}
  }

  const markRead = (id) => {
    setItems(prev => {
      const n = prev.find(x => x.id === id)
      if (n && !n.read) decrementUnread()
      return prev.map(x => x.id === id ? { ...x, read: true } : x)
    })
    apiMarkNotificationRead(id).catch(() => {})
  }

  const dismiss = (id) => {
    setItems(prev => {
      const n = prev.find(x => x.id === id)
      if (n && !n.read) decrementUnread()
      return prev.filter(x => x.id !== id)
    })
  }

  const navigate = (item) => {
    markRead(item.id)
    const data = item.data || {}
    const route = data.route || item.route
    if (!route) return

    switch (route) {
      case 'journey':
        if (data.journey_id) router.push(`/journey/${data.journey_id}`)
        break
      case 'milestone':
        if (data.milestone_id) router.push(`/milestone/${data.milestone_id}`)
        break
      case 'discover':
        router.replace('/(tabs)/discover')
        break
      case 'profile':
        router.replace('/(tabs)/profile')
        break
      case 'journeys':
        router.replace('/(tabs)/journeys')
        break
      default:
        if (item.route) router.push({ pathname: item.route, params: item.params ?? {} })
    }
  }

  const unreadCount = items.filter(n => !n.read).length

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllRead} activeOpacity={0.7}>
              <Text style={[styles.headerAction, { color: colors.textSecondary }]}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.empty}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="notifications-off-outline" size={40} color={colors.textMuted} />
          <Text style={styles.emptyText}>Nothing here yet.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={n => String(n.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          renderItem={({ item }) => (
            <NotificationRow item={item} onDismiss={dismiss} onNavigate={navigate} colors={colors} styles={styles} />
          )}
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
    headerActions: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    headerAction: { fontFamily: fonts.bodyMedium, fontSize: 13 },
    list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 14, paddingHorizontal: 4 },
    rowUnread: { backgroundColor: colors.surface },
    iconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
    iconBoxUnread: { backgroundColor: 'rgba(232,168,56,0.12)' },
    rowContent: { flex: 1, gap: 3 },
    rowTitle: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
    rowTitleUnread: { color: colors.textPrimary },
    rowBody: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, lineHeight: 18 },
    rowTime: { fontFamily: fonts.body, fontSize: 11, color: colors.textMuted },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, marginTop: 6 },
    sep: { height: 1, backgroundColor: colors.border },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    emptyText: { fontFamily: fonts.body, fontSize: 15, color: colors.textMuted },
    swipeBgLeft: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 100, borderRadius: 16, justifyContent: 'center', alignItems: 'center', gap: 4 },
    swipeBgRight: { position: 'absolute', top: 0, bottom: 0, right: 0, width: 100, borderRadius: 16, justifyContent: 'center', alignItems: 'center', gap: 4 },
    swipeBgText: { fontFamily: fonts.bodyMedium, fontSize: 11, color: '#fff' },
  })
}
