import { View, Text, Image, StyleSheet } from 'react-native'
import { useTheme } from '../../context/ThemeContext'

const AVATAR_COLORS = ['#E8A838', '#3ECFAA', '#5B9CF6', '#E85D4A', '#9B72CF']

export default function Avatar({ name, uri, size = 40, style }) {
  const { colors } = useTheme()
  const initials = name ? name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase() : '?'
  const colorIndex = name ? name.charCodeAt(0) % AVATAR_COLORS.length : 0

  if (uri) {
    return <Image source={{ uri }} style={[{ width: size, height: size, borderRadius: size / 2 }, style]} />
  }

  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: AVATAR_COLORS[colorIndex] + '30', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }, style]}>
      <Text style={{ fontSize: size * 0.35, color: AVATAR_COLORS[colorIndex], fontWeight: '700' }}>{initials}</Text>
    </View>
  )
}
