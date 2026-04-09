import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '../../context/ThemeContext'
import { fonts } from '../../constants/fonts'

const TYPE_ICON_LABELS = {
  checkin: '✓',
  streak: '~',
  milestone: '◆',
  badge: '★',
}

const TYPE_COLORS_MAP = {
  checkin: 'success',
  streak: null,
  milestone: 'accent',
  badge: 'info',
}

function timeAgo(isoString) {
  const diff = (Date.now() - new Date(isoString).getTime()) / 1000
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`
  return `${Math.round(diff / 86400)}d ago`
}

export default function ActivityFeed({ notifications }) {
  const { colors } = useTheme()

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Today</Text>
      {notifications.map(item => {
        const colorKey = TYPE_COLORS_MAP[item.type]
        const iconColor = colorKey ? colors[colorKey] : '#F97316'
        const label = TYPE_ICON_LABELS[item.type] ?? '·'
        return (
          <View key={item.id} style={[styles.item, { borderBottomColor: colors.border }]}>
            <View style={[styles.icon, { backgroundColor: iconColor + '1A' }]}>
              <Text style={[styles.iconText, { color: iconColor }]}>{label}</Text>
            </View>
            <View style={styles.text}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>{item.title}</Text>
              <Text style={[styles.body, { color: colors.textSecondary }]} numberOfLines={2}>{item.body}</Text>
            </View>
            <Text style={[styles.time, { color: colors.textMuted }]}>{timeAgo(item.created_at)}</Text>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 2 },
  sectionTitle: { fontFamily: fonts.bodyBold, fontSize: 16, marginBottom: 8 },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  icon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  iconText: { fontSize: 14, fontWeight: '700' },
  text: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.bodyMedium, fontSize: 13 },
  body: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17 },
  time: { fontFamily: fonts.body, fontSize: 11, flexShrink: 0 },
})
