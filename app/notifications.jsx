import { useState, useMemo } from 'react'
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { PanGestureHandler } from 'react-native-gesture-handler'
import Animated, {
  useAnimatedGestureHandler,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated'
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

const SWIPE_THRESHOLD = 80

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function filterStale(notifications) {
  const cutoff = Date.now() - 8 * 60 * 60 * 1000
  return notifications.filter(n => !n.read || new Date(n.created_at).getTime() > cutoff)
}

function NotificationRow({ item, onDismiss, onNavigate, colors, styles }) {
  const translateX = useSharedValue(0)

  const gestureHandler = useAnimatedGestureHandler({
    onActive: (event) => {
      translateX.value = event.translationX
    },
    onEnd: (event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        // Right swipe → dismiss
        translateX.value = withSpring(600, { damping: 20 }, () => {
          runOnJS(onDismiss)(item.id)
        })
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        // Left swipe → open
        translateX.value = withSpring(0, { damping: 20 })
        runOnJS(onNavigate)(item)
      } else {
        translateX.value = withSpring(0, { damping: 20 })
      }
    },
  })

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    borderRadius: 16,
  }))

  // Red peek on right swipe
  const dismissBgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolate.CLAMP),
  }))

  // Gold peek on left swipe
  const openBgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], Extrapolate.CLAMP),
  }))

  return (
    <View style={{ position: 'relative', marginBottom: 0 }}>
      {/* Dismiss background (red, left side) */}
      <Animated.View style={[styles.swipeBgLeft, { backgroundColor: colors.danger }, dismissBgStyle]}>
        <Ionicons name="trash-outline" size={20} color="#fff" />
        <Text style={styles.swipeBgText}>Clear</Text>
      </Animated.View>

      {/* Open background (gold, right side) */}
      <Animated.View style={[styles.swipeBgRight, { backgroundColor: colors.accent }, openBgStyle]}>
        <Ionicons name="arrow-forward-outline" size={20} color={colors.bg} />
        <Text style={[styles.swipeBgText, { color: colors.bg }]}>Open</Text>
      </Animated.View>

      <PanGestureHandler onGestureEvent={gestureHandler} activeOffsetX={[-10, 10]}>
        <Animated.View style={rowStyle}>
          <TouchableOpacity
            style={[styles.row, !item.read && styles.rowUnread, { backgroundColor: colors.bg }]}
            onPress={() => onNavigate(item)}
            activeOpacity={0.75}
          >
            <View style={[styles.iconBox, !item.read && styles.iconBoxUnread]}>
              <Ionicons
                name={TYPE_ICONS[item.type] ?? 'ellipse-outline'}
                size={16}
                color={!item.read ? colors.accent : colors.textMuted}
              />
            </View>
            <View style={styles.rowBody}>
              <Text style={[styles.rowTitle, !item.read && styles.rowTitleUnread]}>{item.title}</Text>
              {item.body ? <Text style={styles.rowBody2} numberOfLines={2}>{item.body}</Text> : null}
              <Text style={styles.rowTime}>{timeAgo(item.created_at)}</Text>
            </View>
            {!item.read && <View style={styles.dot} />}
          </TouchableOpacity>
        </Animated.View>
      </PanGestureHandler>
    </View>
  )
}

export default function Notifications() {
  const router = useRouter()
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])
  const [items, setItems] = useState(() => filterStale(NOTIFICATIONS))

  const markAllRead = () => setItems(prev => prev.map(n => ({ ...n, read: true })))
  const markRead = (id) => setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  const dismiss = (id) => setItems(prev => prev.filter(n => n.id !== id))

  const navigate = (item) => {
    markRead(item.id)
    if (item.route) router.push({ pathname: item.route, params: item.params ?? {} })
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
              <Text style={[styles.headerAction, { color: colors.textSecondary }]}>Mark read</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="notifications-off-outline" size={40} color={colors.textMuted} />
          <Text style={styles.emptyText}>Nothing here yet.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={n => n.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          renderItem={({ item }) => (
            <NotificationRow
              item={item}
              onDismiss={dismiss}
              onNavigate={navigate}
              colors={colors}
              styles={styles}
            />
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
    rowBody: { flex: 1, gap: 3 },
    rowTitle: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
    rowTitleUnread: { color: colors.textPrimary },
    rowBody2: { fontFamily: fonts.body, fontSize: 13, color: colors.textMuted, lineHeight: 18 },
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
