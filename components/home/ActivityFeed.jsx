import { View, Text, StyleSheet } from 'react-native'
import { colors } from '../../constants/colors'
import { fonts } from '../../constants/fonts'

const typeConfig = {
  checkin:   { color: colors.success,   label: '✓' },
  streak:    { color: '#F97316',         label: '~' },
  milestone: { color: colors.accent,    label: '◆' },
  badge:     { color: colors.info,      label: '★' },
}

function timeAgo(isoString) {
  const diff = (Date.now() - new Date(isoString).getTime()) / 1000
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`
  return `${Math.round(diff / 86400)}d ago`
}

export default function ActivityFeed({ notifications }) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Today</Text>
      {notifications.map(item => {
        const config = typeConfig[item.type] ?? { color: colors.textMuted, label: '·' }
        return (
          <View key={item.id} style={styles.item}>
            <View style={[styles.icon, { backgroundColor: config.color + '1A' }]}>
              <Text style={[styles.iconText, { color: config.color }]}>{config.label}</Text>
            </View>
            <View style={styles.text}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
            </View>
            <Text style={styles.time}>{timeAgo(item.created_at)}</Text>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 2 },
  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconText: { fontSize: 14, fontWeight: '700' },
  text: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.textPrimary },
  body: { fontFamily: fonts.body, fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
  time: { fontFamily: fonts.body, fontSize: 11, color: colors.textMuted, flexShrink: 0 },
})
